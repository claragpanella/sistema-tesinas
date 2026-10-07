import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Campo de contraseña con botón para mostrar u ocultar lo escrito.
 * Recibe las mismas props que un <input> (value, onChange, name, etc.).
 */
export function PasswordInput({ className = 'input', disabled, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={`${className} pr-11`}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  )
}
