import { createSlice } from '@reduxjs/toolkit'

const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    status: 'idle',
    transcript: '',
    responseEn: '',
    responseEs: '',
    error: null,
  },
  reducers: {
    setStatus(state, action) {
      state.status = action.payload
    },
    setResponse(state, action) {
      const { transcript, responseEn, responseEs } = action.payload
      state.transcript = transcript
      state.responseEn = responseEn
      state.responseEs = responseEs
      state.error = null
    },
    setError(state, action) {
      state.error = action.payload
      state.status = 'idle'
    },
    reset() {
      return { status: 'idle', transcript: '', responseEn: '', responseEs: '', error: null }
    },
  },
})

export const { setStatus, setResponse, setError, reset } = sessionSlice.actions
export default sessionSlice.reducer
