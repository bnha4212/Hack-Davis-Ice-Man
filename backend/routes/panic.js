const express = require('express')
const multer = require('multer')
const axios = require('axios')
const OpenAI = require('openai')
const Anthropic = require('@anthropic-ai/sdk')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

function getOpenAI() {
  const apiKey = (process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new OpenAI({ apiKey })
}


function getAnthropic() {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim()
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey })
}

async function transcribeAudio(buffer, mimetype) {
  const openai = getOpenAI()
  const ext = mimetype.includes('mp4') ? 'mp4' : 'webm'
  const file = new File([buffer], `audio.${ext}`, { type: mimetype })
  const result = await openai.audio.translations.create({
    file,
    model: 'whisper-1',
  })
  return result.text
}

async function generateBilingualResponse(transcript) {
  const anthropic = getAnthropic()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: `You are a legal rights assistant for immigrants. Given a user's distress message, respond with clear, calm guidance about their rights in English and Spanish. Be concise (2-3 sentences each). Reply with ONLY valid JSON: {"en": "...", "es": "..."}`,
    messages: [{ role: 'user', content: transcript }],
  })
  const raw = response.content.find((b) => b.type === 'text')?.text || '{}'
  const match = raw.match(/\{[\s\S]*\}/)
  const parsed = JSON.parse(match ? match[0] : '{}')
  return {
    responseEn: parsed.en || 'You have the right to remain silent and the right to an attorney.',
    responseEs: parsed.es || 'Tiene derecho a guardar silencio y derecho a un abogado.',
  }
}

async function sendSMSToContacts(contacts, transcript, responseEn) {
  const key = (process.env.TEXTBELT_KEY || '').trim()
  if (!key || !contacts.length) return

  const message = transcript
    ? `ICEMAN ALERT: "${transcript.slice(0, 120)}" — ${responseEn.slice(0, 100)}`
    : responseEn || 'ICEMAN ALERT — someone in your network may need help.'

  await Promise.all(
    contacts.map(async (c) => {
      try {
        const { data } = await axios.post('https://textbelt.com/text', {
          phone: c.phone,
          message,
          key,
        })
        if (data.success) {
          console.log(`[panic] SMS to ${c.phone} sent (quota remaining: ${data.quotaRemaining})`)
        } else {
          console.error(`[panic] SMS to ${c.phone} failed:`, data.error)
        }
      } catch (err) {
        console.error(`[panic] SMS to ${c.phone} error:`, err.message)
      }
    })
  )
}

// POST /api/panic  — audio + contacts → transcribe → bilingual response → SMS
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const contacts = JSON.parse(req.body.contacts || '[]')

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' })
    }

    const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype)
    const { responseEn, responseEs } = await generateBilingualResponse(transcript)

    // Fire SMS without blocking the response
    sendSMSToContacts(contacts, transcript, responseEn).catch((err) =>
      console.error('[panic] SMS error:', err.message)
    )

    res.json({ transcript, responseEn, responseEs })
  } catch (err) {
    console.error('[panic]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/panic/transcribe  — audio → Whisper → { transcript, language }
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' })
    const openai = getOpenAI()
    const ext = req.file.mimetype.includes('mp4') ? 'mp4' : 'webm'
    const file = new File([req.file.buffer], `audio.${ext}`, { type: req.file.mimetype })
    const result = await openai.audio.translations.create({ file, model: 'whisper-1', response_format: 'verbose_json' })
    res.json({ transcript: result.text?.trim() || '', language: result.language || null })
  } catch (err) {
    console.error('[panic/transcribe]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/panic/confirm  — { transcript, contacts } → Claude bilingual + Twilio SMS
router.post('/confirm', express.json(), async (req, res) => {
  try {
    const { transcript, contacts = [] } = req.body || {}
    if (!transcript) return res.status(400).json({ error: 'transcript is required' })
    const { responseEn, responseEs } = await generateBilingualResponse(transcript)
    sendSMSToContacts(contacts, transcript, responseEn).catch((err) =>
      console.error('[panic/confirm] SMS error:', err.message)
    )
    res.json({ en: responseEn, es: responseEs })
  } catch (err) {
    console.error('[panic/confirm]', err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/panic/sms  — re-send SMS manually (used from contacts screen)
router.post('/sms', express.json(), async (req, res) => {
  try {
    const { contacts, message } = req.body
    const text = message || 'ICEMAN ALERT — someone in your network may need help.'
    await sendSMSToContacts(contacts || [], text, '')
    res.json({ ok: true })
  } catch (err) {
    console.error('[panic/sms]', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
