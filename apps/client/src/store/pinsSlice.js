import { createSlice } from '@reduxjs/toolkit'

const pinsSlice = createSlice({
  name: 'pins',
  initialState: { pins: [], connected: false },
  reducers: {
    addPin(state, action) {
      state.pins.push(action.payload)
    },
    setPins(state, action) {
      state.pins = action.payload
    },
    setConnected(state, action) {
      state.connected = action.payload
    },
  },
})

export const { addPin, setPins, setConnected } = pinsSlice.actions
export default pinsSlice.reducer
