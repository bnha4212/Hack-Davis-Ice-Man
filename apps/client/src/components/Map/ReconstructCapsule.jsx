import { useEffect, useMemo, useState } from 'react'
import { useAppSelector, useAppDispatch } from '../../store'
import { setNearbySignalsSheetOpen } from '../../store/mapSlice'
import { fetchReports } from '../../services/api'
import {
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
  const dispatch = useAppDispatch()
  const open = useAppSelector((s) => s.map.nearbySignalsSheetOpen)
  const { lng, lat } = useAppSelector((s) => s.map)
  const pins = useAppSelector((s) => s.pins.pins)
  const center = { lng, lat }

  const [panelReports, setPanelReports] = useState([])
  const [loading, setLoading] = useState(false)

  const nearbyFromPins = useMemo(
    () => sortByDistance(filterNearbyScraped(pins, center, RECON_PROXIMITY_KM), center),
    [pins, center.lng, center.lat]
  )

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

  const close = () => dispatch(setNearbySignalsSheetOpen(false))

  if (!open) return null

  return (
    <div
      className="reconstruct-overlay"
      role="presentation"
      onClick={close}
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
              view — tap the map heat or pins to open this list
            </p>
          </div>
          <button
            type="button"
            className="reconstruct-close"
            onClick={close}
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
          <p className="reconstruct-empty">No raid or detention signals in range for this view.</p>
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
  )
}
