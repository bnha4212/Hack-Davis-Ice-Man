import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { useAppSelector, useAppDispatch } from '../../store'
import { setPins } from '../../store/pinsSlice'
import { setNearbySignalsSheetOpen, setViewport } from '../../store/mapSlice'
import { fetchReports } from '../../services/api'
import {
  formatReportAge,
  isScrapedSource,
  reportLooksLikeBroadEditorialOrAnalysis,
  sourceLabel,
} from '../../recon/reconManager'
import { haversineKm } from '../../utils/geo'
import './MapView.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function escapeHtml(s) {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pinCreatedIso(pin) {
  if (pin.createdAt) {
    if (typeof pin.createdAt === 'string') return pin.createdAt
    try {
      return new Date(pin.createdAt).toISOString()
    } catch {
      return ''
    }
  }
  return pin.timestamp || ''
}

function pinsToGeoJSON(pins) {
  const visible = pins.filter((pin) => {
    if (!isScrapedSource(pin.source)) return true
    return !reportLooksLikeBroadEditorialOrAnalysis(pin)
  })
  return {
    type: 'FeatureCollection',
    features: visible.map((pin) => {
      const desc = pin.description ?? ''
      const preview =
        pin.preview ??
        (desc.length > 320 ? `${desc.slice(0, 317)}…` : desc)
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] },
        properties: {
          score: pin.score ?? 1,
          source: pin.source ?? 'news',
          id: pin.id ?? '',
          summary: pin.summary ?? '',
          preview,
          createdAt: pinCreatedIso(pin),
        },
      }
    }),
  }
}

function viewportFromMap(map) {
  const c = map.getCenter()
  return { lng: c.lng, lat: c.lat, zoom: map.getZoom() }
}

/** Heatmaps often do not return features from queryRenderedFeatures; use distance to scraped pins. */
const HEAT_CLICK_MAX_KM = 28

function nearestActionableScrapedKm(lngLat, pinList) {
  let min = Infinity
  for (const p of pinList) {
    if (!isScrapedSource(p.source)) continue
    if (reportLooksLikeBroadEditorialOrAnalysis(p)) continue
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue
    const d = haversineKm(lngLat.lat, lngLat.lng, p.lat, p.lng)
    if (d < min) min = d
  }
  return min === Infinity ? null : min
}

export default function MapView() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const dispatch = useAppDispatch()
  const pins = useAppSelector((s) => s.pins.pins)
  const pinsRef = useRef(pins)
  pinsRef.current = pins
  const viewportThrottleRef = useRef(0)

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-121.74, 38.54],
      zoom: 10,
    })

    mapRef.current = map

    const emitViewport = () => {
      dispatch(setViewport(viewportFromMap(map)))
    }

    const onMoveEnd = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now()
      if (now - viewportThrottleRef.current < 120) return
      viewportThrottleRef.current = now
      emitViewport()
    }

    map.on('moveend', onMoveEnd)
    map.on('zoomend', onMoveEnd)

    map.on('load', () => {
      emitViewport()
      map.addSource('reports', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'reports-heatmap',
        type: 'heatmap',
        source: 'reports',
        maxzoom: 14,
        paint: {
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.4, '#378add',
            0.8, '#e55c3a',
            1, '#ff2200',
          ],
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            7, 0.8,
            12, 0.3,
            14, 0,
          ],
        },
      })

      map.addLayer({
        id: 'reports-pins',
        type: 'circle',
        source: 'reports',
        minzoom: 12,
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match', ['get', 'source'],
            'panic', '#e55c3a',
            '#378add',
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0f1117',
          'circle-opacity': [
            'interpolate', ['linear'], ['zoom'],
            12, 0,
            14, 1,
          ],
        },
      })

      const pinPopup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
        className: 'map-pin-popup-root',
        maxWidth: '320px',
      })

      const showPinPopup = (feature, lngLat) => {
        const p = feature.properties || {}
        const src = escapeHtml(sourceLabel(p.source))
        const body = escapeHtml((p.summary || p.preview || '').trim() || 'No preview')
        const ageIso = p.createdAt
        const ageLabel = ageIso ? formatReportAge(ageIso) : ''
        const ageBlock = ageLabel
          ? `<div class="map-pin-popup__age">Posted ${escapeHtml(ageLabel)}</div>`
          : ''
        pinPopup
          .setLngLat(lngLat)
          .setHTML(
            `<div class="map-pin-popup"><div class="map-pin-popup__source">Source · ${src}</div>${ageBlock}<div class="map-pin-popup__text">${body}</div></div>`
          )
          .addTo(map)
      }

      map.on('mouseenter', 'reports-pins', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mousemove', 'reports-pins', (e) => {
        const f = e.features?.[0]
        if (!f) return
        showPinPopup(f, e.lngLat)
      })
      map.on('mouseleave', 'reports-pins', () => {
        map.getCanvas().style.cursor = ''
        pinPopup.remove()
      })

      const onMapClickOpenSignals = (e) => {
        const pinHits = map.queryRenderedFeatures(e.point, { layers: ['reports-pins'] })
        if (pinHits.length > 0) {
          dispatch(setNearbySignalsSheetOpen(true))
          return
        }
        const heatHits = map.queryRenderedFeatures(e.point, { layers: ['reports-heatmap'] })
        if (heatHits.length > 0) {
          dispatch(setNearbySignalsSheetOpen(true))
          return
        }
        const nearKm = nearestActionableScrapedKm(e.lngLat, pinsRef.current)
        if (nearKm != null && nearKm <= HEAT_CLICK_MAX_KM) {
          dispatch(setNearbySignalsSheetOpen(true))
        }
      }
      map.on('click', onMapClickOpenSignals)

      fetchReports()
        .then((data) => dispatch(setPins(data)))
        .catch(() => {})
    })

    return () => {
      map.off('moveend', onMoveEnd)
      map.off('zoomend', onMoveEnd)
      map.remove()
    }
  }, [dispatch])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const source = map.getSource('reports')
    if (source) source.setData(pinsToGeoJSON(pins))
  }, [pins])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
