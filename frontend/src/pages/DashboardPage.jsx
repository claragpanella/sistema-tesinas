import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Layout } from '../components/Layout/Layout'
import { useState, useEffect } from 'react' 
import api from '../services/api'  
import {
  Upload,
  FileSearch,
  BookOpen,
  Users,
  Settings,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  User,
  MessageSquare
} from 'lucide-react'

function MenuCard({ icon: Icon, title, subtitle, path, color = 'indigo' }) {
  const navigate = useNavigate()

  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100',
    green:  'bg-green-50 text-green-600 group-hover:bg-green-100',
    blue:   'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    orange: 'bg-orange-50 text-orange-600 group-hover:bg-orange-100',
    red:    'bg-red-50 text-red-600 group-hover:bg-red-100',
  }

  return (
    <div
      onClick={() => navigate(path)}
      className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${colors[color]}`}>
          <Icon className="w-7 h-7" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
      </div>
    </div>
  )
}

// =========================
// Dashboard del ALUMNO
// =========================
function AlumnoDashboard({ user }) {
  const [tieneTesina, setTieneTesina] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkTesina = async () => {
      try {
        const response = await api.get('/tesinas?per_page=1')
        const items = response.data.items || []
        setTieneTesina(items.length > 0)
      } catch (err) {
        console.error('Error al verificar tesina:', err)
      } finally {
        setLoading(false)
      }
    }

    checkTesina()
  }, [])

  if (loading) {
    return (
      <>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido, {user?.nombre}! 👋
          </h2>
          <p className="text-gray-600 mt-1">
            Cargando...
          </p>
        </div>
      </>
    )
  }

  const menuItems = [
    ...(!tieneTesina ? [{
      icon: Upload,
      title: 'Subir Tesina',
      subtitle: 'Cargar tu proyecto final',
      path: '/tesinas/subir',
      color: 'indigo',
    }] : []),
    {
      icon: ClipboardList,
      title: 'Mi Tesina',
      subtitle: 'Ver estado y versiones',
      path: '/tesinas',
      color: 'blue',
    },

    {
      icon: MessageSquare,
      title: 'Chat Asistente',
      subtitle: 'Ayuda con tu tesina',
      path: '/chat',
      color: 'green',
    },
    {
      icon: BookOpen,
      title: 'Pautas',
      subtitle: 'Normas APA y estructura',
      path: '/pautas',
      color: 'green',
    },
    {
      icon: FileSearch,
      title: 'Ejemplos',
      subtitle: 'Tesinas aprobadas',
      path: '/ejemplos',
      color: 'purple',
    },
    {
      icon: User,
      title: 'Mi Perfil',
      subtitle: 'Configuración de cuenta',
      path: '/perfil',
      color: 'red',
    },
  ]

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          ¡Bienvenido, {user?.nombre}! 👋
        </h2>
        <p className="text-gray-600 mt-1">
          ¿Qué querés hacer hoy?
        </p>
        {tieneTesina && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ℹ️ Ya tenés una tesina registrada. Para enviar correcciones, 
              entrá a <span className="font-semibold">"Mis Tesinas"</span> y 
              usá el botón <span className="font-semibold">"Reenviar versión"</span>.
            </p>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item, i) => (
          <MenuCard key={i} {...item} />
        ))}
      </div>
    </>
  )
}

// =========================
// Dashboard del TUTOR
// =========================
function TutorDashboard({ user }) {
  const menuItems = [
    {
      icon: ClipboardList,
      title: 'Mis Tesinas',
      subtitle: 'Revisar trabajos asignados',
      path: '/tutor/tesinas',
      color: 'blue',
    },
    {
      icon: BookOpen,
      title: 'Pautas',
      subtitle: 'Normas APA y estructura',
      path: '/pautas',
      color: 'green',
    },
    {
      icon: FileSearch,
      title: 'Ejemplos',
      subtitle: 'Tesinas aprobadas',
      path: '/ejemplos',
      color: 'purple',
    },

    {
      icon: User,
      title: 'Mi Perfil',
      subtitle: 'Configuración de cuenta',
      path: '/perfil',
      color: 'red',
    },

  ]

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          ¡Bienvenido, {user?.nombre}! 👋
        </h2>
        <p className="text-gray-600 mt-1">
          Panel del tutor
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item, i) => (
          <MenuCard key={i} {...item} />
        ))}
      </div>
    </>
  )
}

// =========================
// Dashboard del ADMIN
// =========================
function AdminDashboard({ user }) {
  const menuItems = [
    {
      icon: Users,
      title: 'Alumnos',
      subtitle: 'Gestionar alumnos',
      path: '/admin/usuarios',
      color: 'indigo',
    },
    {
      icon: GraduationCap,
      title: 'Tutores',
      subtitle: 'Administrar tutores',
      path: '/admin/tutores',
      color: 'blue',
    },
    {
      icon: ClipboardList,
      title: 'Tesinas',
      subtitle: 'Ver todas las tesinas',
      path: '/tesinas',
      color: 'purple',
    },
    {
      icon: FileSearch,
      title: 'Ejemplos',
      subtitle: 'Gestionar ejemplos',
      path: '/admin/ejemplos',
      color: 'green',
    },
    {
      icon: BookOpen,
      title: 'Pautas',
      subtitle: 'Gestionar pautas y categorías',
      path: '/admin/pautas',
      color: 'orange',
    },
    {
      icon: ShieldCheck,
      title: 'Mi Perfil',
      subtitle: 'Configuración de cuenta',
      path: '/perfil',
      color: 'red',
    },

  ]

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Panel de Administración
            </h2>
            <p className="text-gray-600">
              Bienvenido, {user?.nombre}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, i) => (
          <MenuCard key={i} {...item} />
        ))}
      </div>
    </>
  )
}

// =========================
// Componente principal
// =========================
export function DashboardPage() {
  const { user, isAdmin, isTutor, isAlumno } = useAuth()

  return (
    <Layout>
      {isAdmin && <AdminDashboard user={user} />}
      {isTutor && <TutorDashboard user={user} />}
      {isAlumno && <AlumnoDashboard user={user} />}
    </Layout>
  )
}