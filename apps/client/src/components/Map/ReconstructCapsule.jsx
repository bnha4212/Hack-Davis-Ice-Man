import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '../../store'
import { fetchReports } from '../../services/api'
import {
  RECON_MIN_ZOOM,
  RECON_PROXIMITY_KM,
  buildDigest,
  distanceFromCenter,
  filterNearbyScraped,
  formatReportAge,
  reportKey,
  sortByDistance,
  sourceLabel,
} from '../../recon/reconManager'
import './ReconstructCapsule.css'

export default function ReconstructCapsule() {
  const { lng, lat, zoom } = useAppSelector((s) => s.map)
  const pins = useAppSelector((s) => s.pins.pins)
  const center = { lng, lat }

  const [open, setOpen] = useState(false)
  const [panelReports, setPanelReports] = useState([])
  const [loading, setLoading] = useState(false)

  const nearbyFromPins = useMemo(
    () => sortByDistance(filterNearbyScraped(pins, center, RECON_PROXIMITY_KM), center),
    [pins, center.lng, center.lat]
  )

  const showEntry = zoom >= RECON_MIN_ZOOM && nearbyFromPins.length > 0

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    fetchReports()
      .then((data) => {
        if (cancelled) return
        const sorted = sortByDistance(filterNearbyScraped(data, center, RECON_PROXIMITY_KM), center)
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

  const digest = useMemo(() => buildDigest(displayList), [displayList])

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
            aria-label="Open nearby raid and detention signals from Reddit and news"
          >
            <i className="ti ti-radar-2" aria-hidden />
            Nearby signals
          </button>
          <p className="reconstruct-hint">
            Near hot spots — Reddit & news on raids and detentions
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
            aria-labelledby="nearby-signals-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="reconstruct-sheet-head">
              <div>
                <h2 id="nearby-signals-title">Nearby signals</h2>
                <p className="reconstruct-sub">
                  Reddit & Google News (raids / detentions) within ~{RECON_PROXIMITY_KM} km of your
                  view
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
                      {distanceFromCenter(r, center).toFixed(1)} km
                    </span>
                  </div>
                  {(r.createdAt || r.timestamp) && (
                    <p className="reconstruct-age">
                      Posted {formatReportAge(r.createdAt || r.timestamp)}
                    </p>
                  )}
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
