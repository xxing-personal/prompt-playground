import { GitCompare, FileText, Calendar } from 'lucide-react'
import type { PromptVersion } from '../../types'

interface DiffHeaderProps {
  oldVersion: PromptVersion
  newVersion: PromptVersion
  oldLineCount: number
  newLineCount: number
}

export function DiffHeader({ oldVersion, newVersion, oldLineCount, newLineCount }: DiffHeaderProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
            <GitCompare className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Version Comparison</h2>
            <p className="text-sm text-slate-500">Review changes between versions</p>
          </div>
        </div>
      </div>

      {/* Version Cards */}
      <div className="flex gap-4 items-stretch">
        {/* Old Version Card */}
        <div className="flex-1 p-4 bg-slate-50/50 rounded-xl border border-red-100 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-400 rounded-l-xl opacity-60"></div>
          <div className="flex items-center gap-2 mb-2 ml-2">
            <span className="text-sm font-semibold text-slate-900">Version {oldVersion.version_number}</span>
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold bg-white border border-red-200 text-red-700 rounded-full shadow-sm">Base</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 ml-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(oldVersion.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {oldLineCount} lines
            </span>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center px-2">
          <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full border border-slate-200 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* New Version Card */}
        <div className="flex-1 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-xl opacity-60"></div>
          <div className="flex items-center gap-2 mb-2 ml-2">
            <span className="text-sm font-semibold text-slate-900">Version {newVersion.version_number}</span>
            <span className="px-2 py-0.5 text-[10px] uppercase tracking-wide font-bold bg-green-100 text-green-700 rounded-full shadow-sm">Current</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 ml-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(newVersion.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {newLineCount} lines
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
