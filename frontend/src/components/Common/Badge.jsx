const variants = {
  'pendiente':  'bg-yellow-100 text-yellow-800',
  'aprobada':   'bg-green-100 text-green-800',
  'rechazada':  'bg-red-100 text-red-800',
  'admin':      'bg-purple-100 text-purple-800',
  'tutor':      'bg-blue-100 text-blue-800',
  'alumno':     'bg-gray-100 text-gray-800',
  'activo':     'bg-green-100 text-green-800',
  'inactivo':   'bg-red-100 text-red-800',
  'default':    'bg-gray-100 text-gray-800',
}

export function Badge({ text }) {
  const style = variants[text] || variants['default']
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {text}
    </span>
  )
}