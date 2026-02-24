import { useState, useEffect, useRef } from 'react'
import { Layout } from '../components/Layout/Layout'
import { Alert } from '../components/Common/Alert'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import ReactMarkdown from 'react-markdown' // Librería para procesar el formato
import {
  Send,
  Bot,
  User,
  Loader2,
  FileText,
  Lightbulb,
  BookOpen
} from 'lucide-react'

export function ChatAsistentePage() {
  const { user, isAlumno } = useAuth() 
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTesina, setSelectedTesina] = useState(null)
  const [tesinas, setTesinas] = useState([])
  const messagesEndRef = useRef(null)

  // Protección de ruta
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

  // Cargar tesinas del usuario
  useEffect(() => {
    const fetchTesinas = async () => {
      try {
        const response = await api.get('/tesinas?per_page=100')
        const items = response.data.items || response.data || []
        setTesinas(items)
      } catch (err) {
        console.error('Error al cargar tesinas:', err)
      }
    }
    fetchTesinas()
  }, [])

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/chat/asistente', {
        message: input,
        tesina_id: selectedTesina?.id
      })

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      setError(err.response?.data?.error || 'Error al comunicarse con el asistente')
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

  const sugerencias = [
    {
      icon: Lightbulb,
      text: '¿Cómo puedo mejorar la estructura de mi tesina?',
      color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
    },
    {
      icon: BookOpen,
      text: 'Ayúdame con el formato APA para las referencias',
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100'
    },
    {
      icon: FileText,
      text: 'Revisá la coherencia de mi introducción',
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100'
    },
  ]

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chat Asistente</h1>
          <p className="text-gray-600 mt-1">Recibí ayuda personalizada con tu tesina</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Contexto</h3>
              {tesinas.length > 0 ? (
                <>
                  <label className="block text-xs text-gray-500 mb-2">Seleccionar tesina:</label>
                  <select
                    value={selectedTesina?.id || ''}
                    onChange={(e) => {
                      const tesina = tesinas.find(t => t.id === parseInt(e.target.value))
                      setSelectedTesina(tesina)
                    }}
                    className="input text-sm w-full"
                  >
                    <option value="">Sin contexto</option>
                    {tesinas.map(t => (
                      <option key={t.id} value={t.id}>{t.titulo}</option>
                    ))}
                  </select>
                  {selectedTesina && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-indigo-700 font-medium">
                        ✓ El asistente está analizando "{selectedTesina.titulo}"
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">Aún no tenés tesinas cargadas.</p>
              )}
            </div>
          </div>

          {/* Chat Container */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
              
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Hola, {user?.nombre}!</h3>
                    <p className="text-gray-600 mb-6">Soy tu asistente académico. ¿En qué puedo ayudarte?</p>
                    <div className="max-w-md mx-auto space-y-2">
                      {sugerencias.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(sug.text)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm transition-colors ${sug.color}`}
                        >
                          <sug.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{sug.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-indigo-600" />
                          </div>
                        )}

                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                          msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}>
                          {msg.role === 'user' ? (
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            /* Renderizado de Markdown para el Asistente */
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
                      <div className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="bg-gray-100 rounded-2xl px-5 py-3 flex items-center">
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
                <div className="flex gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none py-2"
                    rows={2}
                    disabled={loading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="self-end bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  El asistente puede cometer errores. Verifica la información importante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}