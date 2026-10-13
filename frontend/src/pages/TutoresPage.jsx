import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout/Layout'
import { Spinner } from '../components/Common/Spinner'
import { Alert } from '../components/Common/Alert'
import { EmptyState } from '../components/Common/EmptyState'
import api from '../services/api'
import { UserRound, Mail, FileSearch, Search } from 'lucide-react'

/**
 * Tutores disponibles para el alumno: con quién puede hacer su tesina, cómo
 * contactarlo, cuántas tesinas acompaña hoy y qué trabajos dirigió antes
 * (sale del repositorio de ejemplos, así se ve sobre qué temas trabajó).
 */
export function TutoresPage() {
  const [tutores, setTutores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    api.get('/tutores')
      .then((r) => setTutores(r.data))
      .catch(() => setError('No se pudieron cargar los tutores. Probá de nuevo en unos minutos.'))
      .finally(() => setLoading(false))
  }, [])

  // Filtra por nombre del tutor o por título de los trabajos que dirigió
  const texto = busqueda.trim().toLowerCase()
  const visibles = texto
    ? tutores.filter((t) =>
        t.nombre.toLowerCase().includes(texto) ||
        t.ejemplos_dirigidos.some((e) => e.titulo.toLowerCase().includes(texto)))
    : tutores

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tutores disponibles</h1>
        <p className="text-gray-600 mt-1">
          Conocé a los tutores antes de elegir con quién hacer tu tesina. Los trabajos que dirigieron te dan una idea de los temas en los que trabajan.
        </p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {!loading && tutores.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="buscar-tutor"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o por tema de los trabajos que dirigió..."
              className="input pl-9"
              aria-label="Buscar tutores"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-12"><Spinner size="lg" /></div>
      ) : visibles.length === 0 ? (
        <EmptyState
          title={tutores.length === 0 ? 'Todavía no hay tutores disponibles' : 'Sin resultados'}
          description={tutores.length === 0
            ? 'Cuando la facultad habilite tutores, los vas a ver acá.'
            : 'Ningún tutor coincide con la búsqueda.'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibles.map((tutor) => (
            <article key={tutor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserRound className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 leading-tight">{tutor.nombre}</h2>
                  <a href={`mailto:${tutor.email}`} className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 break-all">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    {tutor.email}
                  </a>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                {tutor.tesinas_en_curso === 0
                  ? 'No acompaña tesinas en este momento.'
                  : `Acompaña ${tutor.tesinas_en_curso} ${tutor.tesinas_en_curso === 1 ? 'tesina' : 'tesinas'} en curso.`}
              </p>

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Trabajos que dirigió</p>
                {tutor.ejemplos_dirigidos.length === 0 ? (
                  <p className="text-sm text-gray-500">Todavía no hay trabajos suyos en el repositorio de ejemplos.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {tutor.ejemplos_dirigidos.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <FileSearch className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                        <span>{e.titulo} <span className="text-gray-400">· {e.anio}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 mt-8">
        ¿Querés leer esos trabajos? Están completos en <Link to="/ejemplos" className="text-indigo-600 hover:text-indigo-700 font-medium">Ejemplos</Link>.
      </p>
    </Layout>
  )
}
