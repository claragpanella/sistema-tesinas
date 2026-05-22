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
// Utilidades compartidas
// =========================
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc']

function getFileExtension(filename) {
  return filename?.split('.').pop().toLowerCase()
}

function validateFile(file) {
  const ext = getFileExtension(file.name)
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Solo se permiten archivos PDF, DOCX o DOC'
  }
  return null
}

async function downloadFile(filename) {
  const response = await api.get(`/uploads/${filename}`, { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

async function previewFile(filename) {
  const ext = getFileExtension(filename)
  const mimeTypes = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
  }
  const response = await api.get(`/uploads/${filename}`, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: mimeTypes[ext] || 'application/octet-stream' })
  const url = window.URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

// =========================
// Componente FileDropzone (reutilizable)
// =========================
function FileDropzone({ file, onChange, disabled, inputId }) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
      <input
        type="file"
        onChange={onChange}
        accept=".pdf,.docx,.doc"
        className="hidden"
        id={inputId}
        disabled={disabled}
      />
      <label htmlFor={inputId} className="cursor-pointer">
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <span className="text-sm text-indigo-600 font-medium">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              <span className="text-indigo-600 font-medium">Seleccionar archivo</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, DOCX o DOC</p>
          </>
        )}
      </label>
    </div>
  )
}

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
    const err = validateFile(selectedFile)
    if (err) { setError(err); setFile(null); return }
    setFile(selectedFile)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Debes seleccionar un archivo'); return }

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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Reenviar Tesina</h2>
            <p className="text-sm text-gray-500 mt-1">Subí la versión corregida</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <span className="text-gray-500 text-xl leading-none">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <FileDropzone
            file={file}
            onChange={handleFileChange}
            disabled={loading}
            inputId="reentrega-file"
          />

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1" disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
                : <><Upload className="w-4 h-4" />Reenviar</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =========================
