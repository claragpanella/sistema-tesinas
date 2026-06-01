import { useState } from 'react'
import { X, Plus, Copy, Check, Book, FileText, Globe, GraduationCap, Sparkles, Trash2, AlertCircle } from 'lucide-react'
import api from '../../services/api'

export function GeneradorBibliografiaModal({ isOpen, onClose}) {
  const [tipo, setTipo] = useState('libro')
  const [referencias, setReferencias] = useState([])
  const [copiado, setCopiado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Estados para formulario de libro
  const [formLibro, setFormLibro] = useState({
    autores: '',
    anio: '',
    titulo: '',
    editorial: '',
    edicion: ''
  })

  // Estados para formulario de artículo
  const [formArticulo, setFormArticulo] = useState({
    autores: '',
    anio: '',
    titulo: '',
    revista: '',
    volumen: '',
    numero: '',
    paginas: ''
  })

  // Estados para formulario web
  const [formWeb, setFormWeb] = useState({
    autores: '',
    anio: '',
    titulo: '',
    sitio: '',
    url: '',
    fecha_acceso: ''
  })

  // Estados para formulario tesis
  const [formTesis, setFormTesis] = useState({
    autor: '',
    anio: '',
    titulo: '',
    tipo: 'Tesis de grado',
    institucion: ''
  })

  if (!isOpen) return null

  // Campos opcionales por tipo
  const OPCIONALES = {
    libro: ['edicion'],
    articulo: ['numero', 'paginas'],
    web: ['fecha_acceso'],
    tesis: []
  }

const generarReferenciaConIA = async (tipoCampo, campos) => {
  const opcionales = OPCIONALES[tipoCampo] || []
  const faltantes = Object.entries(campos).filter(
    ([k, v]) => !opcionales.includes(k) && !String(v).trim()
  )

  if (faltantes.length > 0) {
    setError('Completá todos los campos obligatorios.')
    return
  }

  setCargando(true)
  setError('')

  try {
    const { data } = await api.post('/chat/generar-referencia', { tipo: tipoCampo, campos })

    setReferencias(prev => [...prev, { tipo: tipoCampo, texto: data.referencia }])

    if (tipoCampo === 'libro')    setFormLibro({ autores: '', anio: '', titulo: '', editorial: '', edicion: '' })
    if (tipoCampo === 'articulo') setFormArticulo({ autores: '', anio: '', titulo: '', revista: '', volumen: '', numero: '', paginas: '' })
    if (tipoCampo === 'web')      setFormWeb({ autores: '', anio: '', titulo: '', sitio: '', url: '', fecha_acceso: '' })
    if (tipoCampo === 'tesis')    setFormTesis({ autor: '', anio: '', titulo: '', tipo: 'Tesis de grado', institucion: '' })

  } catch (err) {
    const msg = err.response?.data?.error || 'Error al generar la referencia.'
    setError(msg)
  } finally {
    setCargando(false)
  }
}

  const copiarAlPortapapeles = () => {
    const texto = referencias.map(r => r.texto).join('\n\n')
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const eliminarReferencia = (index) => {
    setReferencias(referencias.filter((_, i) => i !== index))
  }

  const tiposConfig = [
    { id: 'libro',    label: 'Libro',    Icon: Book },
    { id: 'articulo', label: 'Artículo', Icon: FileText },
    { id: 'web',      label: 'Web',      Icon: Globe },
    { id: 'tesis',    label: 'Tesis',    Icon: GraduationCap },
  ]

  const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white placeholder-gray-400 transition"

  const BtnAgregar = ({ tipoId, campos, label }) => (
    <button
      onClick={() => generarReferenciaConIA(tipoId, campos)}
      disabled={cargando}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition"
    >
      {cargando ? (
        <>
          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          Generando con IA...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          {label}
        </>
      )}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              Generador de Bibliografía APA
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Formato APA 7ma edición · Generado con inteligencia artificial
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Panel izquierdo: Formulario */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Agregar referencia</h3>

              {/* Selector de tipo */}
              <div className="flex gap-2 mb-5">
                {tiposConfig.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setTipo(id); setError('') }}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all text-center ${
                      tipo === id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">{label}</p>
                  </button>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Formularios */}
              <div className="space-y-3">

                {tipo === 'libro' && (
                  <>
                    <input type="text" placeholder="Autor(es): Apellido, N. & Apellido, M. *" value={formLibro.autores} onChange={e => setFormLibro({...formLibro, autores: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Año de publicación *" value={formLibro.anio} onChange={e => setFormLibro({...formLibro, anio: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Título del libro *" value={formLibro.titulo} onChange={e => setFormLibro({...formLibro, titulo: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Editorial *" value={formLibro.editorial} onChange={e => setFormLibro({...formLibro, editorial: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Edición (opcional)" value={formLibro.edicion} onChange={e => setFormLibro({...formLibro, edicion: e.target.value})} className={inputClass} />
                    <BtnAgregar tipoId="libro" campos={formLibro} label="Generar referencia" />
                  </>
                )}

                {tipo === 'articulo' && (
                  <>
                    <input type="text" placeholder="Autor(es): Apellido, N. & Apellido, M. *" value={formArticulo.autores} onChange={e => setFormArticulo({...formArticulo, autores: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Año de publicación *" value={formArticulo.anio} onChange={e => setFormArticulo({...formArticulo, anio: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Título del artículo *" value={formArticulo.titulo} onChange={e => setFormArticulo({...formArticulo, titulo: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Nombre de la revista *" value={formArticulo.revista} onChange={e => setFormArticulo({...formArticulo, revista: e.target.value})} className={inputClass} />
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" placeholder="Volumen *" value={formArticulo.volumen} onChange={e => setFormArticulo({...formArticulo, volumen: e.target.value})} className={inputClass} />
                      <input type="text" placeholder="Número" value={formArticulo.numero} onChange={e => setFormArticulo({...formArticulo, numero: e.target.value})} className={inputClass} />
                      <input type="text" placeholder="Páginas" value={formArticulo.paginas} onChange={e => setFormArticulo({...formArticulo, paginas: e.target.value})} className={inputClass} />
                    </div>
                    <BtnAgregar tipoId="articulo" campos={formArticulo} label="Generar referencia" />
                  </>
                )}

                {tipo === 'web' && (
                  <>
                    <input type="text" placeholder="Autor(es) o Nombre del sitio *" value={formWeb.autores} onChange={e => setFormWeb({...formWeb, autores: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Año de publicación *" value={formWeb.anio} onChange={e => setFormWeb({...formWeb, anio: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Título de la página *" value={formWeb.titulo} onChange={e => setFormWeb({...formWeb, titulo: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Nombre del sitio web *" value={formWeb.sitio} onChange={e => setFormWeb({...formWeb, sitio: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="URL completa *" value={formWeb.url} onChange={e => setFormWeb({...formWeb, url: e.target.value})} className={inputClass} />
                    <input type="text" placeholder="Fecha de acceso (opcional): 15 de marzo de 2024" value={formWeb.fecha_acceso} onChange={e => setFormWeb({...formWeb, fecha_acceso: e.target.value})} className={inputClass} />
                    <BtnAgregar tipoId="web" campos={formWeb} label="Generar referencia" />
                  </>
                )}

{tipo === 'tesis' && (
  <>
    <input type="text" placeholder="Autor: Apellido, N. *" value={formTesis.autor} onChange={e => setFormTesis({...formTesis, autor: e.target.value})} className={inputClass} />
    <input type="text" placeholder="Año *" value={formTesis.anio} onChange={e => setFormTesis({...formTesis, anio: e.target.value})} className={inputClass} />
    <input type="text" placeholder="Título de la tesis *" value={formTesis.titulo} onChange={e => setFormTesis({...formTesis, titulo: e.target.value})} className={inputClass} />
    <input type="text" placeholder="Institución *" value={formTesis.institucion} onChange={e => setFormTesis({...formTesis, institucion: e.target.value})} className={inputClass} />
    <BtnAgregar tipoId="tesis" campos={formTesis} label="Generar referencia" />
  </>
)}
              </div>
            </div>

            {/* Panel derecho: Lista de referencias */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Referencias generadas ({referencias.length})
                </h3>
                {referencias.length > 0 && (
                  <button
                    onClick={copiarAlPortapapeles}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                  >
                    {copiado ? (
                      <><Check className="w-4 h-4" /> Copiado</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copiar todo</>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {referencias.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No hay referencias aún</p>
                    <p className="text-xs mt-1">Completá el formulario y la IA generará la referencia en formato APA 7</p>
                  </div>
                ) : (
                  referencias.map((ref, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg relative group"
                    >
                      <button
                        onClick={() => eliminarReferencia(index)}
                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="text-xs font-medium text-indigo-600 mb-1 capitalize">{ref.tipo}</p>
                      <p className="text-sm text-gray-700 leading-relaxed pr-6">{ref.texto}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            * Campos obligatorios
          </p>
          <p className="text-xs text-gray-400">
            Recordá ordenar las referencias alfabéticamente al final
          </p>
        </div>
      </div>
    </div>
  )
}
