import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout/Layout'
import { Spinner } from '../../components/Common/Spinner'
import { Alert } from '../../components/Common/Alert'
import { EmptyState } from '../../components/Common/EmptyState'
import { Badge } from '../../components/Common/Badge'
import api from '../../services/api'
import {
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  ClipboardList
} from 'lucide-react'

// =========================
// Modal crear/editar tutor
// =========================
function TutorModal({ tutor, onClose, onSaved }) {
  const isEditing = !!tutor

  const [form, setForm] = useState({
    nombre: tutor?.nombre || '',
    email: tutor?.email || '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isEditing && !form.password) {
      setError('La contraseña es obligatoria al crear un tutor')
      return
    }

    if (!isEditing && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      if (isEditing) {
        await api.put(`/admin/tutores/${tutor.id}`, {
          nombre: form.nombre,
          email: form.email,
        })
      } else {
        await api.post('/admin/tutores', {
          nombre: form.nombre,
          email: form.email,
          password: form.password,
        })
      }

      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el tutor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Tutor' : 'Nuevo Tutor'}
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
              Nombre completo *
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="input"
              placeholder="Ej: Dr. Juan Pérez"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input"
              placeholder="juan@universidad.edu"
              required
              disabled={loading}
            />
          </div>

          {/* Contraseña solo al crear */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
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
                isEditing ? 'Guardar cambios' : 'Crear tutor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =========================
// Modal cambiar contraseña
// =========================
function CambiarPasswordModal({ tutor, onClose, onSaved }) {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await api.put(`/admin/usuarios/${tutor.id}/password`, { password })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña')
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
              Cambiar Contraseña
            </h2>
            <p className="text-sm text-gray-500 mt-1">{tutor.nombre}</p>
          </div>
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
              Nueva contraseña *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Mínimo 6 caracteres"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña *
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="input"
              placeholder="Repetir contraseña"
              required
              disabled={loading}
            />
          </div>

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
                'Cambiar contraseña'
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
export function AdminTutoresPage() {
  const [tutores, setTutores] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activoFiltro, setActivoFiltro] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedTutor, setSelectedTutor] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchTutores = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('per_page', 10)
      if (search) params.append('search', search)
      if (activoFiltro !== '') params.append('activo', activoFiltro)

      const response = await api.get(`/admin/tutores?${params}`)

      if (response.data.items !== undefined) {
        setTutores(response.data.items || [])
        setPagination(response.data.pagination || null)
      } else if (Array.isArray(response.data)) {
        setTutores(response.data)
        setPagination(null)
      } else {
        setTutores([])
        setPagination(null)
      }

    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar los tutores')
      setTutores([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTutores()
  }, [page, activoFiltro])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchTutores()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreate = () => {
    setSelectedTutor(null)
    setShowModal(true)
  }

  const handleEdit = (tutor) => {
    setSelectedTutor(tutor)
    setShowModal(true)
  }

  const handlePassword = (tutor) => {
    setSelectedTutor(tutor)
    setShowPasswordModal(true)
  }

  const handleSaved = () => {
    setShowModal(false)
    setShowPasswordModal(false)
    setSuccess(
      showPasswordModal
        ? 'Contraseña actualizada correctamente'
        : selectedTutor
          ? 'Tutor actualizado correctamente'
          : 'Tutor creado correctamente'
    )
    setSelectedTutor(null)
    fetchTutores()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleToggleEstado = async (tutor) => {
    setTogglingId(tutor.id)
    try {
      await api.put(`/admin/tutores/${tutor.id}/estado`, {
        activo: !tutor.activo
      })
      setSuccess(`Tutor ${!tutor.activo ? 'activado' : 'desactivado'} correctamente`)
      fetchTutores()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar el estado')
    } finally {
      setTogglingId(null)
    }
  }

const handleDelete = async (id) => {
  if (!confirm('⚠️ ¿Estás seguro de ELIMINAR permanentemente este tutor? Esta acción NO se puede deshacer. Si solo querés desactivarlo temporalmente, usá el botón de activar/desactivar.')) return

  setDeletingId(id)
  try {
    await api.delete(`/admin/tutores/${id}`)
    setSuccess('Tutor eliminado permanentemente')
    fetchTutores()
    setTimeout(() => setSuccess(''), 3000)
  } catch (err) {
    setError(err.response?.data?.error || 'Error al eliminar el tutor')
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
            Gestión de Tutores
          </h1>
          <p className="text-gray-600 mt-1">
            {pagination
              ? `${pagination.total_items} tutores en total`
              : `${tutores.length} tutores en total`
            }
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo tutor
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

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="input pl-9"
            />
          </div>
          <select
            value={activoFiltro}
            onChange={(e) => { setActivoFiltro(e.target.value); setPage(1) }}
            className="input sm:w-40"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      ) : tutores.length === 0 ? (
        <EmptyState
          title="Sin tutores"
          description="No hay tutores registrados en el sistema"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              Crear primer tutor
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
                    Tutor
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4 hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4 hidden sm:table-cell">
                    Tesinas
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4 hidden lg:table-cell">
                    Estado
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase px-6 py-4">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tutores.map((tutor) => (
                  <tr
                    key={tutor.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {tutor.nombre}
                          </p>
                          <p className="text-xs text-gray-500 md:hidden">
                            {tutor.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{tutor.email}</p>
                    </td>

                    {/* Total tesinas */}
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <ClipboardList className="w-3 h-3" />
                        <span>{tutor.total_tesinas}</span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <Badge text={tutor.activo ? 'activo' : 'inactivo'} />
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">

                        {/* Activar/Desactivar */}
                        <button
                          onClick={() => handleToggleEstado(tutor)}
                          disabled={togglingId === tutor.id}
                          className={`p-2 rounded-lg transition-colors ${
                            tutor.activo
                              ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                              : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                          }`}
                          title={tutor.activo ? 'Desactivar' : 'Activar'}
                        >
                          {togglingId === tutor.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : tutor.activo ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => handleEdit(tutor)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Cambiar contraseña */}
                        <button
                          onClick={() => handlePassword(tutor)}
                          className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Cambiar contraseña"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Eliminar */}
                        <button
  onClick={() => handleDelete(tutor.id)}
  disabled={
    deletingId === tutor.id ||
    tutor.total_tesinas > 0
  }
  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
  title={
    tutor.total_tesinas > 0
      ? 'No se puede eliminar: tiene tesinas asignadas'
      : 'Eliminar permanentemente'
  }
>
  {deletingId === tutor.id ? (
    <Loader2 className="w-4 h-4 animate-spin" />
  ) : (
    <Trash2 className="w-4 h-4" />
  )}
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

      {/* Modal crear/editar */}
      {showModal && (
        <TutorModal
          tutor={selectedTutor}
          onClose={() => {
            setShowModal(false)
            setSelectedTutor(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal cambiar contraseña */}
      {showPasswordModal && selectedTutor && (
        <CambiarPasswordModal
          tutor={selectedTutor}
          onClose={() => {
            setShowPasswordModal(false)
            setSelectedTutor(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </Layout>
  )
}