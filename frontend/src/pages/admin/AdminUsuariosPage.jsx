import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout/Layout'
import { Spinner } from '../../components/Common/Spinner'
import { Alert } from '../../components/Common/Alert'
import { EmptyState } from '../../components/Common/EmptyState'
import { Badge } from '../../components/Common/Badge'
import api from '../../services/api'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  KeyRound,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

// =========================
// Modal crear/editar alumno
// =========================
function UsuarioModal({ usuario, onClose, onSaved }) {
  const isEditing = !!usuario

  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
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
      setError('La contraseña es obligatoria al crear un alumno')
      return
    }

    if (!isEditing && form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      if (isEditing) {
        await api.put(`/admin/usuarios/${usuario.id}`, {
          nombre: form.nombre,
          email: form.email,
        })
      } else {
        await api.post('/admin/usuarios', {
          nombre: form.nombre,
          email: form.email,
          password: form.password,
        })
      }

      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el alumno')
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
            {isEditing ? 'Editar Alumno' : 'Nuevo Alumno'}
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
              placeholder="Ej: Juan Pérez"
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
              placeholder="juan@email.com"
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
                isEditing ? 'Guardar cambios' : 'Crear alumno'
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
function CambiarPasswordModal({ usuario, onClose, onSaved }) {
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
      await api.put(`/admin/usuarios/${usuario.id}/password`, {
        password
      })
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
            <p className="text-sm text-gray-500 mt-1">
              {usuario.nombre}
            </p>
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
export function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [activoFiltro, setActivoFiltro] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('per_page', 10)
      if (search) params.append('search', search)
      if (activoFiltro !== '') params.append('activo', activoFiltro)

      const response = await api.get(`/admin/usuarios?${params}`)

      if (response.data.items !== undefined) {
        setUsuarios(response.data.items || [])
        setPagination(response.data.pagination || null)
      } else if (Array.isArray(response.data)) {
        setUsuarios(response.data)
        setPagination(null)
      } else {
        setUsuarios([])
        setPagination(null)
      }

    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar los alumnos')
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [page, activoFiltro])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchUsuarios()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreate = () => {
    setSelectedUsuario(null)
    setShowModal(true)
  }

  const handleEdit = (usuario) => {
    setSelectedUsuario(usuario)
    setShowModal(true)
  }

  const handlePassword = (usuario) => {
    setSelectedUsuario(usuario)
    setShowPasswordModal(true)
  }

  const handleSaved = () => {
    setShowModal(false)
    setShowPasswordModal(false)
    setSuccess(
      showPasswordModal
        ? 'Contraseña actualizada correctamente'
        : selectedUsuario
          ? 'Alumno actualizado correctamente'
          : 'Alumno creado correctamente'
    )
    setSelectedUsuario(null)
    fetchUsuarios()
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleToggleEstado = async (usuario) => {
    setTogglingId(usuario.id)
    try {
      await api.put(`/admin/usuarios/${usuario.id}/estado`, {
        activo: !usuario.activo
      })
      setSuccess(`Alumno ${!usuario.activo ? 'activado' : 'desactivado'} correctamente`)
      fetchUsuarios()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar el estado')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('⚠️ ¿Estás seguro de ELIMINAR permanentemente este alumno?\n\nEsta acción NO se puede deshacer.\n\nSi solo querés desactivarlo temporalmente, usá el botón de activar/desactivar (toggle verde).')) return

    setDeletingId(id)
    try {
      await api.delete(`/admin/usuarios/${id}`)
      setSuccess('Alumno eliminado permanentemente')
      fetchUsuarios()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el alumno')
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
            Gestión de Alumnos
          </h1>
          <p className="text-gray-600 mt-1">
            {pagination
              ? `${pagination.total_items} alumnos en total`
              : `${usuarios.length} alumnos en total`
            }
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo alumno
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
          {/* Búsqueda */}
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

          {/* Filtro estado */}
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
      ) : usuarios.length === 0 ? (
        <EmptyState
          title="Sin alumnos"
          description="No hay alumnos con los filtros aplicados"
          action={
            <button onClick={handleCreate} className="btn btn-primary">
              Crear primer alumno
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
                    Alumno
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase px-6 py-4 hidden md:table-cell">
                    Email
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
                {usuarios.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Nombre */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-indigo-600">
                            {usuario.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {usuario.nombre}
                          </p>
                          <p className="text-xs text-gray-500 md:hidden">
                            {usuario.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600">{usuario.email}</p>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <Badge text={usuario.activo ? 'activo' : 'inactivo'} />
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">

                        {/* Activar/Desactivar */}
                        <button
                          onClick={() => handleToggleEstado(usuario)}
                          disabled={togglingId === usuario.id}
                          className={`p-2 rounded-lg transition-colors ${
                            usuario.activo
                              ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                              : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                          }`}
                          title={usuario.activo ? 'Desactivar' : 'Activar'}
                        >
                          {togglingId === usuario.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : usuario.activo ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Cambiar contraseña */}
                        <button
                          onClick={() => handlePassword(usuario)}
                          className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Cambiar contraseña"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Eliminar permanentemente */}
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          disabled={deletingId === usuario.id || usuario.total_tesinas > 0}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            usuario.total_tesinas > 0
                              ? 'No se puede eliminar: el alumno tiene tesinas asociadas'
                              : 'Eliminar permanentemente'
                          }
                        >
                          {deletingId === usuario.id ? (
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
        <UsuarioModal
          usuario={selectedUsuario}
          onClose={() => {
            setShowModal(false)
            setSelectedUsuario(null)
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal cambiar contraseña */}
      {showPasswordModal && selectedUsuario && (
        <CambiarPasswordModal
          usuario={selectedUsuario}
          onClose={() => {
            setShowPasswordModal(false)
            setSelectedUsuario(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </Layout>
  )
}