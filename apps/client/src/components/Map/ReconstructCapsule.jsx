import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '../../store'
import { fetchReports } from '../../services/api'
import { haversineKm } from '../../utils/geo'
import './ReconstructCapsule.css'

const PROXIMITY_KM = 30
const MIN_ZOOM = 9

const SCRAPED = new Set(['reddit', 'news'])

function filterNearbyScraped(reports, center, maxKm) {
  return reports.filter((r) => {
    if (!SCRAPED.has(r.source)) return false
    if (!Number.isFinite(r.lat) || !Number.isFinite(r.lng)) return false
    return haversineKm(center.lat, center.lng, r.lat, r.lng) <= maxKm
  })
}

function sortByDistance(reports, center) {
  return [...reports].sort(
    (a, b) =>
      haversineKm(center.lat, center.lng, a.lat, a.lng) -
      haversineKm(center.lat, center.lng, b.lat, b.lng)
  )
}

function reportKey(r) {
  return r.id || `${r.lat}-${r.lng}-${r.source}-${r.createdAt || ''}`
}

function sourceLabel(source) {
  if (source === 'reddit') return 'Reddit'
  if (source === 'news') return 'News'
  return source
}

export default function ReconstructCapsule() {
  const { lng, lat, zoom } = useAppSelector((s) => s.map)
  const pins = useAppSelector((s) => s.pins.pins)
  const center = { lng, lat }

  const [open, setOpen] = useState(false)
  const [panelReports, setPanelReports] = useState([])
  const [loading, setLoading] = useState(false)

  const nearbyFromPins = useMemo(
    () => sortByDistance(filterNearbyScraped(pins, center, PROXIMITY_KM), center),
    [pins, center.lng, center.lat]
  )

  const showEntry = zoom >= MIN_ZOOM && nearbyFromPins.length > 0

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    fetchReports()
      .then((data) => {
        if (cancelled) return
        const sorted = sortByDistance(filterNearbyScraped(data, center, PROXIMITY_KM), center)
        setPanelReports(sorted)
      })
      .catch(() => {
        if (!cancelled) setPanelReports(nearbyFromPins)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, lng, lat, nearbyFromPins])

  const displayList = panelReports.length > 0 ? panelReports : nearbyFromPins

  const digest = useMemo(() => {
    const summaries = [
      ...new Set(displayList.map((r) => (r.summary || '').trim()).filter(Boolean)),
    ]
    const text = summaries.slice(0, 8).join(' · ')
    if (text.length <= 420) return text
    return `${text.slice(0, 417)}…`
  }, [displayList])

  if (!showEntry && !open) return null

  return (
    <>
      {showEntry && (
        <div className="reconstruct-entry-wrap">
          <button
            type="button"
            className="reconstruct-fab"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <i className="ti ti-radar-2" aria-hidden />
            Reconstruct
          </button>
          <p className="reconstruct-hint">
            Near activity heat — open for scraped social posts & news digest
          </p>
        </div>
      )}

      {open && (
        <div
          className="reconstruct-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            className="reconstruct-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reconstruct-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="reconstruct-sheet-head">
              <div>
                <h2 id="reconstruct-title">Reconstruct</h2>
                <p className="reconstruct-sub">
                  Signals from Reddit & Google News near your map view (~{PROXIMITY_KM} km)
                </p>
              </div>
              <button
                type="button"
                className="reconstruct-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <i className="ti ti-x" aria-hidden />
              </button>
            </header>

            {loading && <p className="reconstruct-loading">Loading latest reports…</p>}

            {!loading && digest && (
              <div className="reconstruct-digest">
                <h3>Summarized news</h3>
                <p>{digest}</p>
              </div>
            )}

            {!loading && displayList.length === 0 && (
              <p className="reconstruct-empty">No scraped items in range — pan closer to red heat.</p>
            )}

            <ul className="reconstruct-list">
              {displayList.map((r) => (
                <li key={reportKey(r)} className="reconstruct-card">
                  <div className="reconstruct-card-top">
                    <span className={`reconstruct-badge reconstruct-badge--${r.source}`}>
                      {sourceLabel(r.source)}
                    </span>
                    <span className="reconstruct-dist">
                      {haversineKm(center.lat, center.lng, r.lat, r.lng).toFixed(1)} km
                    </span>
                  </div>
                  <p className="reconstruct-summary">{r.summary}</p>
                  {r.description ? (
                    <details className="reconstruct-details">
                      <summary>Original text &amp; more</summary>
                      <pre className="reconstruct-body">{r.description}</pre>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  )
}
