import { useState, useEffect } from 'react'
import { Layout } from '../components/Layout/Layout'
import { Spinner } from '../components/Common/Spinner'
import { Alert } from '../components/Common/Alert'
import { EmptyState } from '../components/Common/EmptyState'
import api from '../services/api'
import { BookOpen, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

function CategoriaCard({ categoria }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header de categoría */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {categoria.nombre}
          </h3>
          <span className="text-sm text-gray-500">
            ({categoria.pautas.length} pautas)
          </span>
        </div>
        {expanded
          ? <ChevronUp className="w-5 h-5 text-gray-400" />
          : <ChevronDown className="w-5 h-5 text-gray-400" />
        }
      </button>

      {/* Pautas de la categoría */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {categoria.pautas.length === 0 ? (
            <p className="text-sm text-gray-500 p-5">
              Sin pautas en esta categoría.
            </p>
          ) : (
            categoria.pautas.map((pauta) => (
              <div key={pauta.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {pauta.titulo}
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                      {pauta.descripcion}
                    </p>
                  </div>
                  {pauta.enlace_externo && (
                    <a
                      href={pauta.enlace_externo}
                      
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 whitespace-nowrap mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Ver más
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function PautasPage() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPautas = async () => {
      try {
        const response = await api.get('/pautas/')
        setCategorias(response.data)
      } catch (err) {
        setError('Error al cargar las pautas')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPautas()
  }, [])

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Pautas Obligatorias
        </h1>
        <p className="text-gray-600 mt-1">
          Normas y requisitos para la presentación de tesinas
        </p>
      </div>

      {/* Contenido */}
      {loading && (
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {!loading && !error && categorias.length === 0 && (
        <EmptyState
          title="Sin pautas"
          description="No hay pautas cargadas en el sistema"
        />
      )}

      {!loading && !error && categorias.length > 0 && (
        <div className="space-y-4">
          {categorias.map((categoria) => (
            <CategoriaCard key={categoria.id} categoria={categoria} />
          ))}
        </div>
      )}
    </Layout>
  )
}