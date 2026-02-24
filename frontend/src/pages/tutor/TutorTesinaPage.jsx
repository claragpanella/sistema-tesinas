import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout/Layout'
import { Spinner } from '../../components/Common/Spinner'
import { Alert } from '../../components/Common/Alert'
import { EmptyState } from '../../components/Common/EmptyState'
import { Badge } from '../../components/Common/Badge'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  User
} from 'lucide-react'

// =========================
// Modal para revisar tesina
// =========================
function RevisarModal({ version, onClose, onSaved }) {
  const [estado, setEstado] = useState(version.version_estado || 'pendiente')
  const [observaciones, setObservaciones] = useState(version.observaciones || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post(`/tutor/versiones/${version.version_id}/revisar`, {
        estado,
        observaciones
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la revisión')
    } finally {
      setLoading(false)
    }
  }

  const estados = [
    {
      value: 'pendiente',
      label: 'Pendiente',
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    },
    {
      value: 'aprobada',
      label: 'Aprobada',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      value: 'rechazada',
      label: 'Rechazada',
      icon: XCircle,
      color: 'text-red-600 bg-red-50 border-red-200'
    },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Revisar Tesina
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">
              Versión {version.numero_version}
            </p>
            {version.alumno_nombre && (
              <>
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    {version.alumno_nombre}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          {/* Selector de estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Estado de la revisión *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {estados.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEstado(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    estado === value
                      ? color + ' border-current'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={5}
              className="input resize-none"
              placeholder="Escribí tus comentarios y correcciones aquí..."
              disabled={loading}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Guardar revisión
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =========================
// Card de una tesina
// =========================
function TesinaCard({ tesina, onRevisar }) {
  const [expanded, setExpanded] = useState(false)

  const handleDownload = async (filename) => {
    try {
      const response = await api.get(`/uploads/${filename}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al descargar:', err)
    }
  }

const handlePreview = async (filename) => {
  try {
    const response = await api.get(`/uploads/${filename}`, {
      responseType: 'blob'
    })
    
    // Detectar tipo de archivo
    const extension = filename.split('.').pop().toLowerCase()
    let mimeType = 'application/octet-stream'
    
    if (extension === 'pdf') {
      mimeType = 'application/pdf'
    } else if (extension === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (extension === 'doc') {
      mimeType = 'application/msword'
    }
    
    const blob = new Blob([response.data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    setTimeout(() => window.URL.revokeObjectURL(url), 1000)
  } catch (err) {
    console.error('Error al previsualizar:', err)
  }
}

  const estadoColor = {
    'pendiente': 'border-l-yellow-400',
    'aprobada':  'border-l-green-400',
    'rechazada': 'border-l-red-400',
  }

  const borderColor = estadoColor[tesina.version_estado] || 'border-l-gray-300'

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor} overflow-hidden`}>

      {/* Header de la card */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">

              {/* Título y estado */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-gray-900">
                  {tesina.titulo || 'Sin título'}
                </h3>
                <Badge text={tesina.version_estado || tesina.tesina_estado} />
                <span className="text-xs text-gray-400">
                  v{tesina.numero_version}
                </span>
              </div>

              {/* Alumno */}
              {tesina.alumno_nombre && (
                <div className="flex items-center gap-1 mb-2">
                  <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {tesina.alumno_nombre}
                  </span>
                </div>
              )}

              {/* Resumen */}
              {tesina.resumen && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {tesina.resumen}
                </p>
              )}

              {/* Observaciones previas */}
              {tesina.observaciones && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 italic">
                    <span className="font-medium">Observaciones: </span>
                    {tesina.observaciones}
                  </p>
                </div>
              )}

              {/* Fecha */}
              <p className="text-xs text-gray-400 mt-2">
                Entregado: {new Date(tesina.fecha_creacion).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreview(tesina.nombre_archivo)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Vista previa"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownload(tesina.nombre_archivo)}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Descargar"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onRevisar(tesina)}
                className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-3 h-3" />
                Revisar
              </button>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Ocultar historial
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Ver historial
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Historial de versiones expandible */}
      {expanded && (
        <HistorialVersiones tesinaId={tesina.tesina_id} />
      )}
    </div>
  )
}

// =========================
// Historial de versiones
// =========================
function HistorialVersiones({ tesinaId }) {
  const [versiones, setVersiones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVersiones = async () => {
      try {
        const response = await api.get(`/tesinas/${tesinaId}/versions`)
        setVersiones(response.data)
      } catch (err) {
        console.error('Error al cargar versiones:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVersiones()
  }, [tesinaId])

  if (loading) {
    return (
      <div className="border-t border-gray-100 p-4">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
        Historial de versiones
      </p>
      <div className="space-y-2">
        {versiones.map((v) => (
          <div
            key={v.version_id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              v.is_current
                ? 'bg-indigo-50 border border-indigo-100'
                : 'bg-white border border-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                v.is_current
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                v{v.numero_version}
              </span>
              <div>
                <Badge text={v.estado} />
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(v.fecha_creacion).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
            {v.is_current && (
              <span className="text-xs text-indigo-600 font-medium">
                Versión actual
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// =========================
// Página principal
// =========================
export function TutorTesinaPage() {
  const { user } = useAuth()

  const [tesinas, setTesinas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [filtroEstado, setFiltroEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState(null)

  const fetchTesinas = async () => {
    setLoading(true)
    try {
      const response = await api.get('/tutor/tesinas')

      if (Array.isArray(response.data)) {
        setTesinas(response.data)
      } else if (response.data.items) {
        setTesinas(response.data.items)
      } else {
        setTesinas([])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar las tesinas')
      setTesinas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTesinas()
  }, [])

  const handleRevisar = (tesina) => {
    setSelectedVersion(tesina)
    setShowModal(true)
  }

  const handleSaved = () => {
    setShowModal(false)
    setSelectedVersion(null)
    setSuccess('Revisión guardada correctamente')
    fetchTesinas()
    setTimeout(() => setSuccess(''), 3000)
  }

  const tesinasFiltradas = tesinas.filter((t) => {
    if (!filtroEstado) return true
    return t.version_estado === filtroEstado
  })

  const contadores = {
    total:      tesinas.length,
    pendientes: tesinas.filter(t => t.version_estado === 'pendiente').length,
    aprobadas:  tesinas.filter(t => t.version_estado === 'aprobada').length,
    rechazadas: tesinas.filter(t => t.version_estado === 'rechazada').length,
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Mis Tesinas Asignadas
        </h1>
        <p className="text-gray-600 mt-1">
          Revisá y evaluá los trabajos de tus alumnos
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError('')} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        </div>
      )}

      {/* Tarjetas de resumen */}
      {!loading && tesinas.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total',      value: contadores.total,      color: 'bg-gray-100 text-gray-700' },
            { label: 'Pendientes', value: contadores.pendientes, color: 'bg-yellow-100 text-yellow-700' },
            { label: 'Aprobadas',  value: contadores.aprobadas,  color: 'bg-green-100 text-green-700' },
            { label: 'Rechazadas', value: contadores.rechazadas, color: 'bg-red-100 text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 ${color}`}>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      {!loading && tesinas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { value: '',          label: 'Todas' },
              { value: 'pendiente', label: 'Pendientes' },
              { value: 'aprobada',  label: 'Aprobadas' },
              { value: 'rechazada', label: 'Rechazadas' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFiltroEstado(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      ) : tesinasFiltradas.length === 0 ? (
        <EmptyState
          title={tesinas.length === 0 ? 'Sin tesinas asignadas' : 'Sin resultados'}
          description={
            tesinas.length === 0
              ? 'No tenés tesinas asignadas por el momento'
              : 'No hay tesinas con el filtro seleccionado'
          }
        />
      ) : (
        <div className="space-y-4">
          {tesinasFiltradas.map((tesina) => (
            <TesinaCard
              key={tesina.tesina_id}
              tesina={tesina}
              onRevisar={handleRevisar}
            />
          ))}
        </div>
      )}

      {/* Modal revisar */}
      {showModal && selectedVersion && (
        <RevisarModal
          version={selectedVersion}
          onClose={() => {
            setShowModal(false)
            setSelectedVersion(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </Layout>
  )
}