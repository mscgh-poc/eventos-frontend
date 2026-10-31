import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { mockEvents } from '../data/mockData'
import {
  fetchHealth,
  fetchEvents,
  registerInscriptionApi,
  cancelInscriptionApi,
  BASE_URL,
} from '../services/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Datos del estudiante identificado: { name, email, phone } | null
  const [student, setStudent] = useState(() => {
    try {
      const saved = localStorage.getItem('edu_student')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Array de IDs de eventos en los que el alumno está inscrito
  const [inscriptions, setInscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem('edu_inscriptions')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Lista de eventos (sincronizada con el backend)
  const [events, setEvents] = useState(mockEvents)
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [backendStatus, setBackendStatus] = useState('CONNECTING') // 'UP' | 'DOWN' | 'CONNECTING'
  const [backendVersion, setBackendVersion] = useState(null)

  // Estado del modal de identificación
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingEventId, setPendingEventId] = useState(null)

  // ── Sincronizar con el Backend ───────────────────────────────────────────────
  const loadEventsFromBackend = useCallback(async () => {
    try {
      const health = await fetchHealth()
      if (health.status === 'UP') {
        setBackendStatus('UP')
        setBackendVersion(health.version)
        const remoteEvents = await fetchEvents()
        if (Array.isArray(remoteEvents) && remoteEvents.length > 0) {
          setEvents(remoteEvents)
        }
      } else {
        setBackendStatus('DOWN')
      }
    } catch (err) {
      console.warn('Backend no disponible, usando fallback local:', err.message)
      setBackendStatus('DOWN')
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  useEffect(() => {
    loadEventsFromBackend()
  }, [loadEventsFromBackend])

  // ── Perfil del estudiante ───────────────────────────────────────────────────
  const saveStudent = (data) => {
    setStudent(data)
    localStorage.setItem('edu_student', JSON.stringify(data))
  }

  const clearStudent = () => {
    setStudent(null)
    setInscriptions([])
    localStorage.removeItem('edu_student')
    localStorage.removeItem('edu_inscriptions')
  }

  // ── Modal ───────────────────────────────────────────────────────────────────
  const openModal = (eventId = null) => {
    setPendingEventId(eventId)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setPendingEventId(null)
  }

  // ── Inscripciones conectadas a la API ───────────────────────────────────────
  const inscribe = async (eventId) => {
    if (!student) {
      openModal(eventId)
      return
    }

    try {
      // Intentar registro en backend si está disponible
      if (backendStatus === 'UP') {
        await registerInscriptionApi(eventId, student)
      }
    } catch (err) {
      console.warn('Error en API backend al inscribir:', err.message)
    }

    // Actualizar estado local
    setInscriptions((prev) => {
      if (prev.includes(eventId)) return prev
      const updated = [...prev, eventId]
      localStorage.setItem('edu_inscriptions', JSON.stringify(updated))
      return updated
    })

    // Actualizar cupos en memoria
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, enrolled: e.enrolled + 1 } : e))
    )
  }

  const cancelInscription = async (eventId) => {
    try {
      if (backendStatus === 'UP' && student?.email) {
        await cancelInscriptionApi(eventId, student.email)
      }
    } catch (err) {
      console.warn('Error en API backend al cancelar:', err.message)
    }

    setInscriptions((prev) => {
      const updated = prev.filter((id) => id !== eventId)
      localStorage.setItem('edu_inscriptions', JSON.stringify(updated))
      return updated
    })

    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, enrolled: Math.max(0, e.enrolled - 1) } : e
      )
    )
  }

  const confirmRegistration = async (data) => {
    saveStudent(data)
    if (pendingEventId !== null) {
      try {
        if (backendStatus === 'UP') {
          await registerInscriptionApi(pendingEventId, data)
        }
      } catch (err) {
        console.warn('Error en API backend al inscribir post-modal:', err.message)
      }

      setInscriptions((prev) => {
        if (prev.includes(pendingEventId)) return prev
        const updated = [...prev, pendingEventId]
        localStorage.setItem('edu_inscriptions', JSON.stringify(updated))
        return updated
      })

      setEvents((prev) =>
        prev.map((e) =>
          e.id === pendingEventId ? { ...e, enrolled: e.enrolled + 1 } : e
        )
      )
    }
    closeModal()
  }

  const isInscribed = (eventId) => inscriptions.includes(eventId)

  return (
    <AppContext.Provider
      value={{
        student,
        saveStudent,
        clearStudent,
        events,
        loadingEvents,
        backendStatus,
        backendVersion,
        refreshEvents: loadEventsFromBackend,
        inscriptions,
        inscribe,
        cancelInscription,
        isInscribed,
        modalOpen,
        openModal,
        closeModal,
        confirmRegistration,
        apiUrl: BASE_URL,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
