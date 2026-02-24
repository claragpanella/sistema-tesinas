import { useNavigate } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Página no encontrada
        </h2>
        <p className="text-gray-500 mb-8">
          La página que buscas no existe o fue movida.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary flex items-center gap-2 mx-auto"
        >
          <Home className="w-5 h-5" />
          Volver al inicio
        </button>
      </div>
    </div>
  )
}