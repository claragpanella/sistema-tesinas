import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Loader2, BookOpen } from 'lucide-react'
import api from '../services/api'

export function RegisterPage() {
  const navigate = useNavigate()
  
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmar: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (form.password !== form.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/register', {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: 'alumno'
      })

      // Mostrar modal de éxito
      setShowSuccess(true)

    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Repositorio Inteligente
          </h1>
          <p className="text-gray-600">
            Sistema de Gestión de Tesinas
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Crear cuenta
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
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

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="tu@email.com"
                required
                disabled={loading}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="Mínimo 6 caracteres"
                required
                disabled={loading}
              />
              {/* Indicador de fortaleza */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          form.password.length >= level * 2
                            ? level <= 1
                              ? 'bg-red-400'
                              : level <= 2
                                ? 'bg-yellow-400'
                                : level <= 3
                                  ? 'bg-blue-400'
                                  : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {form.password.length < 2 && 'Muy corta'}
                    {form.password.length >= 2 && form.password.length < 4 && 'Débil'}
                    {form.password.length >= 4 && form.password.length < 6 && 'Regular'}
                    {form.password.length >= 6 && form.password.length < 8 && 'Buena'}
                    {form.password.length >= 8 && 'Fuerte ✓'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña
              </label>
              <input
                type="password"
                name="confirmar"
                value={form.confirmar}
                onChange={handleChange}
                className="input"
                placeholder="Repetir contraseña"
                required
                disabled={loading}
              />
              {/* Verificación de coincidencia */}
              {form.confirmar && (
                <p className={`text-xs mt-1 ${
                  form.password === form.confirmar
                    ? 'text-green-600'
                    : 'text-red-500'
                }`}>
                  {form.password === form.confirmar
                    ? '✓ Las contraseñas coinciden'
                    : '✗ Las contraseñas no coinciden'
                  }
                </p>
              )}
            </div>

            {/* Info de rol y activación */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <span className="font-semibold">⚠️ Importante:</span> Las cuentas nuevas
                se crean <span className="font-semibold">inactivas</span> y deben ser 
                activadas por un administrador antes de poder iniciar sesión.
              </p>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Crear cuenta
                </>
              )}
            </button>
          </form>

          {/* Link al login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tenés cuenta?{' '}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Iniciá sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modal de éxito */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Cuenta creada!
            </h3>
            <p className="text-gray-600 mb-6">
              Tu cuenta fue creada correctamente. Un administrador debe activarla 
              antes de que puedas iniciar sesión. Recibirás un email cuando tu cuenta 
              sea activada.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full"
            >
              Ir al Login
            </button>
          </div>
        </div>
      )}
    </div>
  )
}