import { SERVER_URL, API_ROUTES } from '@warrant/shared'

export async function sendPanicAudio(audioBlob, contacts) {
  const formData = new FormData()
  formData.append('audio', audioBlob)
  formData.append('contacts', JSON.stringify(contacts))

  const res = await fetch(SERVER_URL + API_ROUTES.PANIC, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Panic request failed')
  return res.json()
}

export async function fetchReports() {
  const res = await fetch(SERVER_URL + API_ROUTES.REPORTS)
  if (!res.ok) throw new Error('Reports fetch failed')
  return res.json()
}
