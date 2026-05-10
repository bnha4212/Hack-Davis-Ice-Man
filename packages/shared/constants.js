export const EVENTS = {
  NEW_PIN: 'new_pin',
  PIN_EXPIRED: 'pin_expired',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
}

export const PIN_SOURCES = {
  REDDIT: 'reddit',
  NEWS: 'news',
  PANIC: 'panic',
}

export const API_ROUTES = {
  PANIC: '/api/panic',
  PANIC_TRANSCRIBE: '/api/panic/transcribe',
  PANIC_CONFIRM: '/api/panic/confirm',
  REPORTS: '/api/reports',
  HEALTH: '/api/health',
}

export const SERVER_URL = 'http://localhost:3001'
