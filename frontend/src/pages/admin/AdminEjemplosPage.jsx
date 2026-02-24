import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout/Layout'
import { Spinner } from '../../components/Common/Spinner'
import { Alert } from '../../components/Common/Alert'
import { EmptyState } from '../../components/Common/EmptyState'
import api from '../../services/api'
import {
  FileSearch,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Upload,
  Search,
  Calendar
} from 'lucide-react'

// =========================
// Modal para crear/editar ejemplo
// =========================
function EjemploModal({ ejemplo, onClose, onSaved }) {
  const isEditing = !!ejemplo

  const [form, setForm] = useState({
    titulo: ejemplo?.titulo || '',
    nombre_estudiante: ejemplo?.nombre_estudiante || '',
    anio: ejemplo?.anio || new Date().getFullYear(),
    resumen: ejemplo?.resumen || '',
    tutor: ejemplo?.tutor || '',
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    setError('')

    if (!isEditing && !file) {
      setError('Debes seleccionar un archivo')
      return
    }

    setLoading(true)

    try {
      if (isEditing) {
        await api.put(`/admin/ejemplos/${ejemplo.id}`, {
          ...form,
          anio: parseInt(form.anio)
        })
      } else {
        const formData = new FormData()
        Object.entries(form).forEach(([key, val]) => formData.append(key, val))
        formData.append('file', file)

        await api.post('/admin/ejemplos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el ejemplo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Ejemplo' : 'Nuevo Ejemplo'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del estudiante *
            </label>
            <input
              type="text"
              name="nombre_estudiante"
              value={form.nombre_estudiante}
              onChange={handleChange}
              className="input"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año *
              </label>
              <input
                type="number"
                name="anio"
                value={form.anio}
                onChange={handleChange}
                className="input"
                required
                min="2000"
                max="2099"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tutor *
              </label>
              <input
                type="text"
                name="tutor"
                value={form.tutor}
                onChange={handleChange}
                className="input"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resumen
            </label>
            <textarea
              name="resumen"
              value={form.resumen}
              onChange={handleChange}
              rows={3}
              className="input resize-none"
              disabled={loading}
            />
          </div>

          {/* Archivo solo al crear */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  id="ejemplo-file"
                  disabled={loading}
                />
                <label htmlFor="ejemplo-file" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileSearch className="w-5 h-5 text-indigo-600" />
                      <span className="text-sm text-indigo-600 font-medium">
                        {file.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-500">
                        <span className="text-indigo-600 font-medium">
                          Seleccionar archivo
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">PDF, DOCX o DOC</p>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

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
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEditing ? 'Guardar cambios' : 'Crear ejemplo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =========================
// Página principal
// =========================
export function AdminEjemplosPage() {
  const [ejemplos, setEjemplos] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [selectedEjemplo, setSelectedEjemplo] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchEjemplos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('per_page', 10)
      if (search) params.append('search', search)

      const response = await api.get(`/admin/ejemplos?${params}`)

      // Manejar tanto respuesta paginada como lista simple
      if (response.data.items !== undefined) {
        setEjemplos(response.data.items || [])
        setPagination(response.data.pagination || null)
      } else if (Array.isArray(response.data)) {
        setEjemplos(response.data)
        setPagination(null)
      } else {
        setEjemplos([])
        setPagination(null)
      }

    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar los ejemplos')
      setEjemplos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEjemplos()
  }, [page])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchEjemplos()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const handleEdit = (ejemplo) => {
    setSelectedEjemplo(ejemplo)
    setShowModal(true)
  }

  const handleCreate = () => {
    setSelectedEjemplo(null)
    setShowModal(true)
  }

  const handleSaved = () => {
    setShowModal(false)
    setSuccess(
      selectedEjemplo
        ? 'Ejemplo actualizado correctamente'
        : 'Ejemplo creado correctamente'
    )
    setSelectedEjemplo(null)
    fetchEjemplos()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este ejemplo?')) return

    setDeletingId(id)
    try {
      await api.delete(`/admin/ejemplos/${id}`)
      setSuccess('Ejemplo eliminado correctamente')
      fetchEjemplos()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el ejemplo')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Ejemplos
          </h1>
          <p className="text-gray-600 mt-1">
            {pagination
              ? `${pagination.total_items} ejemplos en total`
              : `${ejemplos.length} ejemplos en total`
            }
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo ejemplo
        </button>
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

      {/* Búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, estudiante o tutor..."
            className="input pl-9"
          />
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      ) : ejemplos.length === 0 ? (
        <EmptyState
          title="Sin ejemplos"
          description="No hay ejemplos cargados en el sistema"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              Crear primer ejemplo
            </button>
          }
        />
      ) : (
        <>
          {/* Tabla */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Título / Estudiante
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4 hidden md:table-cell">
                    Tutor
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4 hidden sm:table-cell">
                    Año
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ejemplos.map((ejemplo) => (
                  <tr
                    key={ejemplo.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileSearch className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {ejemplo.titulo}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ejemplo.nombre_estudiante}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{ejemplo.tutor}</p>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {ejemplo.anio}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(ejemplo)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ejemplo.id)}
                          disabled={deletingId === ejemplo.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === ejemplo.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-sm text-gray-600">
                Página {pagination.page} de {pagination.total_pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={!pagination.has_prev}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.has_next}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <EjemploModal
          ejemplo={selectedEjemplo}
          onClose={() => {
            setShowModal(false)
            setSelectedEjemplo(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </Layout>
  )
}