import { useState, useEffect, useRef } from 'react'
import { Layout } from '../components/Layout/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import ReactMarkdown from 'react-markdown'
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
  X
} from 'lucide-react'

export function ChatAsistentePage() {
  const { user, isAlumno } = useAuth()
  
  // Estados
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

  const [analisisProblemas, setAnalisisProblemas] = useState(null)
  const [loadingAnalisis, setLoadingAnalisis] = useState(false)
  const [mostrarAnalisis, setMostrarAnalisis] = useState(false)
  
  const messagesEndRef = useRef(null)

  // Validación de acceso
  if (!isAlumno) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <h2 className="text-xl font-bold text-yellow-900 mb-3">
              ⚠️ Acceso restringido
            </h2>
            <p className="text-yellow-700 mb-4">
              El chat asistente está disponible únicamente para alumnos.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn btn-primary"
            >
              Volver
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Cargar tesinas del alumno
  useEffect(() => {
    const fetchTesinas = async () => {
      try {
        const response = await api.get('/tesinas')
        const items = response.data.items || response.data || []
        setTesinas(items)
      } catch (err) {
        console.error('Error al cargar tesinas:', err)
      }
    }
    fetchTesinas()
  }, [])

  // Cargar conversaciones del alumno
  useEffect(() => {
    fetchConversaciones()
  }, [])

  const fetchConversaciones = async () => {
    setLoadingConversaciones(true)
    try {
      const response = await api.get('/chat/conversaciones')
      setConversaciones(response.data || [])
    } catch (err) {
      console.error('Error al cargar conversaciones:', err)
    } finally {
      setLoadingConversaciones(false)
    }
  }

  // Cargar mensajes de una conversación
  const cargarConversacion = async (conversacionId) => {
    try {
      const response = await api.get(`/chat/conversaciones/${conversacionId}/mensajes`)
      const mensajes = response.data || []
      
      setMessages(mensajes)
      
      const conv = conversaciones.find(c => c.id === conversacionId)
      setConversacionActual(conv)
      setSelectedTesina(conv?.tesina_id || null)
      
    } catch (err) {
      console.error('Error al cargar mensajes:', err)
    }
  }

  // Crear nueva conversación
  const nuevaConversacion = async () => {
    try {
      const response = await api.post('/chat/conversaciones', {
        tesina_id: selectedTesina,
        titulo: 'Nueva conversación'
      })
      
      const nuevaConv = response.data
      setConversaciones([nuevaConv, ...conversaciones])
      setConversacionActual(nuevaConv)
      setMessages([])
      
    } catch (err) {
      console.error('Error al crear conversación:', err)
    }
  }

  // Eliminar conversación
  const eliminarConversacion = async (id, e) => {
    e.stopPropagation()
    
    if (!confirm('¿Eliminar esta conversación?')) return
    
    try {
      await api.delete(`/chat/conversaciones/${id}`)
      setConversaciones(conversaciones.filter(c => c.id !== id))
      
      if (conversacionActual?.id === id) {
        setConversacionActual(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }

  // Editar título
  const iniciarEdicionTitulo = (conv, e) => {
    e.stopPropagation()
    setEditandoTitulo(conv.id)
    setNuevoTitulo(conv.titulo)
  }

  const guardarTitulo = async (id) => {
    if (!nuevoTitulo.trim()) return
    
    try {
      await api.put(`/chat/conversaciones/${id}/titulo`, {
        titulo: nuevoTitulo
      })
      
      setConversaciones(conversaciones.map(c => 
        c.id === id ? { ...c, titulo: nuevoTitulo } : c
      ))
      
      if (conversacionActual?.id === id) {
        setConversacionActual({ ...conversacionActual, titulo: nuevoTitulo })
      }
      
      setEditandoTitulo(null)
    } catch (err) {
      console.error('Error al actualizar título:', err)
    }
  }

  const cancelarEdicion = () => {
    setEditandoTitulo(null)
    setNuevoTitulo('')
  }

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Enviar mensaje
  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = {
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await api.post('/chat/asistente', {
        message: userMessage.content,
        tesina_id: selectedTesina,
        conversacion_id: conversacionActual?.id
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Si es una conversación nueva, actualizar el ID
      if (!conversacionActual && response.data.conversacion_id) {
        const nuevaConv = {
          id: response.data.conversacion_id,
          titulo: userMessage.content.substring(0, 50),
          tesina_id: selectedTesina,
          total_mensajes: 2,
          updated_at: new Date().toISOString()
        }
        setConversacionActual(nuevaConv)
        setConversaciones([nuevaConv, ...conversaciones])
      } else {
        // Actualizar contador de mensajes
        setConversaciones(conversaciones.map(c => 
          c.id === conversacionActual?.id 
            ? { ...c, total_mensajes: (c.total_mensajes || 0) + 2 }
            : c
        ))
      }

    } catch (err) {
      console.error('Error:', err)
      const errorMessage = {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intentá de nuevo.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Analizar tesina
const analizarTesina = async () => {
  if (!selectedTesina) {
    alert('Primero seleccioná una tesina para analizar')
    return
  }

  setLoadingAnalisis(true)
  setMostrarAnalisis(true)

  try {
    const response = await api.get(`/chat/analizar-tesina/${selectedTesina}`)
    setAnalisisProblemas(response.data)
  } catch (err) {
    console.error('Error al analizar:', err)
    alert('Error al analizar la tesina. Intentá de nuevo.')
    setMostrarAnalisis(false)
  } finally {
    setLoadingAnalisis(false)
  }
}

  // Sugerencias iniciales
  const sugerencias = [
    {
      icon: Lightbulb,
      text: '¿Cómo puedo mejorar la estructura de mi tesina?',
    },
    {
      icon: BookOpen,
      text: 'Ayúdame con el formato APA para las referencias',
    },
    {
      icon: FileText,
      text: 'Revisá la coherencia de mi introducción',
    },
  ]

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        
        {/* Sidebar - Historial de conversaciones */}
        <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          
          {/* Header del sidebar */}
          <div className="p-4 border-b border-gray-100 flex flex-col gap-2">
            <button
              onClick={nuevaConversacion}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva conversación
            </button>
            <button
  onClick={() => setMostrarGeneradorBiblio(true)}
  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
>
  Generar bibliografía APA
</button>
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto p-2">
            {loadingConversaciones ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : conversaciones.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Aún no tenés conversaciones
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Empezá una nueva para guardar el historial
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversaciones.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => cargarConversacion(conv.id)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      conversacionActual?.id === conv.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    {editandoTitulo === conv.id ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={nuevoTitulo}
                          onChange={e => setNuevoTitulo(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                          autoFocus
                          onKeyPress={e => e.key === 'Enter' && guardarTitulo(conv.id)}
                        />
                        <button
                          onClick={() => guardarTitulo(conv.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
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
                              onClick={e => iniciarEdicionTitulo(conv, e)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar título"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={e => eliminarConversacion(conv.id, e)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {conv.tesina_titulo && (
                          <p className="text-xs text-gray-500 mb-1">
                            📄 {conv.tesina_titulo}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{conv.total_mensajes || 0} mensajes</span>
                          <span>
  {conv.updated_at 
    ? new Date(conv.updated_at).toLocaleDateString('es-AR')
    : 'Hoy'
  }
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

        {/* Área principal del chat */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {conversacionActual?.titulo || 'Chat Asistente'}
                </h2>
                <p className="text-sm text-gray-500">
                  Asistente académico para tu tesina
                </p>
              </div>
              
{/* Selector de tesina y botón analizar */}
<div className="flex items-center gap-2">
  <select
    value={selectedTesina || ''}
    onChange={e => {
      setSelectedTesina(e.target.value ? parseInt(e.target.value) : null)
      setMostrarAnalisis(false)
      setAnalisisProblemas(null)
    }}
    className="input text-sm w-64"
    disabled={messages.length > 0}
  >
    <option value="">Sin contexto de tesina</option>
    {tesinas.map(t => (
      <option key={t.id} value={t.id}>
        {t.titulo}
      </option>
    ))}
  </select>
  
  {selectedTesina && (
    <>
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
        Con contexto
      </span>
      <button
        onClick={analizarTesina}
        disabled={loadingAnalisis}
        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
      >
        {loadingAnalisis ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analizando...
          </>
        ) : (
          <>
          Analizar mi tesina
          </>
        )}
      </button>
    </>
  )}
</div>
            </div>
          </div>

{/* Mensajes */}
<div className="flex-1 overflow-y-auto p-6 space-y-4">
  
  {/* Panel de análisis (si está activo) - AHORA DENTRO */}
  {mostrarAnalisis && analisisProblemas && (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            🔍 Análisis de tu tesina
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {analisisProblemas.estadisticas.palabras.toLocaleString()} palabras • 
            {' '}{analisisProblemas.estadisticas.paginas_estimadas} páginas estimadas • 
            {' '}{analisisProblemas.total_problemas} problemas detectados
          </p>
        </div>
        <button
          onClick={() => setMostrarAnalisis(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Resumen de gravedad */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-red-700">
            {analisisProblemas.nivel_gravedad.errores}
          </p>
          <p className="text-xs text-red-600">Errores críticos</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-yellow-700">
            {analisisProblemas.nivel_gravedad.advertencias}
          </p>
          <p className="text-xs text-yellow-600">Advertencias</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-2xl font-bold text-blue-700">
            {analisisProblemas.nivel_gravedad.informacion}
          </p>
          <p className="text-xs text-blue-600">Información</p>
        </div>
      </div>

      {/* Lista de problemas */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {analisisProblemas.problemas.length === 0 ? (
          <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 font-medium">
              ✅ ¡Excelente! No se detectaron problemas importantes.
            </p>
          </div>
        ) : (
          analisisProblemas.problemas.map((problema, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                problema.tipo === 'error'
                  ? 'bg-red-50 border-red-200'
                  : problema.tipo === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">
                  {problema.tipo === 'error' ? '❌' : problema.tipo === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      problema.tipo === 'error'
                        ? 'bg-red-100 text-red-700'
                        : problema.tipo === 'warning'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {problema.categoria}
                    </span>
                    <h4 className="font-semibold text-gray-900">
                      {problema.titulo}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {problema.descripcion}
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    💡 {problema.sugerencia}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )}

  {/* Área de mensajes/sugerencias - CONTINÚA NORMAL */}
            {messages.length === 0 && !mostrarAnalisis ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Bot className="w-16 h-16 text-indigo-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  ¡Hola, {user?.nombre}! 👋
                </h3>
                <p className="text-gray-600 mb-8 text-center max-w-md">
                  Soy tu asistente académico. Puedo ayudarte con estructura, formato APA,
                  redacción y más.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-3xl">
                  {sugerencias.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(sug.text)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                    >
                      <sug.icon className="w-5 h-5 text-indigo-600 mb-2" />
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
    className={`flex gap-3 ${
      msg.role === 'user' ? 'justify-end' : 'justify-start'
    }`}
  >
    {msg.role === 'assistant' && (
      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 text-indigo-600" />
      </div>
    )}
    
    <div
      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
        msg.role === 'user'
          ? 'bg-indigo-600 text-white'
          : 'bg-gray-100 text-gray-900'
      }`}
    >
      {msg.role === 'user' ? (
        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
      ) : (
        <div className="text-sm overflow-hidden overflow-x-auto">
          <ReactMarkdown
            components={{
              p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
              li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-indigo-900" {...props} />,
              code: ({node, ...props}) => <code className="bg-gray-200 px-1 rounded text-xs font-mono" {...props} />,
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
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-600" />
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

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribí tu pregunta..."
                className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Presioná Enter para enviar, Shift + Enter para nueva línea
            </p>
          </div>
        </div>
      </div>
            {/* Modal generador de bibliografía */}
      <GeneradorBibliografiaModal
        isOpen={mostrarGeneradorBiblio}
        onClose={() => setMostrarGeneradorBiblio(false)}
      />
    </Layout>
  )
}