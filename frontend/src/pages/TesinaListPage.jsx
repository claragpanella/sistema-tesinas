import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout/Layout'
import { Spinner } from '../components/Common/Spinner'
import { Alert } from '../components/Common/Alert'
import { EmptyState } from '../components/Common/EmptyState'
import { Badge } from '../components/Common/Badge'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  FileText,
  Eye,
  Search,
  Upload,
  Trash2,
  Loader2
} from 'lucide-react'

export function TesinaListPage() {
  const navigate = useNavigate()
  const { isAlumno, isAdmin, isTutor } = useAuth()

  const [tesinas, setTesinas] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (id, titulo) => {
  if (!confirm(`⚠️ ¿Estás seguro de ELIMINAR permanentemente la tesina "${titulo}"?\n\nEsta acción:\n• Eliminará la tesina y todas sus versiones\n• Eliminará todos los archivos asociados\n• NO se puede deshacer\n\n¿Continuar?`)) {
    return
  }

  setDeletingId(id)
  try {
    await api.delete(`/tesinas/${id}`)
    setSuccess('Tesina eliminada permanentemente')
    fetchTesinas()
    setTimeout(() => setSuccess(''), 3000)
  } catch (err) {
    setError(err.response?.data?.error || 'Error al eliminar la tesina')
  } finally {
    setDeletingId(null)
  }
}

  const fetchTesinas = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('per_page', 10)
      if (search) params.append('search', search)
      if (estado) params.append('estado', estado)

      const response = await api.get(`/tesinas?${params}`)

      const items = response.data.items || response.data || []
      
      // ← LÓGICA PARA ALUMNOS
      if (isAlumno) {
        if (items.length === 1) {
          // Si tiene una tesina, redirigir al detalle
          navigate(`/tesinas/${items[0].id}`, { replace: true })
          return
        } else if (items.length === 0) {
          // Si no tiene tesina, mostrar mensaje
          setTesinas([])
          setPagination(null)
        }
      } else {
        // Admin/Tutor: mostrar lista normal
        setTesinas(items)
        setPagination(response.data.pagination || null)
      }

    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar las tesinas')
      setTesinas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTesinas()
  }, [page, estado])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchTesinas()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const handleEstadoChange = (e) => {
    setEstado(e.target.value)
    setPage(1)
  }

  // ← VISTA ESPECIAL PARA ALUMNO SIN TESINA
  if (isAlumno && !loading && tesinas.length === 0) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <EmptyState
            title="Aún no subiste tu tesina"
            description="Para comenzar, subí tu trabajo final y será asignado a un tutor para su revisión."
            action={
              <button
                onClick={() => navigate('/tesinas/subir')}
                className="btn btn-primary flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Subir mi tesina
              </button>
            }
          />
        </div>
      </Layout>
    )
  }

  // ← VISTA PARA ADMIN/TUTOR (listado completo)
  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isAdmin ? 'Todas las Tesinas' : 'Tesinas Asignadas'}
        </h1>
        <p className="text-gray-600 mt-1">
          {pagination
            ? `${pagination.total_items} tesinas en total`
            : `${tesinas.length} tesinas`
          }
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError('')} />
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
              placeholder="Buscar por título, alumno o tutor..."
              className="input pl-9"
            />
          </div>

          {/* Filtro estado */}
          <select
            value={estado}
            onChange={handleEstadoChange}
            className="input sm:w-48"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      ) : tesinas.length === 0 ? (
        <EmptyState
          title="Sin tesinas"
          description="No hay tesinas con los filtros aplicados"
        />
      ) : (
        <>
          {/* Lista de tesinas */}
<div className="space-y-4">
  {tesinas.map((tesina) => (
    <div
      key={tesina.id}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">

            {/* Título y estado */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {tesina.titulo || 'Sin título'}
              </h3>
              <Badge text={tesina.estado} />
            </div>

            {/* Alumno y tutor */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {tesina.alumno_nombre && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-4 h-4 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold" style={{fontSize: '8px'}}>
                    A
                  </span>
                  {tesina.alumno_nombre}
                </span>
              )}
              {tesina.tutor_nombre && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold" style={{fontSize: '8px'}}>
                    T
                  </span>
                  {tesina.tutor_nombre}
                </span>
              )}
            </div>

            {/* Resumen */}
            {tesina.resumen && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {tesina.resumen}
              </p>
            )}

            {/* Observaciones */}
            {tesina.observaciones && (
              <p className="text-xs text-gray-500 mt-1 italic">
                Observación: {tesina.observaciones}
              </p>
            )}
          </div>
        </div>

{/* Botones de acción */}
<div className="flex items-center gap-3">
  <button
    onClick={() => navigate(`/tesinas/${tesina.id}`)}
    className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
  >
    <Eye className="w-4 h-4" />
    Ver detalle
  </button>
  
  {/* Separador + Botón eliminar (solo admin) */}
  {isAdmin && (
    <>
      <div className="w-px h-6 bg-gray-200"></div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleDelete(tesina.id, tesina.titulo)
        }}
        disabled={deletingId === tesina.id}
        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
        title="Eliminar tesina"
      >
        {deletingId === tesina.id ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </>
  )}
</div>
      </div>
    </div>
  ))}
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
    </Layout>
  )
}