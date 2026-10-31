import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatDate, formatTime, getDayName, isPastEvent } from '../utils/dateUtils'
import { BASE_URL } from '../services/api'

function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isInscribed, inscribe, cancelInscription, events, student, refreshEvents } = useApp()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const event = (events || []).find((e) => e.id === Number(id))

  // Evento no encontrado
  if (!event) {
    return (
      <div className="page">
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">❌</span>
          <h3>Evento no encontrado</h3>
          <p>El evento que buscas no existe o fue eliminado.</p>
          <Link to="/" className="btn btn--primary">Volver a Eventos</Link>
        </div>
      </div>
    )
  }

  const past = isPastEvent(event.date)
  const inscribed = isInscribed(event.id)
  const totalEnrolled = event.enrolled
  const isFull = totalEnrolled >= event.capacity
  const spotsLeft = Math.max(0, event.capacity - totalEnrolled)
  const fillPercent = Math.min((totalEnrolled / event.capacity) * 100, 100)

  const handleInscribe = () => inscribe(event.id)
  const handleCancel = () => {
    cancelInscription(event.id)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setSubmittingReview(true)
    try {
      const res = await fetch(`${BASE_URL}/api/eventos/${event.id}/resenas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          comment,
          author: student?.name || 'Estudiante UNMSM',
        }),
      })
      if (res.ok) {
        setComment('')
        if (refreshEvents) refreshEvents()
      }
    } catch (err) {
      console.error('Error al enviar reseña:', err)
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="page">

      {/* Botón volver */}
      <button onClick={() => navigate(-1)} className="back-btn">
        ← Volver
      </button>

      <div className="detail-layout">

        {/* Columna principal */}
        <article className="detail-main">

          {/* Encabezado */}
          <div className="detail-header">
            <div className="detail-header__badges">
              <span className={`badge badge--category badge--${event.category.toLowerCase().replace(/\s/g, '-').replace(/[^a-z-]/g, '')}`}>
                {event.category}
              </span>
              {past
                ? <span className="badge badge--past">Evento realizado</span>
                : isFull && !inscribed
                  ? <span className="badge badge--danger">Cupo lleno</span>
                  : inscribed
                    ? <span className="badge badge--success">✓ Inscrito</span>
                    : <span className="badge badge--upcoming">Próximo</span>
              }
            </div>
            <h2 className="detail-title">{event.title}</h2>
            <p className="detail-description">{event.description}</p>
          </div>

          {/* Agenda de temas (si existe) */}
          {event.agenda && (
            <section className="detail-agenda">
              <h3 className="detail-section-title">📋 Agenda</h3>
              <ol className="agenda-list">
                {event.agenda.map((item, idx) => (
                  <li key={idx} className="agenda-item">
                    <div className="agenda-item__meta">
                      {item.day && (
                        <span className="agenda-item__day">{item.day}</span>
                      )}
                      <span className="agenda-item__time">
                        {formatTime(item.time.includes(':') ? item.time : item.time + ':00')}
                      </span>
                      {item.session && (
                        <span className="agenda-item__session">{item.session}</span>
                      )}
                    </div>
                    <p className="agenda-item__topic">{item.topic}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Sección de Reseñas y Calificaciones (Feature v2.0.0 MAJOR) */}
          <section className="detail-agenda" style={{ marginTop: '2rem' }}>
            <h3 className="detail-section-title">
              ⭐ Calificaciones y Reseñas
              {event.averageRating ? ` (${event.averageRating} / 5 · ${event.reviewsCount || event.reviews?.length} opiniones)` : ''}
            </h3>

            {/* Formulario para calificar */}
            <form onSubmit={handleReviewSubmit} style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label><strong>Tu Calificación:</strong></label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ padding: '4px 8px', borderRadius: '4px' }}>
                  <option value={5}>⭐⭐⭐⭐⭐ (5 - Excelente)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 - Muy bueno)</option>
                  <option value={3}>⭐⭐⭐ (3 - Regular)</option>
                  <option value={2}>⭐⭐ (2 - Mejorable)</option>
                  <option value={1}>⭐ (1 - Malo)</option>
                </select>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe tu opinión académica sobre este evento o taller..."
                rows={2}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
              <button type="submit" disabled={submittingReview} className="btn btn--primary btn--sm" style={{ marginTop: '0.5rem' }}>
                {submittingReview ? 'Publicando...' : 'Publicar Reseña'}
              </button>
            </form>

            {/* Listado de reseñas */}
            {event.reviews && event.reviews.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {event.reviews.map((r) => (
                  <li key={r.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '0.75rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{r.author}</strong>
                      <span style={{ fontSize: '0.9rem' }}>{'⭐'.repeat(r.rating)}</span>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>{r.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#64748b' }}>Aún no hay reseñas registradas para este evento. ¡Sé el primero en calificarlo!</p>
            )}
          </section>

        </article>

        {/* Panel lateral de información */}
        <aside className="detail-sidebar">

          <div className="info-card">
            <h3 className="info-card__title">Información del Evento</h3>

            <ul className="info-list">
              <li className="info-item">
                <span className="info-item__icon" aria-hidden="true">📅</span>
                <div>
                  <span className="info-item__label">Fecha</span>
                  <span className="info-item__value">
                    {getDayName(event.date)}, {formatDate(event.date)}
                  </span>
                </div>
              </li>
              <li className="info-item">
                <span className="info-item__icon" aria-hidden="true">🕐</span>
                <div>
                  <span className="info-item__label">Hora de inicio</span>
                  <span className="info-item__value">{formatTime(event.time)}</span>
                </div>
              </li>
              <li className="info-item">
                <span className="info-item__icon" aria-hidden="true">📍</span>
                <div>
                  <span className="info-item__label">Lugar</span>
                  <span className="info-item__value">{event.location}</span>
                </div>
              </li>
              <li className="info-item">
                <span className="info-item__icon" aria-hidden="true">🎤</span>
                <div>
                  <span className="info-item__label">Expositor</span>
                  <span className="info-item__value">{event.speaker}</span>
                  {event.speakerBio && (
                    <span className="info-item__bio">{event.speakerBio}</span>
                  )}
                </div>
              </li>
              <li className="info-item">
                <span className="info-item__icon" aria-hidden="true">💰</span>
                <div>
                  <span className="info-item__label">Costo de inscripción</span>
                  <span className={`info-item__value ${event.isFree ? 'text-success' : 'text-primary'}`}>
                    {event.isFree ? 'Gratuito' : `S/ ${event.cost.toFixed(2)}`}
                  </span>
                </div>
              </li>
            </ul>

            {/* Capacidad */}
            <div className="info-card__capacity">
              <div className="capacity-header">
                <span>Inscripciones</span>
                <span className="capacity-numbers">
                  <strong>{totalEnrolled}</strong> / {event.capacity}
                </span>
              </div>
              <div
                className="capacity-bar"
                role="progressbar"
                aria-valuenow={totalEnrolled}
                aria-valuemin={0}
                aria-valuemax={event.capacity}
              >
                <div
                  className="capacity-bar__fill"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              {!past && (
                <p className="capacity-label">
                  {isFull
                    ? 'No hay cupos disponibles'
                    : `Quedan ${spotsLeft} cupo${spotsLeft !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>

            {/* Botón de acción principal */}
            {!past && (
              <div className="info-card__action">
                {inscribed ? (
                  <>
                    <div className="inscription-confirm">
                      <span className="inscription-confirm__icon">✅</span>
                      <p>¡Estás inscrito en este evento!</p>
                    </div>
                    <button onClick={handleCancel} className="btn btn--danger btn--block">
                      Cancelar inscripción
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleInscribe}
                    disabled={isFull}
                    className="btn btn--primary btn--block"
                  >
                    {isFull ? 'Sin cupos disponibles' : 'Inscribirme en este evento'}
                  </button>
                )}
              </div>
            )}

            {past && (
              <div className="info-card__action">
                <p className="text-muted text-center">
                  Este evento ya fue realizado.
                </p>
              </div>
            )}
          </div>

        </aside>
      </div>
    </div>
  )
}

export default EventDetail
