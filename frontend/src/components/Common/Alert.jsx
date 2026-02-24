import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const types = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    text: 'text-green-700',
    Icon: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    text: 'text-red-700',
    Icon: AlertCircle,
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-700',
    Icon: Info,
  },
}

export function Alert({ type = 'info', message, onClose }) {
  const style = types[type]
  const Icon = style.Icon

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg ${style.container}`}>
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${style.icon}`} />
      <p className={`text-sm flex-1 ${style.text}`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.icon} hover:opacity-70`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}