// Modal editar tesina
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
      try {
        const response = await api.get('/tutores')
        setTutores(Array.isArray(response.data) ? response.data : [])
      } catch {
        setError('Error al cargar la lista de tutores')
      } finally {
        setLoadingTutores(false)
      }
    }
    fetchTutores()
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    const err = validateFile(selectedFile)
    if (err) { setError(err); setFile(null); return }
    setFile(selectedFile)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) { setError('El título es obligatorio'); return }
    if (!form.tutor_id) { setError('Debes seleccionar un tutor'); return }

    setLoading(true)
    try {
      await api.put(`/tesinas/${tesina.id}`, {
        titulo: form.titulo,
        resumen: form.resumen,
        tutor_id: parseInt(form.tutor_id)
      })
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
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar Tesina</h2>
            <p className="text-sm text-gray-500 mt-1">Actualizar información y archivo de tu tesina</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <span className="text-gray-500 text-xl leading-none">&times;</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700">
              ℹ️ <span className="font-semibold">Nota:</span> Solo podés editar mientras tu tesina está pendiente de revisión.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título de la tesina *</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resumen</label>
            <textarea
              name="resumen"
              value={form.resumen}
              onChange={handleChange}
              rows={4}
              className="input resize-none"
              placeholder="Breve descripción de tu tesina..."
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">{form.resumen.length} caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tutor asignado *</label>
            {loadingTutores ? (
              <div className="flex items-center gap-2 text-gray-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Cargando tutores...</span>
              </div>
            ) : tutores.length === 0 ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">No hay tutores disponibles. Contactá al administrador.</p>
              </div>
            ) : (
              <select
                name="tutor_id"
                value={form.tutor_id}
                onChange={handleChange}
                className="input"
                required
                disabled={loading}
              >
                <option value="">Seleccionar tutor</option>
                {tutores.map(tutor => (
                  <option key={tutor.id} value={tutor.id}>{tutor.nombre}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cambiar archivo (opcional)</label>
            <FileDropzone
              file={file}
              onChange={handleFileChange}
              disabled={loading}
              inputId="edit-file"
            />
            {!file && (
              <p className="text-xs text-gray-400 mt-1 text-center">Dejá vacío para mantener el archivo actual</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1" disabled={loading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading || loadingTutores}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando cambios...</>
                : <><CheckCircle className="w-4 h-4" />Guardar cambios</>
              }
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
const iconoPorEstado = {
  pendiente: <Clock className="w-4 h-4 text-yellow-500" />,
  aprobada:  <CheckCircle className="w-4 h-4 text-green-500" />,
  rechazada: <XCircle className="w-4 h-4 text-red-500" />,
}

function VersionTimeline({ versiones }) {
  return (
    <div className="space-y-4">
      {versiones.map((version, index) => {
        const ext = getFileExtension(version.nombre_archivo)
        const esWord = ext === 'docx' || ext === 'doc'

        return (
          <div key={version.version_id} className="relative">
            {index < versiones.length - 1 && (
              <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200 -z-10" />
            )}

            <div className={`flex gap-4 p-4 rounded-xl border ${
              version.is_current ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-white'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                version.is_current ? 'bg-indigo-100' : 'bg-gray-100'
              }`}>
                {iconoPorEstado[version.estado_tutor] || <Clock className="w-4 h-4 text-gray-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${version.is_current ? 'text-indigo-700' : 'text-gray-700'}`}>
                      Versión {version.numero_version}
                    </span>
                    <Badge text={version.estado_tutor} />
                    {version.is_current && (
                      <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Actual</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => !esWord && previewFile(version.nombre_archivo)}
                      disabled={esWord}
                      className={`p-1.5 rounded-lg transition-colors ${
                        esWord
                          ? 'text-gray-200 cursor-not-allowed'
                          : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                      title={esWord ? 'Vista previa no disponible para archivos Word' : 'Vista previa'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadFile(version.nombre_archivo)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-2">
                  {new Date(version.fecha_creacion).toLocaleDateString('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>

                {version.observaciones && (
                  <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-gray-100">
                    <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 italic">{version.observaciones}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
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
  const [enviando, setEnviando] = useState(false)

  const fetchDetalle = async () => {
    setLoading(true)
    try {
      const [tResponse, vResponse] = await Promise.all([
        api.get(`/tesinas/${id}`),
        api.get(`/tesinas/${id}/versions`)
      ])
      setTesina(tResponse.data)
      setVersiones(vResponse.data || [])
    } catch (err) {
      setError('Error al cargar el detalle de la tesina')
    } finally {
      setLoading(false)
    }
  }

  const handleEnviarATutor = async () => {
    const confirmacion = window.confirm(
      '¿Estás seguro de enviar esta tesina al tutor?\n\n' +
      '• Ya no podrás editarla\n' +
      '• El tutor podrá revisarla y aprobar/rechazar\n' +
      '• Es recomendable analizarla con el chat antes de enviarla\n\n' +
      '¿Continuar?'
    )
    if (!confirmacion) return

    setEnviando(true)
    try {
      const response = await api.post(`/tesinas/${id}/enviar-a-tutor`)
      setSuccess(response.data.message)
      setTimeout(fetchDetalle, 1000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la tesina al tutor')
    } finally {
      setEnviando(false)
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

  useEffect(() => { fetchDetalle() }, [id])

  const versionActual = versiones.find(v => v.is_current)
  const puedeReentregar = isAlumno && tesina?.estado_tutor === 'rechazada'
  const puedeEditar = isAlumno && tesina?.estado_tutor === 'pendiente'

  if (loading) {
    return <Layout><div className="py-12"><Spinner size="lg" /></div></Layout>
  }

  if (error) {
    return <Layout><Alert type="error" message={error} /></Layout>
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
              <h1 className="text-3xl font-bold text-gray-900">{tesina?.titulo || 'Sin título'}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {versionActual && <Badge text={versionActual.estado_tutor} />}
                <span className="text-sm text-gray-500">
                  {versiones.length} versión{versiones.length !== 1 ? 'es' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {puedeEditar && (
              <button
                onClick={() => setShowEditarTesinaModal(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Editar tesina
              </button>
            )}
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

      {success && (
        <div className="mb-6">
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        </div>
      )}

      {/* Banner borrador */}
      {isAlumno && tesina?.estado_alumno === 'borrador' && (
        <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 mb-2">Esta tesina está en BORRADOR</h3>
              <p className="text-sm text-yellow-700 mb-4">Todavía no fue enviada al tutor. Podés:</p>
              <ul className="text-sm text-yellow-700 mb-4 space-y-1">
                <li>• Analizarla con el <strong>chat asistente</strong> para detectar problemas</li>
                <li>• Hacer todas las correcciones que necesites</li>
                <li>• Subir nuevas versiones</li>
                <li>• Cuando esté lista, enviarla al tutor para su revisión</li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/chat?tesina=${id}&autoanalizar=1`)}
                  className="px-4 py-2 bg-white border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors flex items-center gap-2"
                >
                  Analizar con el chat
                </button>
                <button
                  onClick={handleEnviarATutor}
                  disabled={enviando}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {enviando
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</>
                    : 'Enviar al tutor'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner enviada/pendiente */}
      {isAlumno && tesina?.estado_alumno === 'enviada' && tesina?.estado_tutor === 'pendiente' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <h4 className="font-semibold text-blue-900 mb-1">Tesina enviada al tutor</h4>
          <p className="text-sm text-blue-700">
            Tu tesina fue enviada a <strong>{tesina.tutor_nombre || 'tu tutor'}</strong> y está esperando revisión.
          </p>
        </div>
      )}

      {/* Banner aprobada */}
      {tesina?.estado_tutor === 'aprobada' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h4 className="font-semibold text-green-900 mb-1">¡Tesina aprobada!</h4>
              <p className="text-sm text-green-700">
                Felicitaciones, tu tesina fue aprobada por {tesina.tutor_nombre || 'tu tutor'}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner rechazada */}
      {tesina?.estado_tutor === 'rechazada' && tesina?.observaciones && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 mb-1">Tesina rechazada</h4>
              <p className="text-sm text-red-700 mb-2">Tu tutor solicitó correcciones:</p>
              <div className="bg-white p-3 rounded border border-red-200">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{tesina.observaciones}</p>
              </div>
              {isAlumno && (
                <>
                  <p className="text-xs text-red-600 mt-3">
                    Realizá las correcciones necesarias y subí una nueva versión.
                  </p>
                  <button
                    onClick={() => navigate(`/chat?tesina=${id}&autoanalizar=1`)}
                    className="mt-3 px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm"
                  >
                    Analizar correcciones con el chat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda: Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Información</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Estado alumno</p>
                {tesina ? <Badge text={tesina.estado_alumno} /> : <span className="text-sm text-gray-500">-</span>}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Estado tutor</p>
                {tesina ? <Badge text={tesina.estado_tutor} /> : <span className="text-sm text-gray-500">-</span>}
              </div>
              {tesina?.alumno_nombre && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Alumno</p>
                  <p className="text-sm font-medium text-gray-900">{tesina.alumno_nombre}</p>
                </div>
              )}
              {tesina?.tutor_nombre && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Tutor</p>
                  <p className="text-sm font-medium text-gray-900">{tesina.tutor_nombre}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">Versión actual</p>
                <p className="text-sm font-medium text-gray-900">v{versionActual?.numero_version || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Total de versiones</p>
                <p className="text-sm font-medium text-gray-900">{versiones.length}</p>
              </div>
            </div>
          </div>

          {tesina?.resumen && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Resumen</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{tesina.resumen}</p>
            </div>
          )}

          {versionActual?.observaciones && (
            <div className={`rounded-xl p-5 border ${
              versionActual.estado_tutor === 'rechazada' ? 'bg-red-50 border-red-200'
              : versionActual.estado_tutor === 'aprobada' ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Observaciones del tutor
              </h2>
              <p className="text-sm leading-relaxed">{versionActual.observaciones}</p>

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
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-5">Historial de versiones</h2>
            {versiones.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Sin versiones registradas</p>
            ) : (
              <VersionTimeline versiones={versiones} />
            )}
          </div>
        </div>
      </div>

      {showReentregaModal && (
        <ReentregaModal
          tesinaId={id}
          onClose={() => setShowReentregaModal(false)}
          onSaved={handleReentregaSaved}
        />
      )}
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
