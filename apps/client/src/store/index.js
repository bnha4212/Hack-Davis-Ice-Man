import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import pinsReducer from './pinsSlice'
import sessionReducer from './sessionSlice'

export const store = configureStore({
  reducer: {
    pins: pinsReducer,
    session: sessionReducer,
  },
})

export const useAppDispatch = () => useDispatch()
export const useAppSelector = useSelector
