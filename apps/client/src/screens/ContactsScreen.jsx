import { useState } from 'react'
import NavBar from '../components/UI/NavBar'
import { SERVER_URL } from '@iceman/shared'

const ROLE_STYLES = {
  Lawyer: { bg: '#1d3a5c', color: '#7eb3f5', avatarBg: '#1d3a5c' },
  Family: { bg: '#2d1d5c', color: '#a78bfa', avatarBg: '#2d1d5c' },
  Emergency: { bg: '#3a1d1d', color: '#e55c3a', avatarBg: '#3a1d1d' },
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

export default function ContactsScreen({ activeScreen, onNavigate }) {
  const [contacts, setContacts] = useState(() =>
    JSON.parse(localStorage.getItem('iceman_contacts') || '[]')
  )
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', role: 'Family' })

  const save = (updated) => {
    setContacts(updated)
    localStorage.setItem('iceman_contacts', JSON.stringify(updated))
  }

  const addContact = () => {
    if (!form.name || !form.phone) return
    save([...contacts, { ...form, id: Date.now() }])
    setForm({ name: '', phone: '', role: 'Family' })
    setShowForm(false)
  }

  const removeContact = (id) => save(contacts.filter((c) => c.id !== id))

  const sendTestSMS = async () => {
    try {
      await fetch(SERVER_URL + '/api/panic/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      })
    } catch {
      // Brandon's endpoint stub
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f1117' }}>
      {/* Header */}
      <div style={{ padding: '52px 16px 16px', background: '#161b27', borderBottom: '1px solid #2e3347' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Emergency contacts</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 90px' }}>
        {/* Contact cards */}
        {contacts.map((c) => {
          const style = ROLE_STYLES[c.role] || ROLE_STYLES.Family
          return (
            <div key={c.id} style={{
              background: '#161b27',
              border: '1px solid #2e3347',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: style.avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                color: style.color,
                flexShrink: 0,
              }}>
                {initials(c.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e4ea' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.phone}</div>
              </div>
              <span style={{
                background: style.bg,
                color: style.color,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 10,
                letterSpacing: '0.05em',
              }}>
                {c.role}
              </span>
              <button onClick={() => removeContact(c.id)} style={{ color: '#5a5f70', marginLeft: 4 }}>
                <i className="ti ti-trash" style={{ fontSize: 18 }} />
              </button>
            </div>
          )
        })}

        {/* Add contact */}
        {showForm ? (
          <div style={{
            background: '#161b27',
            border: '1px solid #2e3347',
            borderRadius: 12,
            padding: 14,
            marginBottom: 8,
          }}>
            {['name', 'phone'].map((field) => (
              <input
                key={field}
                placeholder={field === 'name' ? 'Full name' : 'Phone number'}
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                style={{
                  display: 'block',
                  width: '100%',
                  background: '#1e2333',
                  border: '1px solid #2e3347',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#e2e4ea',
                  fontSize: 14,
                  marginBottom: 8,
                  outline: 'none',
                }}
              />
            ))}
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={{
                display: 'block',
                width: '100%',
                background: '#1e2333',
                border: '1px solid #2e3347',
                borderRadius: 8,
                padding: '10px 12px',
                color: '#e2e4ea',
                fontSize: 14,
                marginBottom: 10,
                outline: 'none',
              }}
            >
              <option>Family</option>
              <option>Lawyer</option>
              <option>Emergency</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addContact} style={{
                flex: 1,
                background: '#378add',
                color: '#fff',
                borderRadius: 8,
                padding: '10px',
                fontSize: 14,
                fontWeight: 600,
              }}>Save</button>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1,
                background: '#1e2333',
                color: '#9ca3af',
                borderRadius: 8,
                padding: '10px',
                fontSize: 14,
              }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%',
              border: '1px dashed #2e3347',
              borderRadius: 12,
              padding: '14px',
              color: '#5a5f70',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 18 }} />
            Add contact
          </button>
        )}

        {/* SMS preview */}
        <div style={{
          background: '#161b27',
          border: '1px solid #2e3347',
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        }}>
          <p style={{ fontSize: 11, color: '#5a5f70', marginBottom: 6, fontWeight: 600, letterSpacing: '0.05em' }}>SMS PREVIEW</p>
          <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
            "ICEMAN ALERT — I may need help. [location]. Sent via Iceman app."
          </p>
          <button
            onClick={sendTestSMS}
            style={{
              marginTop: 10,
              width: '100%',
              background: '#1e2333',
              color: '#7eb3f5',
              borderRadius: 8,
              padding: '10px',
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid #2e3347',
            }}
          >
            Send test SMS
          </button>
        </div>
      </div>

      <NavBar activeScreen={activeScreen} onNavigate={onNavigate} />
    </div>
  )
}
