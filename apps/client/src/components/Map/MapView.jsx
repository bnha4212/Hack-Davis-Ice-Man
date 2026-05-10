import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import { useAppSelector, useAppDispatch } from '../../store'
import { setPins } from '../../store/pinsSlice'
import { setViewport } from '../../store/mapSlice'
import { fetchReports } from '../../services/api'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

function pinsToGeoJSON(pins) {
  return {
    type: 'FeatureCollection',
    features: pins.map((pin) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [pin.lng, pin.lat] },
      properties: {
        score: pin.score ?? 1,
        source: pin.source ?? 'news',
        id: pin.id ?? '',
      },
    })),
  }
}

function viewportFromMap(map) {
  const c = map.getCenter()
  return { lng: c.lng, lat: c.lat, zoom: map.getZoom() }
}

export default function MapView() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const dispatch = useAppDispatch()
  const pins = useAppSelector((s) => s.pins.pins)
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
