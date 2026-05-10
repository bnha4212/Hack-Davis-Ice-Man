import { haversineKm } from '../utils/geo'

/** Max distance (km) from map center for Reconstruct scraped signals */
export const RECON_PROXIMITY_KM = 30

/** Map zoom must be at least this for the Reconstruct entry control */
export const RECON_MIN_ZOOM = 9

const SCRAPED_SOURCES = new Set(['reddit', 'news'])

/** Hide op-eds / “no pin” analysis already in DB (matches common Claude disclaimers + bylines). */
const BROAD_OR_EDITORIAL_MARKERS = [
  'rather than a specific',
  'broadly covers',
  'not a specific city',
  'no specific city',
  'no specific location',
  'op-ed',
  'op ed',
  'an op-ed',
  'editorial',
  'opinion column',
  'opinion piece',
]

export function isScrapedSource(source) {
  return SCRAPED_SOURCES.has(source)
}

export function reportLooksLikeBroadEditorialOrAnalysis(report) {
  const blob = `${report.summary || ''}\n${report.description || ''}`.toLowerCase()
  return BROAD_OR_EDITORIAL_MARKERS.some((m) => blob.includes(m))
}

/**
 * Reports from Reddit / Google News ingestion within maxKm of center.
 */
export function filterNearbyScraped(reports, center, maxKm = RECON_PROXIMITY_KM) {
  return reports.filter((r) => {
    if (!isScrapedSource(r.source)) return false
    if (reportLooksLikeBroadEditorialOrAnalysis(r)) return false
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) return false
    return haversineKm(center.lat, center.lng, r.lat, r.lng) <= maxKm
  })
}

export function sortByDistance(reports, center) {
  return [...reports].sort(
    (a, b) =>
      haversineKm(center.lat, center.lng, a.lat, a.lng) -
      haversineKm(center.lat, center.lng, b.lat, b.lng)
  )
}

export function distanceFromCenter(report, center) {
  return haversineKm(center.lat, center.lng, report.lat, report.lng)
}

export function reportKey(r) {
  return r.id || `${r.lat}-${r.lng}-${r.source}-${r.createdAt || ''}`
}

export function sourceLabel(source) {
  if (source === 'reddit') return 'Reddit'
  if (source === 'news') return 'News'
  if (source === 'user') return 'User report'
  if (source === 'panic') return 'Panic alert'
  return source || 'Unknown'
}

/**
 * Human-readable age since report was created (uses createdAt ISO or legacy timestamp).
 */
export function formatReportAge(createdAtOrTimestamp) {
  if (createdAtOrTimestamp == null || createdAtOrTimestamp === '') return ''
  const t = new Date(createdAtOrTimestamp).getTime()
  if (!Number.isFinite(t)) return ''
  const sec = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (sec < 45) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 48) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 14) return `${day}d ago`
  const wk = Math.floor(day / 7)
  return `${wk}w ago`
}

/**
 * Combined digest line from unique summaries (for the sheet header).
 */
export function buildDigest(reports, { maxSummaries = 8, maxChars = 420 } = {}) {
  const summaries = [
    ...new Set(reports.map((r) => (r.summary || '').trim()).filter(Boolean)),
  ]
  const text = summaries.slice(0, maxSummaries).join(' · ')
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars - 1)}…`
}

/**
 * Single object export for callers that prefer a namespace.
 */
export const reconManager = {
  PROXIMITY_KM: RECON_PROXIMITY_KM,
  MIN_ZOOM: RECON_MIN_ZOOM,
  isScrapedSource,
  reportLooksLikeBroadEditorialOrAnalysis,
  filterNearbyScraped,
  sortByDistance,
  distanceFromCenter,
  reportKey,
  sourceLabel,
  formatReportAge,
  buildDigest,
}
