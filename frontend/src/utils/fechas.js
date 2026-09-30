// El backend guarda las fechas en UTC con el formato de SQLite
// ("2026-09-30 01:54:00", sin zona horaria). Si se pasan directo a
// `new Date()`, el navegador las toma como hora local y quedan corridas
// (en Argentina, 3 horas adelantadas). Estas funciones las interpretan
// siempre como UTC y las muestran en la hora de Argentina.

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires'

export function parsearFechaUTC(valor) {
  if (!valor) return null
  if (valor instanceof Date) return valor
  let texto = String(valor).trim().replace(' ', 'T')
  // Solo se agrega la "Z" si la fecha no trae zona (Z, +00:00, -03:00...)
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(texto)) texto += 'Z'
  const fecha = new Date(texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

export function formatearFecha(valor) {
  const fecha = parsearFechaUTC(valor)
  if (!fecha) return ''
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: ZONA_HORARIA,
  })
}

export function formatearFechaHora(valor) {
  const fecha = parsearFechaUTC(valor)
  if (!fecha) return ''
  return fecha.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA_HORARIA,
  })
}
