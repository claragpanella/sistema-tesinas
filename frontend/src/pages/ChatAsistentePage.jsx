import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Layout } from '../components/Layout/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSearchParams } from 'react-router-dom'
import { GeneradorBibliografiaModal } from '../components/Chat/GeneradorBibliografiaModal'
import {
  Send,
  Bot,
  User,
  Lightbulb,
  BookOpen,
  FileText,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  ClipboardList,
  MessageCircle,
  Search,
  AlertTriangle,
} from 'lucide-react'

// ─── Constantes de configuración por rol ────────────────────────────────────
const ROL_CONFIG = {
  alumno: (nombre) => ({
    colorPrimary: 'indigo',
    badge: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Modo alumno' },
    subtitulo: 'Asistente académico para tu tesina',
    bienvenida: `¡Hola, ${nombre}! 👋`,
    descripcion: 'Soy TesiBot, tu asistente académico. Puedo ayudarte a escribir y mejorar tu tesina.',
    placeholder: 'Escribí tu pregunta...',
    botonAnalizar: 'Analizar mi tesina',
    sugerencias: [
      { icon: Lightbulb, text: '¿Cómo puedo mejorar la estructura de mi tesina?' },
      { icon: BookOpen,  text: 'Ayúdame con el formato APA para las referencias' },
      { icon: FileText,  text: 'Revisá la coherencia de mi introducción' },
    ],
    selectorLabel: 'Sin contexto de tesina',
    mensajeContexto: 'Con contexto',
  }),
  tutor: (nombre) => ({
    colorPrimary: 'purple',
    badge: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Modo tutor' },
    subtitulo: 'Asistente de revisión de tesinas',
    bienvenida: `¡Hola, ${nombre}! 👋`,
    descripcion: 'Soy TesiBot, tu asistente de revisión. Puedo ayudarte a evaluar tesinas y redactar devoluciones.',
    placeholder: 'Consultá sobre la tesina...',
    botonAnalizar: 'Analizar tesina',
    sugerencias: [
      { icon: Search,        text: '¿Qué problemas metodológicos tiene esta tesina?' },
      { icon: ClipboardList, text: 'Ayúdame a redactar una devolución constructiva' },
      { icon: MessageCircle, text: '¿Está bien justificado el marco teórico?' },
    ],
    selectorLabel: 'Seleccioná una tesina',
    mensajeContexto: 'Tesina cargada',
  }),
}

// ─── Clases CSS derivadas del color primario ─────────────────────────────────
const buildColorClasses = (primary) => ({
  btnPrimary:      primary === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50' : 'bg-purple-600 hover:bg-purple-700 disabled:opacity-50',
  ring:            primary === 'indigo' ? 'focus:ring-indigo-500' : 'focus:ring-purple-500',
  selectedConv:    primary === 'indigo' ? 'bg-indigo-50 border-indigo-200' : 'bg-purple-50 border-purple-200',
  botIcon:         primary === 'indigo' ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600',
  userBubble:      primary === 'indigo' ? 'bg-indigo-600' : 'bg-purple-600',
  strong:          primary === 'indigo' ? 'text-indigo-900' : 'text-purple-900',
  suggestionHover: primary === 'indigo' ? 'hover:border-indigo-300 hover:bg-indigo-50' : 'hover:border-purple-300 hover:bg-purple-50',
  suggestionIcon:  primary === 'indigo' ? 'text-indigo-600' : 'text-purple-600',
  contextBadge:    primary === 'indigo' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700',
})

