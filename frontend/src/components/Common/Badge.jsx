export function Badge({ text, estado_alumno, estado_tutor }) {
  // Modo simple: roles y estados con text
  if (text) {
    const config = {
      pendiente:  { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
      aprobada:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Aprobada'  },
      rechazada:  { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rechazada' },
      admin:      { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin'     },
      tutor:      { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Tutor'     },
      alumno:     { bg: 'bg-gray-100',   text: 'text-gray-700',   label: 'Alumno'    },
      activo:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Activo'    },
      inactivo:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Inactivo'  },
    }
    const style = config[text] || { bg: 'bg-gray-100', text: 'text-gray-700', label: text }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }
  // Nuevo formato: dos estados
  const configAlumno = {
    borrador: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Borrador'},
    enviada: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Enviada'}
  }

  const configTutor = {
    pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
    en_revision: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En revisión' },
    aprobada: { bg: 'bg-green-100', text: 'text-green-700', label: 'Aprobada' },
    rechazada: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rechazada' }
  }

  const styleAlumno = configAlumno[estado_alumno] || configAlumno.borrador
  const styleTutor = configTutor[estado_tutor] || configTutor.pendiente

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Badge estado del alumno */}
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styleAlumno.bg} ${styleAlumno.text}`}>
        {styleAlumno.label}
      </span>
      
      {/* Badge estado del tutor (solo si está enviada) */}
      {estado_alumno === 'enviada' && (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${styleTutor.bg} ${styleTutor.text}`}>
          {styleTutor.label}
        </span>
      )}
    </div>
  )
}