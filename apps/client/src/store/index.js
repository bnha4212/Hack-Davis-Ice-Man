import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import pinsReducer from './pinsSlice'
import sessionReducer from './sessionSlice'
import mapReducer from './mapSlice'

export const store = configureStore({
  reducer: {
    pins: pinsReducer,
    session: sessionReducer,
    map: mapReducer,
  },
})

export const useAppDispatch = () => useDispatch()
export const useAppSelector = useSelector
