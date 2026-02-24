import { useState, useEffect } from 'react'
import { Layout } from '../../components/Layout/Layout'
import { Spinner } from '../../components/Common/Spinner'
import { Alert } from '../../components/Common/Alert'
import { EmptyState } from '../../components/Common/EmptyState'
import api from '../../services/api'
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FolderPlus
} from 'lucide-react'

// =========================
// Modal Categoría
// =========================
function CategoriaModal({ categoria, onClose, onSaved }) {
  const isEditing = !!categoria

  const [form, setForm] = useState({
    nombre: categoria?.nombre || '',
    orden: categoria?.orden || 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEditing) {
        await api.put(`/pautas/categorias/${categoria.id}`, form)
      } else {
        await api.post('/pautas/categorias', form)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la categoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="input"
              placeholder="Ej: Formato del documento"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Orden
            </label>
            <input
              type="number"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) })}
              className="input"
              min="0"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Número para ordenar las categorías (menor = primero)
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEditing ? 'Guardar cambios' : 'Crear categoría'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =========================
// Modal Pauta
// =========================
function PautaModal({ pauta, categoriaId, categorias, onClose, onSaved }) {
  const isEditing = !!pauta

  const [form, setForm] = useState({
    titulo: pauta?.titulo || '',
    descripcion: pauta?.descripcion || '',
    categoria_id: pauta?.categoria_id || categoriaId || '',
    enlace_externo: pauta?.enlace_externo || '',
    orden: pauta?.orden || 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isEditing) {
        await api.put(`/pautas/${pauta.id}`, form)
      } else {
        await api.post('/pautas/', form)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la pauta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Pauta' : 'Nueva Pauta'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <Alert type="error" message={error} onClose={() => setError('')} />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              value={form.categoria_id}
              onChange={(e) => setForm({ ...form, categoria_id: parseInt(e.target.value) })}
              className="input"
              required
              disabled={loading}
            >
              <option value="">Seleccionar categoría...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="input"
              placeholder="Ej: Márgenes del documento"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={4}
              className="input resize-none"
              placeholder="Descripción detallada de la pauta..."
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enlace externo
            </label>
            <input
              type="url"
              value={form.enlace_externo}
              onChange={(e) => setForm({ ...form, enlace_externo: e.target.value })}
              className="input"
              placeholder="https://..."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Orden
            </label>
            <input
              type="number"
              value={form.orden}
              onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value) })}
              className="input"
              min="0"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                isEditing ? 'Guardar cambios' : 'Crear pauta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// =========================
