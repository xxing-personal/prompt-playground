import { useState } from 'react'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { Modal } from '../ui/Modal'
import { FileText, Play } from 'lucide-react'
import type { PromptVersion } from '../../types'
import { useDiff } from '../../hooks/useDiff'
import { DiffHeader } from './DiffHeader'
import { DiffStats } from './DiffStats'
import { VersionOutputComparison } from './VersionOutputComparison'

type TabType = 'template' | 'output'

interface Props {
  isOpen: boolean
  onClose: () => void
  oldVersion: PromptVersion | null
  newVersion: PromptVersion | null
  variables?: Record<string, string>
  model?: string
  temperature?: number
  maxTokens?: number
}

export function VersionDiffModal({
  isOpen,
  onClose,
  oldVersion,
  newVersion,
  variables = {},
  model = 'openai/gpt-4o',
  temperature = 0.7,
  maxTokens = 1024,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('template')

  const oldText = oldVersion
    ? (oldVersion.template_text || (oldVersion.template_messages ? JSON.stringify(oldVersion.template_messages, null, 2) : ''))
    : ''
  const newText = newVersion
    ? (newVersion.template_text || (newVersion.template_messages ? JSON.stringify(newVersion.template_messages, null, 2) : ''))
    : ''

  const diffStats = useDiff(oldText, newText)

  if (!oldVersion || !newVersion) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="full"
    >
      <div className="flex flex-col h-[85vh]">
        {/* Header with Version Info */}
        <DiffHeader
          oldVersion={oldVersion}
          newVersion={newVersion}
          oldLineCount={oldText.split('\n').length}
          newLineCount={newText.split('\n').length}
        />

        {/* Tabs */}
        <div className="flex-shrink-0 px-6 bg-white border-b border-slate-200">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('template')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'template'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Template Diff
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'output'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Play className="w-4 h-4" />
              Output Comparison
            </button>
          </div>
        </div>

        {/* Tab Content - render both, hide inactive to preserve state */}
        <div className="flex-1 overflow-hidden relative">
          {/* Template Diff Tab */}
          <div className={`h-full flex flex-col ${activeTab === 'template' ? '' : 'hidden'}`}>
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
                      gutterBackground: '#f8fafc',
                      addedBackground: '#f0fdf4',
                      addedGutterBackground: '#dcfce7',
                      wordAddedBackground: '#86efac',
                      removedBackground: '#fef2f2',
                      removedGutterBackground: '#fee2e2',
                      wordRemovedBackground: '#fca5a5',
                    }
                  },
                  contentText: {
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  },
                  lineNumber: {
                    color: '#94a3b8',
                  }
                }}
              />
            </div>
            <DiffStats stats={diffStats} />
          </div>

          {/* Output Comparison Tab */}
          <div className={`h-full ${activeTab === 'output' ? '' : 'hidden'}`}>
            <VersionOutputComparison
              oldVersion={oldVersion}
              newVersion={newVersion}
              variables={variables}
              model={model}
              temperature={temperature}
              maxTokens={maxTokens}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}

