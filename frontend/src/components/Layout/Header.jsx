import { useAuth } from '../../context/AuthContext'
import { LogOut, User, BookOpen } from 'lucide-react'
import { Badge } from '../Common/Badge'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-indigo-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">
                Repositorio Inteligente
              </h1>
              <p className="text-xs text-indigo-300 hidden sm:block">
                Lic. en Sistemas de Información
              </p>
            </div>
          </div>

          {/* Usuario y logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-indigo-800 px-3 py-2 rounded-lg">
              <User className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-medium">{user?.nombre}</span>
              <Badge text={user?.rol} />
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  )
}