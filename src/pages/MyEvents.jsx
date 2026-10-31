import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import EventCard from '../components/EventCard'
import { isPastEvent } from '../utils/dateUtils'

function MyEvents() {
  const { student, openModal, inscriptions, events } = useApp()
  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past'

  // Obtiene solo los eventos en que el alumno está inscrito
  const myEvents = (events || []).filter((e) => inscriptions.includes(e.id))

  const upcoming = myEvents.filter((e) => !isPastEvent(e.date))
  const past = myEvents.filter((e) => isPastEvent(e.date))
  const shown = activeTab === 'upcoming' ? upcoming : past

  return (
    <div className="page">

      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Mis Eventos</h2>
          <p className="page-subtitle">
            {student
              ? <><strong>{student.name}</strong> &mdash; {student.email}</>
              : 'Gestiona tus inscripciones a eventos académicos.'}
          </p>
        </div>
        <div className="page-header__stats">
          <div className="stat-pill">
            <span className="stat-pill__number">{upcoming.length}</span>
            <span className="stat-pill__label">Próximos</span>
          </div>
          <div className="stat-pill stat-pill--secondary">
            <span className="stat-pill__number">{past.length}</span>
            <span className="stat-pill__label">Asistidos</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" role="tablist" aria-label="Mis eventos">
        <button
          role="tab"
          aria-selected={activeTab === 'upcoming'}
          className={`tab ${activeTab === 'upcoming' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          📆 Próximos ({upcoming.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'past'}
          className={`tab ${activeTab === 'past' ? 'tab--active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          📚 Asistidos ({past.length})
        </button>
      </div>

      {/* Contenido según tab */}
      {shown.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">
            {activeTab === 'upcoming' ? '🎟️' : '📜'}
          </span>
          <h3>
            {activeTab === 'upcoming'
              ? 'No tienes inscripciones próximas'
              : 'No has asistido a ningún evento todavía'}
          </h3>
          <p>
            {activeTab === 'upcoming'
              ? 'Explora el catálogo de eventos del mes y regístrate en los que te interesen.'
              : 'Los eventos pasados en los que participaste aparecerán aquí.'}
          </p>
          {activeTab === 'upcoming' && (
            <Link to="/" className="btn btn--primary">
              Ver eventos disponibles
            </Link>
          )}
        </div>
      ) : (
        <div className="event-grid">
          {shown.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Recordatorio de identificación si aún no se registró */}
      {!student && inscriptions.length > 0 && (
        <div className="banner banner--info mt-8">
          <div>
            <strong>Identificación pendiente</strong>
            <p>
              Tus inscripciones se guardan en este dispositivo. Identifícate para
              asegurar tu cupo oficial con tus datos de estudiante.
            </p>
          </div>
          <button onClick={() => openModal()} className="btn btn--secondary btn--sm">
            Completar datos
          </button>
        </div>
      )}

    </div>
  )
}

export default MyEvents
