import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout/Layout'
import { Spinner } from '../components/Common/Spinner'
import { Alert } from '../components/Common/Alert'
import { Badge } from '../components/Common/Badge'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  FileText,
  ArrowLeft,
  Download,
  Eye,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  Pencil
} from 'lucide-react'

// =========================
// Modal de reentrega
// =========================
function ReentregaModal({ tesinaId, onClose, onSaved }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const allowed = ['pdf', 'docx', 'doc']
    const ext = selectedFile.name.split('.').pop().toLowerCase()

    if (!allowed.includes(ext)) {
      setError('Solo se permiten archivos PDF, DOCX o DOC')
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Debes seleccionar un archivo')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      await api.post(`/tesinas/${tesinaId}/reentrega`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reenviar la tesina')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Reenviar Tesina
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Subí la versión corregida
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <span className="text-gray-500 text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc"
              className="hidden"
              id="reentrega-file"
              disabled={loading}
            />
            <label htmlFor="reentrega-file" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <span className="text-sm text-indigo-600 font-medium">
                    {file.name}
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    <span className="text-indigo-600 font-medium">
                      Seleccionar archivo
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, DOCX o DOC
                  </p>
                </>
              )}
            </label>
          </div>

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
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Reenviar
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
// Modal editar tesina (completo)
// =========================
function EditarTesinaModal({ tesina, onClose, onSaved }) {
  const [tutores, setTutores] = useState([])
  const [form, setForm] = useState({
    titulo: tesina?.titulo || '',
    resumen: tesina?.resumen || '',
    tutor_id: tesina?.tutor_id || ''
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingTutores, setLoadingTutores] = useState(true)
  const [error, setError] = useState('')

useEffect(() => {
  const fetchTutores = async () => {
    console.log('=== INICIANDO CARGA DE TUTORES ===')
    try {
      console.log('1. Llamando a /tutores...')
      const response = await api.get('/tutores')
      
      console.log('2. Respuesta completa:', response)
      console.log('3. response.data:', response.data)
      console.log('4. Tipo de response.data:', typeof response.data)
      console.log('5. Es array?:', Array.isArray(response.data))
      
      if (Array.isArray(response.data)) {
        console.log('6. Cantidad de tutores:', response.data.length)
        console.log('7. Primer tutor:', response.data[0])
        setTutores(response.data)
      } else {
        console.error('❌ response.data NO es un array:', response.data)
        setTutores([])
      }
      
    } catch (err) {
      console.error('❌ ERROR:', err)
      console.error('Respuesta del error:', err.response)
      console.error('Data del error:', err.response?.data)
      console.error('Status del error:', err.response?.status)
      setError('Error al cargar la lista de tutores')
    } finally {
      console.log('8. Finalizando carga, loadingTutores = false')
      setLoadingTutores(false)
    }
  }

  fetchTutores()
}, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    const allowed = ['pdf', 'docx', 'doc']
    const ext = selectedFile.name.split('.').pop().toLowerCase()

    if (!allowed.includes(ext)) {
      setError('Solo se permiten archivos PDF, DOCX o DOC')
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.titulo.trim()) {
      setError('El título es obligatorio')
      return
    }

    if (!form.tutor_id) {
      setError('Debes seleccionar un tutor')
      return
    }

    setLoading(true)
    try {
      // 1. Actualizar datos generales
      await api.put(`/tesinas/${tesina.id}`, {
        titulo: form.titulo,
        resumen: form.resumen,
        tutor_id: parseInt(form.tutor_id)
      })

      // 2. Si hay archivo nuevo, actualizar archivo
      if (file) {
        const formData = new FormData()
        formData.append('file', file)

        await api.put(`/tesinas/${tesina.id}/archivo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar la tesina')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Editar Tesina
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Actualizar información y archivo de tu tesina
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <span className="text-gray-500 text-xl leading-none">&times;</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              ℹ️ <span className="font-semibold">Nota:</span> Solo podés editar 
              mientras tu tesina está pendiente de revisión.
            </p>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título de la tesina *
            </label>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              className="input"
              placeholder="Ej: El impacto de la IA en la educación superior"
              required
              disabled={loading}
            />
          </div>

          {/* Resumen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resumen
            </label>
            <textarea
              name="resumen"
              value={form.resumen}
              onChange={handleChange}
              rows={4}
              className="input resize-none"
              placeholder="Breve descripción de tu tesina..."
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">
              {form.resumen.length} caracteres
            </p>
          </div>

          {/* Tutor */}
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Tutor asignado *
  </label>
  {loadingTutores ? (
    <div className="flex items-center gap-2 text-gray-400 py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Cargando tutores...</span>
    </div>
  ) : tutores.length === 0 ? (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-600">
        No hay tutores disponibles. 
        <button 
          onClick={() => console.log('Tutores actuales:', tutores)}
          className="underline ml-1"
        >
          Ver en consola
        </button>
      </p>
    </div>
  ) : (
    <>
      <p className="text-xs text-green-600 mb-2">
        ✓ {tutores.length} tutores cargados
      </p>
      <select
        name="tutor_id"
        value={form.tutor_id}
        onChange={handleChange}
        className="input"
        required
        disabled={loading}
      >
        <option value="">Seleccionar tutor</option>
        {tutores.map(tutor => {
          console.log('Renderizando tutor:', tutor)
          return (
            <option key={tutor.id} value={tutor.id}>
              {tutor.nombre || 'Sin nombre'}
            </option>
          )
        })}
      </select>
    </>
  )}
</div>

          {/* Archivo (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cambiar archivo (opcional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.doc"
                className="hidden"
                id="edit-file"
                disabled={loading}
              />
              <label htmlFor="edit-file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <span className="text-sm text-indigo-600 font-medium">
                      {file.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      <span className="text-indigo-600 font-medium">
                        Seleccionar nuevo archivo
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PDF, DOCX o DOC • Dejá vacío para mantener el actual
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
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
              disabled={loading || loadingTutores}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando cambios...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Guardar cambios
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
// Línea de tiempo de versiones
// =========================
function VersionTimeline({ versiones }) {
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

  const iconoPorEstado = {
    'pendiente': <Clock className="w-4 h-4 text-yellow-500" />,
    'aprobada':  <CheckCircle className="w-4 h-4 text-green-500" />,
    'rechazada': <XCircle className="w-4 h-4 text-red-500" />,
  }

  return (
    <div className="space-y-4">
      {versiones.map((version, index) => (
        <div key={version.version_id} className="relative">
          {index < versiones.length - 1 && (
            <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200 -z-10" />
          )}

          <div className={`flex gap-4 p-4 rounded-xl border ${
            version.is_current
              ? 'border-indigo-200 bg-indigo-50'
              : 'border-gray-100 bg-white'
          }`}>

            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              version.is_current ? 'bg-indigo-100' : 'bg-gray-100'
            }`}>
              {iconoPorEstado[version.estado] || <Clock className="w-4 h-4 text-gray-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${
                    version.is_current ? 'text-indigo-700' : 'text-gray-700'
                  }`}>
                    Versión {version.numero_version}
                  </span>
                  <Badge text={version.estado} />
                  {version.is_current && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      Actual
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePreview(version.nombre_archivo)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Vista previa"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(version.nombre_archivo)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-2">
                {new Date(version.fecha_creacion).toLocaleDateString('es-AR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>

              {version.observaciones && (
                <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-100">
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600 italic">
                    {version.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// =========================
// Página principal
// =========================
export function TesinaDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAlumno, isTutor, isAdmin } = useAuth()

  const [tesina, setTesina] = useState(null)
  const [versiones, setVersiones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showReentregaModal, setShowReentregaModal] = useState(false)
  const [showEditarTesinaModal, setShowEditarTesinaModal] = useState(false)

  const fetchDetalle = async () => {
    setLoading(true)
    try {
      const tResponse = await api.get(`/tesinas/${id}`)
      setTesina(tResponse.data)

      const vResponse = await api.get(`/tesinas/${id}/versions`)
      setVersiones(vResponse.data || [])

    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar el detalle de la tesina')
    } finally {
      setLoading(false)
    }
  }

  const handleEditarSaved = () => {
  setShowEditarTesinaModal(false)
  setSuccess('¡Tesina actualizada correctamente!')
  fetchDetalle()
  setTimeout(() => setSuccess(''), 3000)
  }

  const handleReentregaSaved = () => {
    setShowReentregaModal(false)
    setSuccess('¡Nueva versión enviada correctamente!')
    fetchDetalle()
    setTimeout(() => setSuccess(''), 3000)
  }

  useEffect(() => {
    fetchDetalle()
  }, [id])

  const versionActual = versiones.find(v => v.is_current)
  const puedeReentregar = isAlumno && versionActual?.estado === 'rechazada'
  const puedeEditar = isAlumno && versionActual?.estado === 'pendiente'

  if (loading) {
    return (
      <Layout>
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <Alert type="error" message={error} />
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {tesina?.titulo || 'Sin título'}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {versionActual && <Badge text={versionActual.estado} />}
                <span className="text-sm text-gray-500">
                  {versiones.length} versión{versiones.length !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
<div className="flex gap-2">
  {/* Botón editar (solo si está pendiente) */}
  {puedeEditar && (
    <button
      onClick={() => setShowEditarTesinaModal(true)}
      className="btn btn-secondary flex items-center gap-2"
    >
      <Pencil className="w-4 h-4" />
      Editar tesina
    </button>
  )}

  {/* Botón reenviar (solo si está rechazada) */}
  {puedeReentregar && (
    <button
      onClick={() => setShowReentregaModal(true)}
      className="btn btn-primary flex items-center gap-2"
    >
      <Upload className="w-4 h-4" />
      Reenviar versión
    </button>
  )}
</div>
        </div>
      </div>

      {/* Alertas */}
      {success && (
        <div className="mb-6">
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda: Info */}
        <div className="lg:col-span-1 space-y-4">

          {/* Info de la tesina */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">
              Información
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Estado actual</p>
                {versionActual
                  ? <Badge text={versionActual.estado} />
                  : <span className="text-sm text-gray-500">Sin versiones</span>
                }
              </div>
              {tesina?.alumno_nombre && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Alumno</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tesina.alumno_nombre}
                  </p>
                </div>
              )}

              {tesina?.tutor_nombre && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Tutor</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tesina.tutor_nombre}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">Versión actual</p>
                <p className="text-sm font-medium text-gray-900">
                  v{versionActual?.numero_version || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Total de versiones</p>
                <p className="text-sm font-medium text-gray-900">
                  {versiones.length}
                </p>
              </div>
            </div>
          </div>

          {/* Resumen */}
          {tesina?.resumen && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                Resumen
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {tesina.resumen}
              </p>
            </div>
          )}

          {/* Observaciones actuales */}
          {versionActual?.observaciones && (
            <div className={`rounded-xl p-5 border ${
              versionActual.estado === 'rechazada'
                ? 'bg-red-50 border-red-200'
                : versionActual.estado === 'aprobada'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Observaciones del tutor
              </h2>
              <p className="text-sm leading-relaxed">
                {versionActual.observaciones}
              </p>

              {puedeReentregar && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-xs text-red-600 font-medium">
                    Tu tesina fue rechazada. Podés reenviar una versión corregida.
                  </p>
                  <button
                    onClick={() => setShowReentregaModal(true)}
                    className="mt-2 w-full btn btn-danger flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Reenviar versión corregida
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha: Historial */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-5">
              Historial de versiones
            </h2>

            {versiones.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Sin versiones registradas
              </p>
            ) : (
              <VersionTimeline versiones={versiones} />
            )}
          </div>
        </div>
      </div>

      {/* Modal reentrega */}
      {showReentregaModal && (
        <ReentregaModal
          tesinaId={id}
          onClose={() => setShowReentregaModal(false)}
          onSaved={handleReentregaSaved}
        />
      )}

      {/* Modal editar tesina (título, resumen, tutor, archivo) */}
{showEditarTesinaModal && tesina && (
  <EditarTesinaModal
    tesina={tesina}
    onClose={() => setShowEditarTesinaModal(false)}
    onSaved={handleEditarSaved}
  />
)}
    </Layout>
  )
}