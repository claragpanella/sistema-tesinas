import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout/Layout'
import { Alert } from '../components/Common/Alert'
import { Spinner } from '../components/Common/Spinner'
import api from '../services/api'
import { Upload, FileText, Loader2 } from 'lucide-react'

export function SubirTesinaPage() {
  const navigate = useNavigate()

  const [yaExiste, setYaExiste] = useState(false)
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

    useEffect(() => {
    const checkExistencia = async () => {
      try {
        const response = await api.get('/tesinas?per_page=1')
        const items = response.data.items || []
        if (items.length > 0) {
          setYaExiste(true)
        }
      } catch (err) {
        console.error('Error:', err)
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
    const allowed = ['pdf', 'docx', 'doc']
    const extension = selectedFile.name.split('.').pop().toLowerCase()

    if (!allowed.includes(extension)) {
      setError('Solo se permiten archivos PDF, DOCX o DOC')
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

  if (yaExiste) {
    return (
      <Layout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Subir Tesina
          </h1>
          <p className="text-gray-600 mt-1">
            Ya tenés una tesina registrada
          </p>
        </div>

        <div className="max-w-2xl">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              ⚠️ Ya tenés una tesina registrada
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              Solo podés tener una tesina en el sistema. Si necesitás enviar 
              correcciones o una nueva versión, utilizá la opción 
              <span className="font-semibold"> "Reenviar versión"</span> desde 
              el detalle de tu tesina.
            </p>
            <button
              onClick={() => navigate('/tesinas')}
              className="btn btn-primary"
            >
              Ver mi tesina
            </button>
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
                    accept=".pdf,.docx,.doc"
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
                          PDF, DOCX o DOC
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