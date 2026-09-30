import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { BookOpen, ChevronDown, LogOut, Menu, User, X } from 'lucide-react'

// Links de navegación según el rol. `extra` marca otras rutas que también
// cuentan como "esa sección" (por ejemplo, el detalle de una tesina).
const NAVEGACION = {
  alumno: [
    { to: '/dashboard', label: 'Inicio' },
    { to: '/tesinas', label: 'Mi tesina', extra: ['/tesinas/'] },
    { to: '/chat', label: 'TesiBot' },
    { to: '/pautas', label: 'Pautas' },
    { to: '/ejemplos', label: 'Ejemplos' },
  ],
  tutor: [
    { to: '/tutor/dashboard', label: 'Inicio' },
    { to: '/tutor/tesinas', label: 'Tesinas asignadas', extra: ['/tesinas/'] },
    { to: '/chat', label: 'TesiBot' },
    { to: '/pautas', label: 'Pautas' },
    { to: '/ejemplos', label: 'Ejemplos' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Inicio' },
    { to: '/tesinas', label: 'Tesinas', extra: ['/tesinas/'] },
    { to: '/admin/usuarios', label: 'Alumnos' },
    { to: '/admin/tutores', label: 'Tutores' },
    { to: '/admin/pautas', label: 'Pautas' },
    { to: '/admin/ejemplos', label: 'Ejemplos' },
  ],
}

const ROLES = { alumno: 'Alumno', tutor: 'Tutor', admin: 'Administrador' }

function iniciales(nombre = '') {
  const palabras = nombre.replace(/^(Dr|Dra|Lic|Ing)\.\s*/i, '').trim().split(/\s+/)
  return palabras.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('')
}

export function Header() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  // Cada menú guarda en qué página se abrió: al navegar a otra, queda cerrado solo
  const [menuMovilEn, setMenuMovilEn] = useState(null)
  const [menuCuentaEn, setMenuCuentaEn] = useState(null)
  const menuMovilAbierto = menuMovilEn === pathname
  const menuCuentaAbierto = menuCuentaEn === pathname
  const setMenuMovilAbierto = (abrir) => setMenuMovilEn(abrir ? pathname : null)
  const setMenuCuentaAbierto = (abrir) => setMenuCuentaEn(abrir ? pathname : null)
  const cuentaRef = useRef(null)

  const links = NAVEGACION[user?.rol] ?? []

  const estaActivo = (link) =>
    pathname === link.to || (link.extra ?? []).some((prefijo) => pathname.startsWith(prefijo))

  // El menú de cuenta se cierra con Escape o con un clic afuera
  useEffect(() => {
    if (!menuCuentaAbierto) return
    const alHacerClic = (e) => {
      if (cuentaRef.current && !cuentaRef.current.contains(e.target)) setMenuCuentaEn(null)
    }
    const alPresionarTecla = (e) => {
      if (e.key === 'Escape') setMenuCuentaEn(null)
    }
    document.addEventListener('mousedown', alHacerClic)
    document.addEventListener('keydown', alPresionarTecla)
    return () => {
      document.removeEventListener('mousedown', alHacerClic)
      document.removeEventListener('keydown', alPresionarTecla)
    }
  }, [menuCuentaAbierto])

  const claseLink = (activo) =>
    `px-3 py-2 rounded-lg text-sm transition-colors ${
      activo
        ? 'bg-white/15 text-white font-semibold'
        : 'text-indigo-200 font-medium hover:bg-white/10 hover:text-white'
    }`

  return (
    <header className="bg-indigo-900 text-white shadow-lg relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 h-16">

          {/* Logo */}
          <Link to={links[0]?.to ?? '/'} className="flex items-center gap-2.5 flex-shrink-0">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-[18px] h-[18px] text-white" />
            </span>
            <span className="text-base font-bold leading-tight">Repositorio Inteligente</span>
          </Link>

          {/* Navegación (escritorio) */}
          <nav aria-label="Principal" className="hidden lg:flex items-center gap-1 flex-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={() => claseLink(estaActivo(link))}
                aria-current={estaActivo(link) ? 'page' : undefined}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Menú de cuenta (escritorio) */}
          <div ref={cuentaRef} className="hidden lg:block relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuCuentaAbierto(!menuCuentaAbierto)}
              aria-expanded={menuCuentaAbierto}
              aria-haspopup="menu"
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition-colors text-sm"
            >
              <span className="w-8 h-8 rounded-full bg-indigo-400 text-indigo-950 flex items-center justify-center text-xs font-bold">
                {iniciales(user?.nombre)}
              </span>
              <span className="font-medium">{user?.nombre}</span>
              <ChevronDown className="w-4 h-4 text-indigo-200" />
            </button>

            {menuCuentaAbierto && (
              <div role="menu" className="absolute right-0 mt-2 w-60 bg-white text-gray-700 rounded-xl shadow-xl border border-gray-100 py-1.5">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre}</p>
                  <p className="text-xs text-gray-500">{ROLES[user?.rol]}</p>
                </div>
                <Link role="menuitem" to="/perfil" className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50">
                  <User className="w-4 h-4 text-gray-500" /> Mi perfil
                </Link>
                <button role="menuitem" type="button" onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>

          {/* Botón de menú (celular y tablet) */}
          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            aria-expanded={menuMovilAbierto}
            aria-controls="menu-movil"
            aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
            className="lg:hidden ml-auto w-11 h-11 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center"
          >
            {menuMovilAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menú desplegable (celular y tablet) */}
      {menuMovilAbierto && (
        <>
          <div className="lg:hidden fixed inset-0 top-16 bg-gray-900/40" onClick={() => setMenuMovilAbierto(false)} />
          <nav id="menu-movil" aria-label="Principal" className="lg:hidden absolute left-0 right-0 top-16 bg-indigo-900 rounded-b-2xl shadow-xl px-3 pt-2 pb-4">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to}
                aria-current={estaActivo(link) ? 'page' : undefined}
                className={`flex items-center min-h-[48px] px-3.5 rounded-lg text-base ${
                  estaActivo(link) ? 'bg-white/15 text-white font-semibold' : 'text-indigo-100'
                }`}>
                {link.label}
              </NavLink>
            ))}
            <div className="my-2.5 mx-1 h-px bg-white/15" />
            <div className="flex items-center gap-3 px-2.5 py-2">
              <span className="w-9 h-9 rounded-full bg-indigo-400 text-indigo-950 flex items-center justify-center text-sm font-bold">
                {iniciales(user?.nombre)}
              </span>
              <span>
                <span className="block text-[15px] font-semibold">{user?.nombre}</span>
                <span className="block text-[13px] text-indigo-200">{ROLES[user?.rol]}</span>
              </span>
            </div>
            <Link to="/perfil" className="flex items-center min-h-[48px] px-3.5 rounded-lg text-base text-indigo-100">
              Mi perfil
            </Link>
            <button type="button" onClick={logout}
              className="w-full flex items-center gap-2.5 min-h-[48px] px-3.5 rounded-lg text-base text-red-200 text-left">
              <LogOut className="w-[18px] h-[18px]" /> Cerrar sesión
            </button>
          </nav>
        </>
      )}
    </header>
  )
}
