import { useContext } from 'react'
import { ConfirmContext } from '../context/confirmContext'

/**
 * Abre el diálogo de confirmación de la aplicación y devuelve una promesa
 * que se resuelve en true (confirmó) o false (canceló).
 *
 *   const confirmar = useConfirm()
 *   if (!(await confirmar({ titulo: '¿Eliminar pauta?', variante: 'peligro' }))) return
 */
export function useConfirm() {
  const confirmar = useContext(ConfirmContext)
  if (!confirmar) {
    throw new Error('useConfirm debe usarse dentro de ConfirmProvider')
  }
  return confirmar
}
