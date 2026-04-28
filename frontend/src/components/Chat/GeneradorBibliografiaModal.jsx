import { useState } from 'react'
import { X, Plus, Copy, Check, Book, FileText, Globe, GraduationCap } from 'lucide-react'

export function GeneradorBibliografiaModal({ isOpen, onClose }) {
  const [tipo, setTipo] = useState('libro')
  const [referencias, setReferencias] = useState([])
  const [copiado, setCopiado] = useState(false)
  
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

  const generarReferenciaLibro = () => {
    const { autores, anio, titulo, editorial, edicion } = formLibro
    
    if (!autores || !anio || !titulo || !editorial) {
      alert('Completá todos los campos obligatorios')
      return
    }
    
    const edicionTexto = edicion ? ` (${edicion}ª ed.)` : ''
    const referencia = `${autores} (${anio}). *${titulo}*${edicionTexto}. ${editorial}.`
    
    setReferencias([...referencias, { tipo: 'libro', texto: referencia }])
    setFormLibro({ autores: '', anio: '', titulo: '', editorial: '', edicion: '' })
  }

  const generarReferenciaArticulo = () => {
    const { autores, anio, titulo, revista, volumen, numero, paginas } = formArticulo
    
    if (!autores || !anio || !titulo || !revista) {
      alert('Completá todos los campos obligatorios')
      return
    }
    
    const volumenNumero = numero ? `${volumen}(${numero})` : volumen
    const paginasTexto = paginas ? `, ${paginas}` : ''
    const referencia = `${autores} (${anio}). ${titulo}. *${revista}*, ${volumenNumero}${paginasTexto}.`
    
    setReferencias([...referencias, { tipo: 'articulo', texto: referencia }])
    setFormArticulo({ autores: '', anio: '', titulo: '', revista: '', volumen: '', numero: '', paginas: '' })
  }

  const generarReferenciaWeb = () => {
    const { autores, anio, titulo, sitio, url, fecha_acceso } = formWeb
    
    if (!autores || !anio || !titulo || !sitio || !url) {
      alert('Completá todos los campos obligatorios')
      return
    }
    
    const fechaTexto = fecha_acceso ? ` Recuperado el ${fecha_acceso} de` : ''
    const referencia = `${autores} (${anio}). ${titulo}. ${sitio}.${fechaTexto} ${url}`
    
    setReferencias([...referencias, { tipo: 'web', texto: referencia }])
    setFormWeb({ autores: '', anio: '', titulo: '', sitio: '', url: '', fecha_acceso: '' })
  }

  const generarReferenciaTesis = () => {
    const { autor, anio, titulo, tipo, institucion } = formTesis
    
    if (!autor || !anio || !titulo || !institucion) {
      alert('Completá todos los campos obligatorios')
      return
    }
    
    const referencia = `${autor} (${anio}). *${titulo}* [${tipo}]. ${institucion}.`
    
    setReferencias([...referencias, { tipo: 'tesis', texto: referencia }])
    setFormTesis({ autor: '', anio: '', titulo: '', tipo: 'Tesis de grado', institucion: '' })
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Generador de Bibliografía APA
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Formato APA 7ma edición
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Panel izquierdo: Formulario */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Agregar referencia</h3>
              
              {/* Selector de tipo */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setTipo('libro')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    tipo === 'libro'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Book className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Libro</p>
                </button>
                <button
                  onClick={() => setTipo('articulo')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    tipo === 'articulo'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Artículo</p>
                </button>
                <button
                  onClick={() => setTipo('web')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    tipo === 'web'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Globe className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Web</p>
                </button>
                <button
                  onClick={() => setTipo('tesis')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    tipo === 'tesis'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <GraduationCap className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Tesis</p>
                </button>
              </div>

              {/* Formulario según tipo */}
              <div className="space-y-3">
                
                {tipo === 'libro' && (
                  <>
                    <input
                      type="text"
                      placeholder="Autor(es): Apellido, N. & Apellido, M."
                      value={formLibro.autores}
                      onChange={e => setFormLibro({...formLibro, autores: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Año de publicación"
                      value={formLibro.anio}
                      onChange={e => setFormLibro({...formLibro, anio: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Título del libro"
                      value={formLibro.titulo}
                      onChange={e => setFormLibro({...formLibro, titulo: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Editorial"
                      value={formLibro.editorial}
                      onChange={e => setFormLibro({...formLibro, editorial: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Edición (opcional)"
                      value={formLibro.edicion}
                      onChange={e => setFormLibro({...formLibro, edicion: e.target.value})}
                      className="input text-sm"
                    />
                    <button
                      onClick={generarReferenciaLibro}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar libro
                    </button>
                  </>
                )}

                {tipo === 'articulo' && (
                  <>
                    <input
                      type="text"
                      placeholder="Autor(es): Apellido, N. & Apellido, M."
                      value={formArticulo.autores}
                      onChange={e => setFormArticulo({...formArticulo, autores: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Año de publicación"
                      value={formArticulo.anio}
                      onChange={e => setFormArticulo({...formArticulo, anio: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Título del artículo"
                      value={formArticulo.titulo}
                      onChange={e => setFormArticulo({...formArticulo, titulo: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Nombre de la revista"
                      value={formArticulo.revista}
                      onChange={e => setFormArticulo({...formArticulo, revista: e.target.value})}
                      className="input text-sm"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Volumen"
                        value={formArticulo.volumen}
                        onChange={e => setFormArticulo({...formArticulo, volumen: e.target.value})}
                        className="input text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Número"
                        value={formArticulo.numero}
                        onChange={e => setFormArticulo({...formArticulo, numero: e.target.value})}
                        className="input text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Páginas"
                        value={formArticulo.paginas}
                        onChange={e => setFormArticulo({...formArticulo, paginas: e.target.value})}
                        className="input text-sm"
                      />
                    </div>
                    <button
                      onClick={generarReferenciaArticulo}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar artículo
                    </button>
                  </>
                )}

                {tipo === 'web' && (
                  <>
                    <input
                      type="text"
                      placeholder="Autor(es) o Nombre del sitio"
                      value={formWeb.autores}
                      onChange={e => setFormWeb({...formWeb, autores: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Año de publicación"
                      value={formWeb.anio}
                      onChange={e => setFormWeb({...formWeb, anio: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Título de la página"
                      value={formWeb.titulo}
                      onChange={e => setFormWeb({...formWeb, titulo: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Nombre del sitio web"
                      value={formWeb.sitio}
                      onChange={e => setFormWeb({...formWeb, sitio: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="URL completa"
                      value={formWeb.url}
                      onChange={e => setFormWeb({...formWeb, url: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Fecha de acceso (opcional): 15 de marzo de 2024"
                      value={formWeb.fecha_acceso}
                      onChange={e => setFormWeb({...formWeb, fecha_acceso: e.target.value})}
                      className="input text-sm"
                    />
                    <button
                      onClick={generarReferenciaWeb}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar sitio web
                    </button>
                  </>
                )}

                {tipo === 'tesis' && (
                  <>
                    <input
                      type="text"
                      placeholder="Autor: Apellido, N."
                      value={formTesis.autor}
                      onChange={e => setFormTesis({...formTesis, autor: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Año"
                      value={formTesis.anio}
                      onChange={e => setFormTesis({...formTesis, anio: e.target.value})}
                      className="input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Título de la tesis"
                      value={formTesis.titulo}
                      onChange={e => setFormTesis({...formTesis, titulo: e.target.value})}
                      className="input text-sm"
                    />
                    <select
                      value={formTesis.tipo}
                      onChange={e => setFormTesis({...formTesis, tipo: e.target.value})}
                      className="input text-sm"
                    >
                      <option>Tesis de grado</option>
                      <option>Tesis de maestría</option>
                      <option>Tesis doctoral</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Institución"
                      value={formTesis.institucion}
                      onChange={e => setFormTesis({...formTesis, institucion: e.target.value})}
                      className="input text-sm"
                    />
                    <button
                      onClick={generarReferenciaTesis}
                      className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar tesis
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Panel derecho: Lista de referencias */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">
                  Referencias generadas ({referencias.length})
                </h3>
                {referencias.length > 0 && (
                  <button
                    onClick={copiarAlPortapapeles}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar todo
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {referencias.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No hay referencias aún</p>
                    <p className="text-xs">Completá el formulario para agregar</p>
                  </div>
                ) : (
                  referencias.map((ref, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg relative group"
                    >
                      <button
                        onClick={() => eliminarReferencia(index)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-sm text-gray-700 leading-relaxed pr-6">
                        {ref.texto}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Recordá ordenar las referencias alfabéticamente al final
          </p>
        </div>
      </div>
    </div>
  )
}