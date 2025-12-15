import { Link } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Prompt Playground
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">Projects</Link>
            <Link to="/evaluations" className="text-sm text-gray-600 hover:text-gray-900">Evaluations</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
