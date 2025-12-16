import type { DiffResult } from '../../hooks/useDiff'

interface DiffStatsProps {
  stats: DiffResult
}

export function DiffStats({ stats }: DiffStatsProps) {
  return (
    <div className="flex-shrink-0 px-6 py-3 bg-white border-t border-slate-200">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-md border border-green-100">
            <span className="font-bold">+{stats.addedCount}</span>
            <span className="text-xs uppercase tracking-wide font-medium">Additions</span>
          </span>
          <span className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-md border border-red-100">
            <span className="font-bold">-{stats.removedCount}</span>
            <span className="text-xs uppercase tracking-wide font-medium">Deletions</span>
          </span>
          {!stats.hasChanges && (
            <span className="text-slate-400 italic flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              No changes detected
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-xs font-medium">Press ESC to close</span>
        </div>
      </div>
    </div>
  )
}
