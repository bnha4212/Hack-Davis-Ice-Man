const Anthropic = require('@anthropic-ai/sdk');

let client;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Parse unstructured text for geographic signals and a concise summary.
 * @param {string} text
 * @returns {Promise<{ lat: number|null, lng: number|null, city: string|null, neighborhood: string|null, summary: string, confidence: number }>}
 */
async function parseLocationFromText(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return {
      lat: null,
      lng: null,
      city: null,
      neighborhood: null,
      summary: '',
      confidence: 0,
    };
  }

  const systemPrompt = `You extract structured location intelligence from short news or social posts about immigration enforcement (ICE raids, checkpoints, deportations, migra, etc.).

Respond with ONLY a single JSON object, no markdown fences, no extra text. Use this exact shape:
{"lat": number or null, "lng": number or null, "city": string or null, "neighborhood": string or null, "summary": string, "confidence": number}

Rules:
- lat/lng: decimal degrees (WGS84) if the text clearly implies a specific place you can infer; otherwise null.
- If only a city/region is known, approximate a reasonable lat/lng for the city center or affected area; lower confidence if approximate.
- summary: one or two English sentences, factual, no speculation beyond the text.
- confidence: 0.0 to 1.0 for how confident you are that the event is real and the location is usable for a map pin.
- If the text is unrelated noise or no location can be inferred, set confidence below 0.4 and lat/lng null.`;

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Article or post text:\n\n${trimmed.slice(0, 12000)}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === 'text');
  const raw = block && block.type === 'text' ? block.text : '';

  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return {
      lat: null,
      lng: null,
      city: null,
      neighborhood: null,
      summary: trimmed.slice(0, 200),
      confidence: 0,
    };
  }

  const lat = typeof parsed.lat === 'number' && Number.isFinite(parsed.lat) ? parsed.lat : null;
  const lng = typeof parsed.lng === 'number' && Number.isFinite(parsed.lng) ? parsed.lng : null;
  const confidence =
    typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0;

  return {
    lat,
    lng,
    city: typeof parsed.city === 'string' ? parsed.city : null,
    neighborhood: typeof parsed.neighborhood === 'string' ? parsed.neighborhood : null,
    summary: typeof parsed.summary === 'string' ? parsed.summary : trimmed.slice(0, 200),
    confidence,
  };
}

module.exports = {
  parseLocationFromText,
};
