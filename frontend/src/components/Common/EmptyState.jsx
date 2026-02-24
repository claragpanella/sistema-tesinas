import { Inbox } from 'lucide-react'

export function EmptyState({ title = 'Sin resultados', description = 'No hay datos para mostrar', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm">{description}</p>
      {action && action}
    </div>
  )
}