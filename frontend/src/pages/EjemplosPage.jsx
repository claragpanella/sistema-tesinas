import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout/Layout'
import { Spinner } from '../components/Common/Spinner'
import { Alert } from '../components/Common/Alert'
import { EmptyState } from '../components/Common/EmptyState'
import api from '../services/api'
import { FileSearch, Download, Search, Calendar } from 'lucide-react'

export function EjemplosPage() {
  const [ejemplos, setEjemplos] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [anioDesde, setAnioDesde] = useState('')
  const [anioHasta, setAnioHasta] = useState('')

  const fetchEjemplos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('per_page', 9)
      if (search) params.append('search', search)
      if (anioDesde) params.append('anio_desde', anioDesde)
      if (anioHasta) params.append('anio_hasta', anioHasta)

      const response = await api.get(`/ejemplos?${params}`)
      setEjemplos(response.data.items)
      setPagination(response.data.pagination)
    } catch (err) {
      setError('Error al cargar los ejemplos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEjemplos()
  }, [page, anioDesde, anioHasta])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchEjemplos()
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const handleDownload = async (filename) => {
    try {
      const response = await api.get(`/uploads_ejemplos/${filename}`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al descargar el archivo')
    }
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Tesinas de Ejemplo
        </h1>
        <p className="text-gray-600 mt-1">
          Consultá trabajos finales aprobados como referencia
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex gap-2">
            <input
              type="number"
              value={anioDesde}
              onChange={(e) => { setAnioDesde(e.target.value); setPage(1) }}
              placeholder="Año desde"
              className="input w-32"
              min="2000"
              max="2099"
            />
            <input
              type="number"
              value={anioHasta}
              onChange={(e) => { setAnioHasta(e.target.value); setPage(1) }}
              placeholder="Año hasta"
              className="input w-32"
              min="2000"
              max="2099"
            />
          </div>
        </div>
      </div>

      {/* Contenido */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      {loading ? (
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      ) : ejemplos.length === 0 ? (
        <EmptyState
          title="Sin ejemplos"
          description="No hay ejemplos disponibles con los filtros aplicados"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ejemplos.map((ejemplo) => (
              <div
                key={ejemplo.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileSearch className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                      {ejemplo.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {ejemplo.nombre_estudiante}
                    </p>
                  </div>
                </div>

                {ejemplo.resumen && (
                  <p className="text-xs text-gray-600 line-clamp-3 mb-3 flex-1">
                    {ejemplo.resumen}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {ejemplo.anio}
                    {ejemplo.tutor && (
                      <span className="ml-2">· {ejemplo.tutor}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownload(ejemplo.nombre_archivo)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Descargar
                  </button>
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
                  className="btn btn-secondary flex items-center gap-1 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.has_next}
                  className="btn btn-secondary flex items-center gap-1 disabled:opacity-50"
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