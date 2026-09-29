import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Send } from 'lucide-react'
import { ConfirmContext } from '../../context/confirmContext'

const VARIANTES = {
  peligro: {
    Icono: AlertTriangle,
    icono: 'bg-red-100 text-red-600',
    boton: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
  },
  primario: {
    Icono: Send,
    icono: 'bg-indigo-100 text-indigo-600',
    boton: 'bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500',
  },
}

/**
 * Proveedor del diálogo de confirmación. Reemplaza a window.confirm()
 * con un modal accesible y con el estilo de la aplicación.
 */
export function ConfirmProvider({ children }) {
  const [opciones, setOpciones] = useState(null)
  const resolverRef = useRef(null)

  const confirmar = useCallback((nuevasOpciones) => {
    setOpciones(nuevasOpciones)
    return new Promise((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const cerrar = useCallback((resultado) => {
    resolverRef.current?.(resultado)
    resolverRef.current = null
    setOpciones(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {opciones && <ConfirmDialog {...opciones} onCerrar={cerrar} />}
    </ConfirmContext.Provider>
  )
}

function ConfirmDialog({
  titulo,
  mensaje,
  detalles = [],
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  variante = 'primario',
  onCerrar,
}) {
  const estilo = VARIANTES[variante] ?? VARIANTES.primario
  const { Icono } = estilo
  const cancelarRef = useRef(null)
  const confirmarRef = useRef(null)

  useEffect(() => {
    // En acciones destructivas el foco arranca en "Cancelar" para evitar confirmar sin querer
    const inicial = variante === 'peligro' ? cancelarRef.current : confirmarRef.current
    inicial?.focus()

    const alPresionarTecla = (e) => {
      if (e.key === 'Escape') onCerrar(false)
    }
    document.addEventListener('keydown', alPresionarTecla)
    return () => document.removeEventListener('keydown', alPresionarTecla)
  }, [variante, onCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar(false) }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-titulo"
        aria-describedby="confirm-mensaje"
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
      >
        <div className="flex gap-4">
          <div className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${estilo.icono}`}>
            <Icono className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="confirm-titulo" className="text-lg font-semibold text-gray-900">
              {titulo}
            </h2>
            {mensaje && (
              <p id="confirm-mensaje" className="mt-1.5 text-sm text-gray-600">
                {mensaje}
              </p>
            )}
            {detalles.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                {detalles.map((detalle) => (
                  <li key={detalle} className="flex gap-2">
                    <span className="mt-2 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                    <span>{detalle}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            ref={cancelarRef}
            type="button"
            onClick={() => onCerrar(false)}
            className="min-h-[44px] px-4 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
          >
            {textoCancelar}
          </button>
          <button
            ref={confirmarRef}
            type="button"
            onClick={() => onCerrar(true)}
            className={`min-h-[44px] px-4 text-sm font-semibold text-white rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${estilo.boton}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
