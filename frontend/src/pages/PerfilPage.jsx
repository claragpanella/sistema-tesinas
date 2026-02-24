import { useState } from 'react'
import { Layout } from '../components/Layout/Layout'
import { Alert } from '../components/Common/Alert'
import { Badge } from '../components/Common/Badge'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  User,
  Mail,
  KeyRound,
  Loader2,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Save
} from 'lucide-react'

// =========================
// Sección cambiar contraseña
// =========================
function CambiarPasswordForm() {
  const [form, setForm] = useState({
    password_actual: '',
    password_nueva: '',
    confirmar: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password_nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (form.password_nueva !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      await api.put('/perfil/password', {
        password_actual: form.password_actual,
        password_nueva: form.password_nueva,
      })

      setSuccess('Contraseña actualizada correctamente')
      setForm({ password_actual: '', password_nueva: '', confirmar: '' })
      setTimeout(() => setSuccess(''), 3000)

    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center">
          <KeyRound className="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Cambiar contraseña
          </h2>
          <p className="text-sm text-gray-500">
            Actualizá tu contraseña de acceso
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña actual *
          </label>
          <input
            type="password"
            name="password_actual"
            value={form.password_actual}
            onChange={handleChange}
            className="input"
            placeholder="Tu contraseña actual"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nueva contraseña *
          </label>
          <input
            type="password"
            name="password_nueva"
            value={form.password_nueva}
            onChange={handleChange}
            className="input"
            placeholder="Mínimo 6 caracteres"
            required
            disabled={loading}
          />

          {/* Indicador de fortaleza */}
          {form.password_nueva && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      form.password_nueva.length >= level * 2
                        ? level <= 1 ? 'bg-red-400'
                          : level <= 2 ? 'bg-yellow-400'
                          : level <= 3 ? 'bg-blue-400'
                          : 'bg-green-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {form.password_nueva.length < 2 && 'Muy corta'}
                {form.password_nueva.length >= 2 && form.password_nueva.length < 4 && 'Débil'}
                {form.password_nueva.length >= 4 && form.password_nueva.length < 6 && 'Regular'}
                {form.password_nueva.length >= 6 && form.password_nueva.length < 8 && 'Buena'}
                {form.password_nueva.length >= 8 && 'Fuerte ✓'}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar nueva contraseña *
          </label>
          <input
            type="password"
            name="confirmar"
            value={form.confirmar}
            onChange={handleChange}
            className="input"
            placeholder="Repetir nueva contraseña"
            required
            disabled={loading}
          />
          {form.confirmar && (
            <p className={`text-xs mt-1 ${
              form.password_nueva === form.confirmar
                ? 'text-green-600'
                : 'text-red-500'
            }`}>
              {form.password_nueva === form.confirmar
                ? '✓ Las contraseñas coinciden'
                : '✗ Las contraseñas no coinciden'
              }
            </p>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Actualizar contraseña
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// =========================
// Sección editar nombre
// =========================
function EditarNombreForm({ user, onUpdated }) {
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!nombre.trim()) {
      setError('El nombre no puede estar vacío')
      return
    }

    setLoading(true)

    try {
      await api.put('/perfil', { nombre })
      setSuccess('Nombre actualizado correctamente')
      onUpdated(nombre)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Datos personales
          </h2>
          <p className="text-sm text-gray-500">
            Actualizá tu información de perfil
          </p>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="input"
            placeholder="Tu nombre completo"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            className="input bg-gray-50 text-gray-500 cursor-not-allowed"
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">
            El email no se puede modificar
          </p>
        </div>

        <button
          type="submit"
          className="btn btn-primary flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// =========================
// Página principal
// =========================
export function PerfilPage() {
  const { user, setUser } = useAuth()

  const rolInfo = {
    admin: {
      label: 'Administrador',
      icon: ShieldCheck,
      color: 'bg-purple-100 text-purple-700',
      descripcion: 'Acceso completo al sistema'
    },
    tutor: {
      label: 'Tutor',
      icon: GraduationCap,
      color: 'bg-blue-100 text-blue-700',
      descripcion: 'Revisión y evaluación de tesinas'
    },
    alumno: {
      label: 'Alumno',
      icon: BookOpen,
      color: 'bg-gray-100 text-gray-700',
      descripcion: 'Envío y seguimiento de tesinas'
    },
  }

  const info = rolInfo[user?.rol] || rolInfo['alumno']
  const RolIcon = info.icon

  const handleNombreUpdated = (nuevoNombre) => {
    const updatedUser = { ...user, nombre: nuevoNombre }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">
          Administrá tu información personal y seguridad
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna izquierda: Card de perfil */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">

            {/* Avatar */}
            <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">
                {user?.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Nombre y email */}
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {user?.nombre}
            </h2>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-4">
              <Mail className="w-4 h-4" />
              {user?.email}
            </div>

            {/* Badge de rol */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${info.color}`}>
              <RolIcon className="w-4 h-4" />
              {info.label}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              {info.descripcion}
            </p>

            {/* Separador */}
            <div className="border-t border-gray-100 mt-6 pt-6">
              <div className="text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Estado de cuenta</span>
                  <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    Activa
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Rol</span>
                  <Badge text={user?.rol} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha: Formularios */}
        <div className="lg:col-span-2 space-y-6">
          <EditarNombreForm
            user={user}
            onUpdated={handleNombreUpdated}
          />
          <CambiarPasswordForm />
        </div>
      </div>
    </Layout>
  )
}