// ─── Componente de confirmación inline (reemplaza confirm()) ─────────────────
function ConfirmDeleteButton({ onConfirm }) {
  const [pending, setPending] = useState(false)

  if (pending) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={(e) => { e.stopPropagation(); onConfirm() }}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Confirmar"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setPending(false) }}
          className="p-1 text-gray-400 hover:bg-gray-100 rounded"
          title="Cancelar"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={(e) => { e.stopPropagation(); setPending(true) }}
      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
      title="Eliminar"
    >
      <Trash2 className="w-3 h-3" />
    </button>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ChatAsistentePage() {
  const { user, isAlumno, isTutor } = useAuth()

  const [conversaciones, setConversaciones] = useState([])
  const [conversacionActual, setConversacionActual] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConversaciones, setLoadingConversaciones] = useState(true)
  const [selectedTesina, setSelectedTesina] = useState(null)
  const [tesinas, setTesinas] = useState([])
  const [editandoTitulo, setEditandoTitulo] = useState(null)
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [mostrarGeneradorBiblio, setMostrarGeneradorBiblio] = useState(false)
  const [searchParams] = useSearchParams()

  const messagesEndRef = useRef(null)
  const pendingAutoAnalisis = useRef(false)
  const hasAccess = isAlumno || isTutor

  // ─── Configuración memoizada ──────────────────────────────────────────────
  const rolConfig = useMemo(
    () => hasAccess
      ? (isAlumno ? ROL_CONFIG.alumno : ROL_CONFIG.tutor)(user?.nombre)
      : null,
    [isAlumno, hasAccess, user?.nombre]
  )

  const colorClasses = useMemo(
    () => rolConfig ? buildColorClasses(rolConfig.colorPrimary) : null,
    [rolConfig]
  )

  // ─── Carga de tesinas ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasAccess) return
    const fetchTesinas = async () => {
      try {
        const response = await api.get('/tesinas')
        const items = response.data.items || response.data || []
        setTesinas(items)

        const tesinaParam = searchParams.get('tesina')
        if (tesinaParam) {
          const tesinaId = parseInt(tesinaParam, 10)
          const tesina = items.find((t) => t.id === tesinaId)
          if (tesina) {
            setSelectedTesina(tesinaId)
            // Si viene con ?autoanalizar=1, marcar para disparar análisis una vez que selectedTesina esté listo
            if (searchParams.get('autoanalizar') === '1') {
              pendingAutoAnalisis.current = true
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar tesinas:', err)
      }
    }
    fetchTesinas()
  }, [hasAccess, searchParams])

  // ─── Conversaciones ───────────────────────────────────────────────────────
  const fetchConversaciones = useCallback(async () => {
    setLoadingConversaciones(true)
    try {
      const response = await api.get('/chat/conversaciones')
      setConversaciones(response.data || [])
    } catch (err) {
      console.error('Error al cargar conversaciones:', err)
    } finally {
      setLoadingConversaciones(false)
    }
  }, [])

  useEffect(() => {
    if (!hasAccess) return
    fetchConversaciones()
  }, [hasAccess, fetchConversaciones])

  const cargarConversacion = useCallback(async (conversacionId) => {
    try {
      const response = await api.get(`/chat/conversaciones/${conversacionId}/mensajes`)
      setMessages(response.data || [])
      setConversaciones((prev) => {
        const conv = prev.find((c) => c.id === conversacionId)
        setConversacionActual(conv || null)
        setSelectedTesina(conv?.tesina_id || null)
        return prev
      })
    } catch (err) {
      console.error('Error al cargar mensajes:', err)
    }
  }, [])

  const nuevaConversacion = useCallback(() => {
    setConversacionActual(null)
    setMessages([])
  }, [])

  const eliminarConversacion = useCallback(async (id) => {
    try {
      await api.delete(`/chat/conversaciones/${id}`)
      setConversaciones((prev) => prev.filter((c) => c.id !== id))
      setConversacionActual((prev) => {
        if (prev?.id === id) {
          setMessages([])
          return null
        }
        return prev
      })
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }, [])

  const iniciarEdicionTitulo = useCallback((conv, e) => {
    e.stopPropagation()
    setEditandoTitulo(conv.id)
    setNuevoTitulo(conv.titulo)
  }, [])

  const guardarTitulo = useCallback(async (id) => {
    if (!nuevoTitulo.trim()) return
    try {
      await api.put(`/chat/conversaciones/${id}/titulo`, { titulo: nuevoTitulo })
      setConversaciones((prev) =>
        prev.map((c) => (c.id === id ? { ...c, titulo: nuevoTitulo } : c))
      )
      setConversacionActual((prev) =>
        prev?.id === id ? { ...prev, titulo: nuevoTitulo } : prev
      )
      setEditandoTitulo(null)
    } catch (err) {
      console.error('Error al actualizar título:', err)
    }
  }, [nuevoTitulo])

  const cancelarEdicion = useCallback(() => {
    setEditandoTitulo(null)
    setNuevoTitulo('')
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Enviar mensaje ───────────────────────────────────────────────────────
  // sendMessage: lógica central, acepta texto y tesina_id explícitos para
  // poder ser llamada desde el autoanalizar sin depender del estado.
  const sendMessage = useCallback(async (text, tesinaIdOverride) => {
    if (!text?.trim() || loading) return

    const tesinaId = tesinaIdOverride ?? selectedTesina
    const userMessage = { role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await api.post('/chat/asistente', {
        message: userMessage.content,
        tesina_id: tesinaId,
        conversacion_id: conversacionActual?.id,
      })

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data.response },
      ])

      if (!conversacionActual && response.data.conversacion_id) {
        const nuevaConv = {
          id: response.data.conversacion_id,
          titulo: userMessage.content.substring(0, 50),
          tesina_id: tesinaId,
          total_mensajes: 2,
          updated_at: new Date().toISOString(),
        }
        setConversacionActual(nuevaConv)
        setConversaciones((prev) => [nuevaConv, ...prev])
      } else {
        setConversaciones((prev) =>
          prev.map((c) =>
            c.id === conversacionActual?.id
              ? { ...c, total_mensajes: (c.total_mensajes || 0) + 2 }
              : c
          )
        )
      }
    } catch (err) {
      console.error('Error:', err)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intentá de nuevo.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, selectedTesina, conversacionActual])

  // handleSend: wrapper que lee el input del textarea y llama a sendMessage
  const handleSend = useCallback(() => {
    if (!input.trim()) return
    sendMessage(input.trim())
    setInput('')
  }, [input, sendMessage])

  // Reemplaza el onKeyPress deprecado
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // ─── Auto-análisis vía chat (cuando viene ?autoanalizar=1) ───────────────
  useEffect(() => {
    if (!pendingAutoAnalisis.current || !selectedTesina) return
    pendingAutoAnalisis.current = false
    sendMessage(
      'Analizá mi tesina completa y decime qué problemas, errores o aspectos mejorar encontrás.',
      selectedTesina
    )
  }, [selectedTesina, sendMessage])

  // ─── Analizar tesina ──────────────────────────────────────────────────────
  const analizarTesina = useCallback(() => {
    if (!selectedTesina) return
    sendMessage(
      'Analizá mi tesina completa y decime qué problemas, errores o aspectos mejorar encontrás.',
      selectedTesina
    )
  }, [selectedTesina, sendMessage])

  // ─── Datos derivados ──────────────────────────────────────────────────────
  const tesinaSeleccionada = useMemo(
    () => tesinas.find((t) => t.id === selectedTesina),
    [tesinas, selectedTesina]
  )
  const nombreAlumnoTesina = tesinaSeleccionada?.alumno_nombre ?? null

  // ─── Acceso restringido (después de todos los hooks) ─────────────────────
  if (!hasAccess) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-yellow-900 mb-3">Acceso restringido</h2>
            <p className="text-yellow-700 mb-4">
              El chat asistente está disponible únicamente para alumnos y tutores.
            </p>
            <button onClick={() => window.history.back()} className="btn btn-primary">
              Volver
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  const cc = colorClasses

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">

          <div className="p-4 border-b border-gray-100 flex flex-col gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${rolConfig.badge.bg} mb-1`}>
              <Bot className={`w-4 h-4 ${rolConfig.badge.text}`} />
              <span className={`text-xs font-medium ${rolConfig.badge.text}`}>
                {rolConfig.badge.label}
              </span>
            </div>

            <button
              onClick={nuevaConversacion}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${cc.btnPrimary}`}
            >
              <Plus className="w-4 h-4" />
              Nueva conversación
            </button>

            {isAlumno && (
              <button
                onClick={() => setMostrarGeneradorBiblio(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Generar bibliografía APA
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingConversaciones ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aún no tenés conversaciones</p>
                <p className="text-xs text-gray-400 mt-1">Empezá una nueva para guardar el historial</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversaciones.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => cargarConversacion(conv.id)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      conversacionActual?.id === conv.id
                        ? `${cc.selectedConv} border`
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {editandoTitulo === conv.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={nuevoTitulo}
                          onChange={(e) => setNuevoTitulo(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && guardarTitulo(conv.id)}
                        />
                        <button
                          onClick={() => guardarTitulo(conv.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelarEdicion} className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                            {conv.titulo}
                          </p>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => iniciarEdicionTitulo(conv, e)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar título"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <ConfirmDeleteButton onConfirm={() => eliminarConversacion(conv.id)} />
                          </div>
                        </div>

                        {conv.tesina_titulo && (
                          <p className="text-xs text-gray-500 mb-1">📄 {conv.tesina_titulo}</p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{conv.total_mensajes || 0} mensajes</span>
                          <span>
                            {conv.updated_at
                              ? new Date(conv.updated_at).toLocaleDateString('es-AR')
                              : 'Hoy'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Área principal ───────────────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">

          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {conversacionActual?.titulo || 'Chat Asistente'}
                </h2>
                <p className="text-sm text-gray-500">{rolConfig.subtitulo}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTesina || ''}
                  onChange={(e) => {
                    setSelectedTesina(e.target.value ? parseInt(e.target.value, 10) : null)
                  }}
                  className={`input text-sm w-64 focus:outline-none focus:ring-2 ${cc.ring}`}
                  disabled={messages.length > 0}
                >
                  <option value="">{rolConfig.selectorLabel}</option>
                  {tesinas.map((t) => (
                    <option key={t.id} value={t.id}>{t.titulo}</option>
                  ))}
                </select>

                {selectedTesina && (
                  <>
                    <span className={`px-2 py-1 text-xs rounded-full ${cc.contextBadge}`}>
                      {rolConfig.mensajeContexto}
                    </span>

                    {isTutor && nombreAlumnoTesina && (
                      <span className="px-2 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs rounded-full flex items-center gap-1">
                        Tesina de <strong>{nombreAlumnoTesina}</strong>
                      </span>
                    )}

                    <button
                      onClick={analizarTesina}
                      disabled={loading}
                      className={`px-3 py-1 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors ${cc.btnPrimary}`}
                    >
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analizando...</>
                      ) : (
                        rolConfig.botonAnalizar
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Mensajes ───────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {/* Pantalla de bienvenida o mensajes */}
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${cc.botIcon}`}>
                  <Bot className="w-9 h-9" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{rolConfig.bienvenida}</h3>
                <p className="text-gray-600 mb-8 text-center max-w-md">{rolConfig.descripcion}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl">
                  {rolConfig.sugerencias.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(sug.text)}
                      className={`p-4 border border-gray-200 rounded-lg text-left transition-all ${cc.suggestionHover}`}
                    >
                      <sug.icon className={`w-5 h-5 mb-2 ${cc.suggestionIcon}`} />
                      <p className="text-sm text-gray-700">{sug.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cc.botIcon}`}>
                        <Bot className="w-5 h-5" />
                      </div>
                    )}

                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user' ? `${cc.userBubble} text-white` : 'bg-gray-100 text-gray-900'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-sm overflow-hidden overflow-x-auto">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p:      ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                              ul:     ({ node, ...props }) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
                              ol:     ({ node, ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
                              li:     ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                              strong: ({ node, ...props }) => <strong className={`font-bold ${cc.strong}`} {...props} />,
                              code:   ({ node, ...props }) => <code className="bg-gray-200 px-1 rounded text-xs font-mono" {...props} />,
                              table:  ({ node, ...props }) => (
                                <div className="overflow-x-auto mb-3">
                                  <table className="min-w-full border border-gray-200 text-xs" {...props} />
                                </div>
                              ),
                              thead:  ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
                              th:     ({ node, ...props }) => <th className="border border-gray-200 px-2 py-1 text-left font-semibold" {...props} />,
                              td:     ({ node, ...props }) => <td className="border border-gray-200 px-2 py-1 align-top" {...props} />,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cc.botIcon}`}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* ── Input ──────────────────────────────────────────────────────── */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={rolConfig.placeholder}
                className={`flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 ${cc.ring}`}
                rows={2}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`px-6 text-white rounded-lg transition-colors flex items-center gap-2 ${cc.btnPrimary}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Presioná Enter para enviar, Shift + Enter para nueva línea
            </p>
          </div>
        </div>
      </div>

      {isAlumno && (
        <GeneradorBibliografiaModal
          isOpen={mostrarGeneradorBiblio}
          onClose={() => setMostrarGeneradorBiblio(false)}
        />
      )}
    </Layout>
  )
}
