import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Acceso denegado
        </h2>
        <p className="text-gray-500 mb-8">
          No tenés permisos para acceder a esta página.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary mx-auto"
        >
          Volver atrás
        </button>
      </div>
    </div>
  )
}