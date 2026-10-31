// ── Cliente API REST para Backend de Eventos ─────────────────────────────────
let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}
const BASE_URL = rawUrl.replace(/\/+$/, '');

export async function fetchHealth() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (err) {
    return { status: 'DOWN', error: err.message };
  }
}

export async function fetchEvents(filters = {}) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.cost && filters.cost !== 'all') params.set('cost', filters.cost);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);

  const url = `${BASE_URL}/api/eventos?${params.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Error al consultar eventos del backend');
  return await res.json();
}

export async function fetchEventById(id) {
  const res = await fetch(`${BASE_URL}/api/eventos/${id}`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error('Error al cargar detalle del evento');
  }
  return await res.json();
}

export async function registerInscriptionApi(eventId, student) {
  const res = await fetch(`${BASE_URL}/api/eventos/${eventId}/inscripciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'No se pudo completar la inscripción');
  }
  return data;
}

export async function cancelInscriptionApi(eventId, studentEmail) {
  const res = await fetch(`${BASE_URL}/api/eventos/${eventId}/inscripciones`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentEmail }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'No se pudo cancelar la inscripción');
  }
  return data;
}

export { BASE_URL };
