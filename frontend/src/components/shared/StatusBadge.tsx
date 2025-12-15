const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  running: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  canceled: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colorClass = STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.pending
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClass} ${className}`}>
      {status}
    </span>
  )
}
