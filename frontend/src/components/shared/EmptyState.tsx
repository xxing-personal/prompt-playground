import { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card>
      <div className="text-center py-8">
        <Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">{title}</p>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
        {actionLabel && onAction && (
          <Button className="mt-4" onClick={onAction}>{actionLabel}</Button>
        )}
      </div>
    </Card>
  )
}
