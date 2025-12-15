import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { Modal } from '../ui/Modal'
import { GitCompare, FileText, Calendar } from 'lucide-react'
import type { PromptVersion } from '../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  oldVersion: PromptVersion | null
  newVersion: PromptVersion | null
}

export function VersionDiffModal({ isOpen, onClose, oldVersion, newVersion }: Props) {
  if (!oldVersion || !newVersion) return null

  const oldText = oldVersion.template_text ||
    (oldVersion.template_messages ? JSON.stringify(oldVersion.template_messages, null, 2) : '')
  const newText = newVersion.template_text ||
    (newVersion.template_messages ? JSON.stringify(newVersion.template_messages, null, 2) : '')

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="full"
    >
      <div className="flex flex-col h-[80vh]">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GitCompare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Version Comparison</h2>
                <p className="text-sm text-slate-500">Comparing changes between versions</p>
              </div>
            </div>
          </div>
          
          {/* Version Cards */}
          <div className="flex gap-4 mt-4">
            {/* Old Version Card */}
            <div className="flex-1 p-4 bg-white rounded-xl border border-red-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="text-sm font-semibold text-slate-700">Version {oldVersion.version_number}</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">Previous</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(oldVersion.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {oldText.split('\n').length} lines
                </span>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full">
                <span className="text-slate-600 font-bold">→</span>
              </div>
            </div>
            
            {/* New Version Card */}
            <div className="flex-1 p-4 bg-white rounded-xl border border-green-200/60 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-sm font-semibold text-slate-700">Version {newVersion.version_number}</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Current</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(newVersion.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {newText.split('\n').length} lines
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Diff Content */}
        <div className="flex-1 overflow-auto bg-white">
          <ReactDiffViewer
            oldValue={oldText}
            newValue={newText}
            splitView={true}
            showDiffOnly={false}
            useDarkTheme={false}
            compareMethod={DiffMethod.WORDS}
            leftTitle={`Version ${oldVersion.version_number}`}
            rightTitle={`Version ${newVersion.version_number}`}
            styles={{
              variables: {
                light: {
                  diffViewerBackground: '#ffffff',
                  diffViewerTitleBackground: '#f8fafc',
                  diffViewerTitleColor: '#475569',
                  diffViewerTitleBorderColor: '#e2e8f0',
                  gutterBackground: '#f8fafc',
                  gutterBackgroundDark: '#f1f5f9',
                  gutterColor: '#94a3b8',
                  addedBackground: '#ecfdf5',
                  addedGutterBackground: '#d1fae5',
                  wordAddedBackground: '#86efac',
                  removedBackground: '#fef2f2',
                  removedGutterBackground: '#fecaca',
                  wordRemovedBackground: '#fca5a5',
                  codeFoldGutterBackground: '#f1f5f9',
                  codeFoldBackground: '#f8fafc',
                  emptyLineBackground: '#fafafa',
                  codeFoldContentColor: '#64748b',
                }
              },
              diffContainer: {
                fontSize: '14px',
                lineHeight: '1.7',
              },
              titleBlock: {
                padding: '12px 16px',
                fontWeight: '600',
                fontSize: '13px',
                borderBottom: '1px solid #e2e8f0',
              },
              contentText: {
                fontSize: '14px',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                lineHeight: '1.7',
                color: '#334155',
                padding: '0 16px',
              },
              line: {
                padding: '4px 0',
              },
              gutter: {
                fontSize: '12px',
                padding: '4px 16px',
                minWidth: '60px',
                textAlign: 'right' as const,
              },
              lineNumber: {
                color: '#94a3b8',
                fontWeight: '500',
              },
              wordDiff: {
                padding: '2px 4px',
                borderRadius: '3px',
              },
              marker: {
                padding: '0 8px',
                fontSize: '14px',
                fontWeight: '600',
              },
              emptyGutter: {
                backgroundColor: '#f8fafc',
              },
              diffRemoved: {
                overflowX: 'auto' as const,
                overflowWrap: 'break-word' as const,
              },
              diffAdded: {
                overflowX: 'auto' as const,
                overflowWrap: 'break-word' as const,
              },
            }}
          />
        </div>
        
        {/* Footer Stats */}
        <div className="flex-shrink-0 px-6 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="font-medium">{countChanges(oldText, newText).added}</span> additions
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="font-medium">{countChanges(oldText, newText).removed}</span> deletions
              </span>
            </div>
            <span className="text-slate-400 text-xs">Press ESC to close</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function countChanges(oldText: string, newText: string): { added: number; removed: number } {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const oldSet = new Set(oldLines)
  const newSet = new Set(newLines)
  
  let added = 0
  let removed = 0
  
  for (const line of newLines) {
    if (!oldSet.has(line)) added++
  }
  for (const line of oldLines) {
    if (!newSet.has(line)) removed++
  }
  
  return { added, removed }
}
