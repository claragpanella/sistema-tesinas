import { Link, useNavigate } from 'react-router-dom'
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
  MessageSquare,
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
// Pasos del recorrido de una tesina y en cuál está según sus estados
function calcularProgreso(tesina) {
  const { estado_alumno, estado_tutor, numero_version } = tesina
  const version = numero_version || 1

  if (estado_tutor === 'aprobada') {
    return {
      paso: 4, resultado: 'Aprobada', tono: 'aprobada',
      mensaje: '¡Felicitaciones! Tu tutor aprobó la tesina.',
    }
  }
  if (estado_tutor === 'rechazada') {
    return {
      paso: 4, resultado: 'Correcciones pedidas', tono: 'correcciones',
      mensaje: 'Tu tutor pidió correcciones. Revisá sus observaciones y subí una nueva versión.',
    }
  }
  if (estado_alumno === 'enviada') {
    return {
      paso: 3, resultado: 'Resultado', tono: null,
      mensaje: 'Tu tutor la está revisando. Cuando la apruebe o te pida correcciones, lo vas a ver acá.',
    }
  }
  return {
    paso: 1, resultado: 'Resultado', tono: null,
    mensaje: version > 1
      ? `Subiste la versión ${version}. Cuando esté lista, enviala de nuevo a tu tutor.`
      : 'Está en borrador. Revisala con TesiBot y, cuando esté lista, enviala a tu tutor.',
  }
}

function TesinaProgreso({ tesina }) {
  const { paso, resultado, tono, mensaje } = calcularProgreso(tesina)
  const pasos = ['Borrador', 'Enviada', 'En revisión', resultado]

  const colorResultado = {
    aprobada: { punto: 'bg-green-600', texto: 'text-green-700' },
    correcciones: { punto: 'bg-amber-500', texto: 'text-amber-700' },
  }[tono]

  return (
    <Link
      to={`/tesinas/${tesina.id}`}
      className="group sm:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between gap-4"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
          <ClipboardList className="w-7 h-7" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mi tesina</p>
          <h3 className="font-semibold text-gray-900 text-lg leading-snug">{tesina.titulo}</h3>
        </div>
      </div>

      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-1.5 text-xs font-semibold">
        {pasos.map((nombre, i) => {
          const numero = i + 1
          const hecho = numero < paso || (numero === 4 && paso === 4)
          const actual = numero === paso && paso !== 4
          const esResultado = numero === 4 && colorResultado

          const punto = esResultado ? colorResultado.punto
            : hecho ? 'bg-indigo-600'
            : actual ? 'bg-white ring-2 ring-indigo-600'
            : 'bg-gray-300'
          const texto = esResultado ? colorResultado.texto
            : hecho ? 'text-indigo-800'
            : actual ? 'text-gray-900'
            : 'text-gray-400'

          return (
            <li key={numero} aria-current={actual ? 'step' : undefined} className="flex items-center gap-1.5">
              {i > 0 && <span className={`hidden sm:block w-6 h-px ${hecho || actual ? 'bg-indigo-300' : 'bg-gray-200'}`} />}
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${punto}`} />
              <span className={`whitespace-nowrap ${texto}`}>{nombre}</span>
            </li>
          )
        })}
      </ol>

      <p className="text-[13px] text-gray-600">{mensaje}</p>
    </Link>
  )
}

function AlumnoDashboard({ user }) {
  const [tesina, setTesina] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkTesina = async () => {
      try {
        const response = await api.get('/tesinas?per_page=1')
        const items = response.data.items || []
        setTesina(items[0] ?? null)
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
            ¡Bienvenido, {user?.nombre}!
          </h2>
          <p className="text-gray-600 mt-1">
            Cargando...
          </p>
        </div>
      </>
    )
  }

  const menuItems = [
    ...(!tesina ? [{
      icon: Upload,
      title: 'Subir Tesina',
      subtitle: 'Cargar tu proyecto final',
      path: '/tesinas/subir',
      color: 'indigo',
    }] : []),
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
  ]

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          ¡Bienvenido, {user?.nombre}!
        </h2>
        <p className="text-gray-600 mt-1">
          ¿Qué querés hacer hoy?
        </p>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${tesina ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {/* Con tesina cargada, "Mi tesina" muestra su estado y ocupa dos lugares */}
        {tesina && <TesinaProgreso tesina={tesina} />}
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
      icon: MessageSquare,
      title: 'Chat Asistente',
      subtitle: 'Revisar tesinas con IA',
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


  ]

  return (
    <>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          ¡Bienvenido, {user?.nombre}!
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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