// Card de categoría con sus pautas
// =========================
function CategoriaCard({
  categoria,
  onEditCategoria,
  onDeleteCategoria,
  onNewPauta,
  onEditPauta,
  onDeletePauta,
}) {
  const [expanded, setExpanded] = useState(true)
  const [deletingPautaId, setDeletingPautaId] = useState(null)

  const handleDeletePauta = async (pautaId) => {
    if (!confirm('¿Estás seguro de eliminar esta pauta?')) return
    setDeletingPautaId(pautaId)
    await onDeletePauta(pautaId)
    setDeletingPautaId(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

      {/* Header categoría */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{categoria.nombre}</h3>
            <p className="text-xs text-gray-500">
              {categoria.pautas.length} pauta{categoria.pautas.length !== 1 ? 's' : ''}
              · orden: {categoria.orden}
            </p>
          </div>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400 ml-2" />
            : <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
          }
        </button>

        {/* Acciones categoría */}
        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={() => onNewPauta(categoria.id)}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Nueva pauta en esta categoría"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditCategoria(categoria)}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Editar categoría"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteCategoria(categoria.id)}
            disabled={categoria.pautas.length > 0}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={
              categoria.pautas.length > 0
                ? 'No se puede eliminar: tiene pautas asociadas'
                : 'Eliminar categoría'
            }
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pautas */}
      {expanded && (
        <div className="divide-y divide-gray-50">
          {categoria.pautas.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">
                Sin pautas en esta categoría
              </p>
              <button
                onClick={() => onNewPauta(categoria.id)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Agregar primera pauta
              </button>
            </div>
          ) : (
            categoria.pautas.map((pauta) => (
              <div
                key={pauta.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {pauta.titulo}
                      </h4>
                      <span className="text-xs text-gray-400">
                        #{pauta.orden}
                      </span>
                      {pauta.enlace_externo && (
                        <a
                          href={pauta.enlace_externo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Link
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {pauta.descripcion}
                    </p>
                  </div>

                  {/* Acciones pauta */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onEditPauta(pauta)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar pauta"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeletePauta(pauta.id)}
                      disabled={deletingPautaId === pauta.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar pauta"
                    >
                      {deletingPautaId === pauta.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Trash2 className="w-3 h-3" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// =========================
// Página principal
// =========================
export function AdminPautasPage() {
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modales
  const [showCategoriaModal, setShowCategoriaModal] = useState(false)
  const [showPautaModal, setShowPautaModal] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState(null)
  const [selectedPauta, setSelectedPauta] = useState(null)
  const [selectedCategoriaId, setSelectedCategoriaId] = useState(null)

  const fetchPautas = async () => {
    setLoading(true)
    try {
      const response = await api.get('/pautas/')
      setCategorias(response.data || [])
    } catch (err) {
      setError('Error al cargar las pautas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPautas()
  }, [])

  const showSuccess = (msg) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  // Handlers categorías
  const handleNewCategoria = () => {
    setSelectedCategoria(null)
    setShowCategoriaModal(true)
  }

  const handleEditCategoria = (categoria) => {
    setSelectedCategoria(categoria)
    setShowCategoriaModal(true)
  }

  const handleDeleteCategoria = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return
    try {
      await api.delete(`/pautas/categorias/${id}`)
      showSuccess('Categoría eliminada correctamente')
      fetchPautas()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la categoría')
    }
  }

  const handleCategoriaSaved = () => {
    setShowCategoriaModal(false)
    showSuccess(
      selectedCategoria
        ? 'Categoría actualizada correctamente'
        : 'Categoría creada correctamente'
    )
    setSelectedCategoria(null)
    fetchPautas()
  }

  // Handlers pautas
  const handleNewPauta = (categoriaId = null) => {
    setSelectedPauta(null)
    setSelectedCategoriaId(categoriaId)
    setShowPautaModal(true)
  }

  const handleEditPauta = (pauta) => {
    setSelectedPauta(pauta)
    setSelectedCategoriaId(pauta.categoria_id)
    setShowPautaModal(true)
  }

  const handleDeletePauta = async (id) => {
    try {
      await api.delete(`/pautas/${id}`)
      showSuccess('Pauta eliminada correctamente')
      fetchPautas()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la pauta')
    }
  }

  const handlePautaSaved = () => {
    setShowPautaModal(false)
    showSuccess(
      selectedPauta
        ? 'Pauta actualizada correctamente'
        : 'Pauta creada correctamente'
    )
    setSelectedPauta(null)
    setSelectedCategoriaId(null)
    fetchPautas()
  }

  // Lista plana de categorías para el selector del modal
  const categoriasList = categorias.map(c => ({ id: c.id, nombre: c.nombre }))

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Pautas
          </h1>
          <p className="text-gray-600 mt-1">
            {categorias.length} categorías ·{' '}
            {categorias.reduce((acc, c) => acc + c.pautas.length, 0)} pautas en total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNewPauta()}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva pauta
          </button>
          <button
            onClick={handleNewCategoria}
            className="btn btn-primary flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            Nueva categoría
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} onClose={() => setError('')} />
        </div>
      )}
      {success && (
        <div className="mb-4">
          <Alert type="success" message={success} onClose={() => setSuccess('')} />
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="py-12">
          <Spinner size="lg" />
        </div>
      ) : categorias.length === 0 ? (
        <EmptyState
          title="Sin categorías"
          description="Creá una categoría para empezar a agregar pautas"
          action={
            <button
              onClick={handleNewCategoria}
              className="btn btn-primary flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              Crear primera categoría
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {categorias.map((categoria) => (
            <CategoriaCard
              key={categoria.id}
              categoria={categoria}
              onEditCategoria={handleEditCategoria}
              onDeleteCategoria={handleDeleteCategoria}
              onNewPauta={handleNewPauta}
              onEditPauta={handleEditPauta}
              onDeletePauta={handleDeletePauta}
            />
          ))}
        </div>
      )}

      {/* Modal categoría */}
      {showCategoriaModal && (
        <CategoriaModal
          categoria={selectedCategoria}
          onClose={() => {
            setShowCategoriaModal(false)
            setSelectedCategoria(null)
          }}
          onSaved={handleCategoriaSaved}
        />
      )}

      {/* Modal pauta */}
      {showPautaModal && (
        <PautaModal
          pauta={selectedPauta}
          categoriaId={selectedCategoriaId}
          categorias={categoriasList}
          onClose={() => {
            setShowPautaModal(false)
            setSelectedPauta(null)
            setSelectedCategoriaId(null)
          }}
          onSaved={handlePautaSaved}
        />
      )}
    </Layout>
  )
}