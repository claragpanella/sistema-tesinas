import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout/Layout'
import { Alert } from '../components/Common/Alert'
import { Spinner } from '../components/Common/Spinner'
import api from '../services/api'
import { formatearFecha } from '../utils/fechas'
import { Badge } from '../components/Common/Badge'
import { Upload, FileText, Loader2, Info, ArrowRight } from 'lucide-react'

export function SubirTesinaPage() {
  const navigate = useNavigate()

  const [tesinaExistente, setTesinaExistente] = useState(null)
  const [verificando, setVerificando] = useState(true)
  const [tutores, setTutores] = useState([])
  const [loadingTutores, setLoadingTutores] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    titulo: '',
    resumen: '',
    tutor_id: '',
  })
  const [file, setFile] = useState(null)

  // Cada alumno tiene una sola tesina: si ya existe, se muestra en lugar del formulario
  useEffect(() => {
    const checkExistencia = async () => {
      try {
        const response = await api.get('/tesinas?per_page=1')
        const items = response.data.items || []
        if (items.length > 0) {
          setTesinaExistente(items[0])
        }
      } catch (err) {
        console.error('Error al verificar tesinas existentes:', err)
      } finally {
        setVerificando(false)
      }
    }

    checkExistencia()
  }, [])

  // Cargar tutores al montar el componente
  useEffect(() => {
    const fetchTutores = async () => {
      try {
        const response = await api.get('/tutores')
        setTutores(response.data)
      } catch (err) {
        setError('Error al cargar los tutores')
        console.error(err)
      } finally {
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

    // Validar extensión
    const allowed = ['pdf', 'docx']
    const extension = selectedFile.name.split('.').pop().toLowerCase()

    if (!allowed.includes(extension)) {
      setError('Solo se permiten archivos PDF o DOCX')
      setFile(null)
      e.target.value = ''
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.tutor_id) {
      setError('Debes seleccionar un tutor')
      return
    }

    if (!file) {
      setError('Debes seleccionar un archivo')
      return
    }

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('titulo', form.titulo)
      formData.append('resumen', form.resumen)
      formData.append('tutor_id', form.tutor_id)
      formData.append('file', file)

      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess('¡Tesina subida correctamente!')
      setForm({ titulo: '', resumen: '', tutor_id: '' })
      setFile(null)

      // Redirigir después de 2 segundos
      setTimeout(() => navigate('/tesinas'), 2000)

    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir la tesina')
    } finally {
      setLoading(false)
    }
  }

  if (verificando) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    )
  }

  if (tesinaExistente) {
    const fecha = formatearFecha(tesinaExistente.updated_at)

    return (
      <Layout>
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">Subir tesina</h1>
          <p className="text-gray-600 mt-1">Cada alumno tiene una sola tesina en el sistema.</p>
        </div>

        <div className="max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
            <Info className="w-[18px] h-[18px] text-indigo-600" />
            <h2 className="text-[15px] font-semibold text-gray-900">Ya tenés una tesina cargada</h2>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[17px] font-semibold text-gray-900 sm:truncate">{tesinaExistente.titulo}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-gray-500">
                <Badge
                  estado_alumno={tesinaExistente.estado_alumno}
                  estado_tutor={tesinaExistente.estado_tutor}
                />
                {tesinaExistente.numero_version && <span>Versión {tesinaExistente.numero_version}</span>}
                {fecha && <><span aria-hidden="true">·</span><span>Actualizada el {fecha}</span></>}
              </div>
            </div>
            <button
              onClick={() => navigate(`/tesinas/${tesinaExistente.id}`)}
              className="w-full sm:w-auto flex-shrink-0 min-h-[44px] px-[18px] inline-flex items-center justify-center gap-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ir a mi tesina
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-[13px] text-gray-600">
            Para corregirla, entrá a tu tesina y subí una nueva versión desde ahí.
          </div>
        </div>
      </Layout>
    )
  }


  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Subir Tesina
        </h1>
        <p className="text-gray-600 mt-1">
          Cargá tu proyecto final para revisión
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          {success && (
            <div className="mb-6">
              <Alert type="success" message={success} />
            </div>
          )}

          {loadingTutores ? (
            <div className="py-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la tesina
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ej: Sistema de gestión académica..."
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
                  placeholder="Breve descripción del proyecto..."
                  disabled={loading}
                />
              </div>

              {/* Tutor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tutor asignado
                </label>
                <select
                  name="tutor_id"
                  value={form.tutor_id}
                  onChange={handleChange}
                  className="input"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar tutor...</option>
                  {tutores.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.nombre}
                    </option>
                  ))}
                </select>

                {tutores.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No hay tutores disponibles. Contactá al administrador.
                  </p>
                )}
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo de la tesina
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx"
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    {file ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-6 h-6 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-600">
                          {file.name}
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="text-indigo-600 font-medium">
                            Hacé clic para seleccionar
                          </span>{' '}
                          o arrastrá el archivo aquí
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF o DOCX
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={loading || tutores.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Subir Tesina
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}