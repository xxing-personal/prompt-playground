import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'

interface EntityCardProps {
  href: string
  icon: LucideIcon
  iconColor: string
  title: string
  description?: string | null
  meta?: React.ReactNode
}

export function EntityCard({ href, icon: Icon, iconColor, title, description, meta }: EntityCardProps) {
  return (
    <Link to={href}>
      <Card className="hover:border-blue-500 transition-colors cursor-pointer">
        <div className="flex items-start gap-3">
          <Icon className={`w-5 h-5 ${iconColor} mt-0.5`} />
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description || 'No description'}</p>
            {meta && <div className="mt-2">{meta}</div>}
          </div>
        </div>
      </Card>
    </Link>
  )
}
