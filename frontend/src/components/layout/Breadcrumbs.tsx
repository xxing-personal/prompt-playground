import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="w-4 h-4" />}
          {item.href ? (
            <Link to={item.href} className="hover:text-gray-900">{item.label}</Link>
          ) : (
            <span className="text-gray-900">{item.label}</span>
          )}
        </Fragment>
      ))}
    </div>
  )
}
