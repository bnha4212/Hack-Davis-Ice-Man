import { useEffect } from 'react'
import socket from '../services/socket'
import { useAppDispatch } from '../store'
import { addPin, setConnected } from '../store/pinsSlice'
import { EVENTS } from '@warrant/shared'

export function useSocket() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    socket.connect()
    dispatch(setConnected(true))

    socket.on(EVENTS.NEW_PIN, (pin) => {
      dispatch(addPin(pin))
    })

    socket.on('connect_error', () => {
      dispatch(setConnected(false))
    })

    socket.on('disconnect', () => {
      dispatch(setConnected(false))
    })

    socket.on('connect', () => {
      dispatch(setConnected(true))
    })

    return () => {
      socket.off(EVENTS.NEW_PIN)
      socket.off('connect_error')
      socket.off('disconnect')
      socket.off('connect')
      socket.disconnect()
      dispatch(setConnected(false))
    }
  }, [dispatch])
}
