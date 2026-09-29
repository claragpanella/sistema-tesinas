import { useEffect, useState } from 'react'

/**
 * Devuelve `value` recién cuando dejó de cambiar durante `delay` milisegundos.
 * Se usa en los buscadores para no consultar a la API en cada tecla.
 */
export function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
