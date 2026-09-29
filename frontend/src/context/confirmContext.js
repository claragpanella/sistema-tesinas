import { createContext } from 'react'

// Contexto compartido entre ConfirmProvider (que dibuja el diálogo)
// y el hook useConfirm (que lo abre desde cualquier página).
export const ConfirmContext = createContext(null)
