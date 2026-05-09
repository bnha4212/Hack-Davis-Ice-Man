import { useState } from 'react'
import RightsCard from '../components/Rights/RightsCard'
import OfflineRights from '../components/Rights/OfflineRights'
import NavBar from '../components/UI/NavBar'
import LangToggle from '../components/UI/LangToggle'
import { useOffline } from '../hooks/useOffline'

const SCENARIOS = {
  door: {
    label: 'At the door',
    en: [
      'You do not have to open the door unless officers show a valid warrant',
      'Ask to see the warrant through the door or window',
      'You can speak through the door without opening it',
      'If they have a warrant, they may enter — stay calm and do not resist',
      'Clearly state "I do not consent to this search"',
    ],
    es: [
      'No tiene que abrir la puerta a menos que los agentes muestren una orden válida',
      'Pida ver la orden a través de la puerta o ventana',
      'Puede hablar a través de la puerta sin abrirla',
      'Si tienen una orden, pueden entrar — mantenga la calma y no resista',
      'Declare claramente "No doy mi consentimiento para este registro"',
    ],
  },
  traffic: {
    label: 'Traffic stop',
    en: [
      'Provide your license and registration when asked',
      'You have the right to remain silent beyond basic identification',
      'You can refuse a vehicle search if no warrant is presented',
      'Do not exit the vehicle unless instructed',
      'You may record the interaction on your phone',
    ],
    es: [
      'Proporcione su licencia y registro cuando se lo pidan',
      'Tiene derecho a guardar silencio más allá de la identificación básica',
      'Puede negarse a una búsqueda del vehículo si no se presenta una orden',
      'No salga del vehículo a menos que se le indique',
      'Puede grabar la interacción en su teléfono',
    ],
  },
  work: {
    label: 'At work',
    en: [
      'Your employer cannot give consent for a search of your personal belongings',
      'You have the right to remain silent',
      'Ask if you are free to go',
      'You have the right to speak with a lawyer before answering questions',
      'ICE cannot arrest you without a judicial warrant signed by a judge',
    ],
    es: [
      'Su empleador no puede dar consentimiento para registrar sus pertenencias personales',
      'Tiene derecho a guardar silencio',
      'Pregunte si puede irse',
      'Tiene derecho a hablar con un abogado antes de responder preguntas',
      'ICE no puede arrestarle sin una orden judicial firmada por un juez',
    ],
  },
  school: {
    label: 'At school',
    en: [
      'Schools are sensitive locations — ICE requires prior approval to enter',
      'Students have the right to remain silent',
      'Contact a parent or guardian immediately',
      'You do not have to go with officers unless they have a warrant',
      'Ask for a lawyer before answering any questions',
    ],
    es: [
      'Las escuelas son lugares sensibles — ICE requiere aprobación previa para entrar',
      'Los estudiantes tienen derecho a guardar silencio',
      'Contacte a un padre o tutor inmediatamente',
      'No tiene que ir con los agentes a menos que tengan una orden',
      'Pida un abogado antes de responder cualquier pregunta',
    ],
  },
  detained: {
    label: 'Detained',
    en: [
      'Clearly state "I am exercising my right to remain silent"',
      'Do not sign any documents without a lawyer',
      'Ask for a lawyer immediately and repeatedly if denied',
      'You have the right to make a phone call',
      'Do not lie about your immigration status — it can be used against you',
    ],
    es: [
      'Declare claramente "Estoy ejerciendo mi derecho a guardar silencio"',
      'No firme ningún documento sin un abogado',
      'Pida un abogado inmediatamente y repítalo si se le niega',
      'Tiene derecho a hacer una llamada telefónica',
      'No mienta sobre su estado migratorio — puede usarse en su contra',
    ],
  },
}

const SCENARIO_KEYS = Object.keys(SCENARIOS)

export default function RightsScreen({ activeScreen, onNavigate }) {
  const [lang, setLang] = useState('EN')
  const [activeScenario, setActiveScenario] = useState('door')
  const [expandedCard, setExpandedCard] = useState('door')
  const { isOffline } = useOffline()

  const l = lang.toLowerCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f1117' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '52px 16px 16px',
        background: '#161b27',
        borderBottom: '1px solid #2e3347',
      }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Your rights</h1>
        <LangToggle lang={lang} onToggle={setLang} />
      </div>

      {/* Scenario pills */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '12px 16px',
        overflowX: 'auto',
        flexShrink: 0,
        borderBottom: '1px solid #1e2333',
      }}>
        {SCENARIO_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => { setActiveScenario(key); setExpandedCard(key) }}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              background: activeScenario === key ? '#1d3a5c' : '#161b27',
              color: activeScenario === key ? '#7eb3f5' : '#9ca3af',
              border: `1px solid ${activeScenario === key ? '#2a4e7a' : '#2e3347'}`,
              transition: 'all 0.15s',
            }}
          >
            {SCENARIOS[key].label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 90px' }}>
        {isOffline ? (
          <OfflineRights />
        ) : (
          SCENARIO_KEYS.map((key) => (
            <RightsCard
              key={key}
              title={SCENARIOS[key].label}
              items={SCENARIOS[key][l] || SCENARIOS[key].en}
              expanded={expandedCard === key}
              onToggle={() => setExpandedCard(expandedCard === key ? null : key)}
            />
          ))
        )}
      </div>

      <NavBar activeScreen={activeScreen} onNavigate={onNavigate} />
    </div>
  )
}
