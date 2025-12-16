import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  className?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap overflow-hidden">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="w-4 h-4 shrink-0" />}
          {item.href ? (
            <Link
              to={item.href}
              className={`hover:text-gray-900 transition-colors ${item.className || ''}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className={`text-gray-900 font-medium ${item.className || ''}`}>
              {item.label}
            </span>
          )}
        </Fragment>
      ))}
    </div>
  )
}
