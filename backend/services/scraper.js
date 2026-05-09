const axios = require('axios');
const Parser = require('rss-parser');
const Report = require('../models/Report');
const { parseLocationFromText } = require('./claude');

const rssParser = new Parser();

function buildPinPayload(reportDoc) {
  return {
    lat: reportDoc.lat,
    lng: reportDoc.lng,
    source: reportDoc.source,
    summary: reportDoc.summary,
    timestamp: reportDoc.createdAt.toISOString(),
  };
}

const SEARCH_TERMS = [
  'ICE raid',
  'immigration checkpoint',
  'deportation',
  'redada de ICE',
  'migra',
  'control migratorio',
];

const REDDIT_HEADERS = {
  'User-Agent': 'SafeGuardMapBot/1.0 (hackathon; contact: backend)',
};

const MAX_ITEMS_PER_RUN = 24;

/**
 * Only treat posts as ICE-related if the text explicitly mentions the agency
 * (#ICE, word ICE, or I.C.E.). Does not match unrelated uses like "police".
 */
function textMentionsIceAgency(text) {
  if (!text || typeof text !== 'string') return false;
  const s = text;
  if (/#ICE\b/i.test(s)) return true;
  if (/\bICE\b/i.test(s)) return true;
  if (/I\s*\.\s*C\s*\.\s*E\b/i.test(s)) return true;
  return false;
}

async function fetchRedditForTerm(term) {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&limit=15&sort=new`;
  const { data } = await axios.get(url, {
    headers: REDDIT_HEADERS,
    timeout: 20000,
    validateStatus: (s) => s < 500,
  });
  if (!data || !data.data || !Array.isArray(data.data.children)) {
    return [];
  }
  return data.data.children
    .map((c) => c.data)
    .filter(Boolean)
    .map((post) => ({
      kind: 'reddit',
      id: post.id || post.name || post.url,
      title: post.title || '',
      body: [post.selftext, post.url].filter(Boolean).join('\n'),
    }));
}

async function fetchGoogleNewsForTerm(term) {
  const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(term)}&hl=en-US&gl=US&ceid=US:en`;
  const feed = await rssParser.parseURL(feedUrl);
  return (feed.items || []).map((item, idx) => ({
    kind: 'news',
    id: item.guid || item.link || `${term}-${idx}`,
    title: item.title || '',
    body: [item.title, item.contentSnippet, item.content, item.link].filter(Boolean).join('\n'),
  }));
}

function dedupeItems(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function collectRawItems() {
  const batches = await Promise.all(
    SEARCH_TERMS.map(async (term) => {
      const reddit = await fetchRedditForTerm(term).catch((err) => {
        console.warn(`[scraper] Reddit fetch failed for "${term}":`, err.message);
        return [];
      });
      const news = await fetchGoogleNewsForTerm(term).catch((err) => {
        console.warn(`[scraper] Google News RSS failed for "${term}":`, err.message);
        return [];
      });
      return [...reddit, ...news];
    })
  );
  return dedupeItems(batches.flat());
}

async function processScrapedItem(item, io) {
  const text = `${item.title}\n\n${item.body}`.trim();
  if (text.length < 20) return;

  if (!textMentionsIceAgency(text)) {
    return;
  }

  let parsed;
  try {
    parsed = await parseLocationFromText(text);
  } catch (err) {
    console.warn('[scraper] Claude parse failed:', err.message);
    return;
  }
  if (parsed.confidence < 0.4) return;
  if (parsed.lat == null || parsed.lng == null) return;

  const source = item.kind === 'reddit' ? 'reddit' : 'news';
  const description = [item.title, item.body].join('\n').slice(0, 4000);

  const report = await Report.create({
    lat: parsed.lat,
    lng: parsed.lng,
    description,
    summary: parsed.summary,
    source,
    confidence: parsed.confidence,
  });

  const payload = buildPinPayload(report);
  io.emit('new_pin', payload);
  console.log(`[scraper] Report saved (${source}, confidence ${parsed.confidence.toFixed(2)})`);
  console.log('[emit] new_pin (scraped)', JSON.stringify(payload));
}

/**
 * @param {import('socket.io').Server} io
 */
async function runScrapeCycle(io) {
  console.log('[scraper] Starting scheduled scrape cycle');
  let items;
  try {
    items = await collectRawItems();
  } catch (err) {
    console.error('[scraper] Failed to collect items:', err.message);
    return;
  }

  const beforeIceFilter = items.length;
  items = items.filter((item) =>
    textMentionsIceAgency(`${item.title}\n${item.body}`)
  );
  console.log(
    `[scraper] ICE mention filter: ${beforeIceFilter} -> ${items.length} items (require #ICE, word ICE, or I.C.E.)`
  );

  const slice = items.slice(0, MAX_ITEMS_PER_RUN);
  console.log(`[scraper] Processing ${slice.length} unique items (cap ${MAX_ITEMS_PER_RUN})`);

  for (const item of slice) {
    try {
      await processScrapedItem(item, io);
    } catch (err) {
      console.warn('[scraper] Item processing error:', err.message);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  console.log('[scraper] Scrape cycle finished');
}

/**
 * @param {import('socket.io').Server} io
 */
function startScraperScheduler(io) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('[scraper] ANTHROPIC_API_KEY not set — scheduled Reddit/Google News ingestion disabled');
    return;
  }

  const fifteenMinutes = 15 * 60 * 1000;
  setInterval(() => {
    runScrapeCycle(io).catch((err) => console.error('[scraper] Cycle error:', err));
  }, fifteenMinutes);

  setTimeout(() => {
    runScrapeCycle(io).catch((err) => console.error('[scraper] Initial cycle error:', err));
  }, 5000);
}

module.exports = {
  startScraperScheduler,
  runScrapeCycle,
  SEARCH_TERMS,
  textMentionsIceAgency,
};
