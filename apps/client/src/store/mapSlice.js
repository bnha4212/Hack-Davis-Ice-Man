import { createSlice } from '@reduxjs/toolkit'

/** Default matches MapView initial center (Davis area). */
const initialState = {
  lng: -121.74,
  lat: 38.54,
  zoom: 10,
}

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setViewport(state, action) {
      const { lng, lat, zoom } = action.payload
      if (Number.isFinite(lng)) state.lng = lng
      if (Number.isFinite(lat)) state.lat = lat
      if (Number.isFinite(zoom)) state.zoom = zoom
    },
  },
})

export const { setViewport } = mapSlice.actions
export default mapSlice.reducer
