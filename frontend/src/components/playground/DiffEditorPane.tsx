import { useState, useRef, useCallback, useEffect } from 'react'
import { useDiff, DiffLine } from '../../hooks/useDiff'
import { Eye, EyeOff, Split, AlignJustify } from 'lucide-react'

interface DiffEditorPaneProps {
  baseText: string
  currentText: string
  onChange: (text: string) => void
  showDiff?: boolean
  placeholder?: string
  highlightVariables?: boolean
}

type ViewMode = 'inline' | 'split'

export function DiffEditorPane({
  baseText,
  currentText,
  onChange,
  showDiff = true,
  placeholder = 'Enter your prompt template...',
  highlightVariables = true,
}: DiffEditorPaneProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('inline')
  const [diffEnabled, setDiffEnabled] = useState(showDiff)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const diffResult = useDiff(baseText, currentText)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(192, textareaRef.current.scrollHeight)}px`
    }
  }, [currentText])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  // Highlight variables in text
  const highlightText = (text: string) => {
    if (!highlightVariables) return text
    return text.replace(
      /\{\{(\w+)\}\}/g,
      '<span class="bg-amber-100 text-amber-800 px-0.5 rounded">{{$1}}</span>'
    )
  }

  return (
    <div className="relative group">
      {/* Controls Overlay (Top Right) */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-100 transition-opacity">
        {baseText && (
          <div className="flex bg-white/90 backdrop-blur rounded-lg border border-slate-200 shadow-sm p-1">
            <button
              onClick={() => setDiffEnabled(!diffEnabled)}
              className={`p-1.5 rounded-md transition-all ${diffEnabled ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'
                }`}
              title={diffEnabled ? 'Hide diff' : 'Show diff'}
            >
              {diffEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            {diffEnabled && (
              <>
                <div className="w-px bg-slate-200 mx-1 my-1" />
                <button
                  onClick={() => setViewMode('inline')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'inline' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  title="Inline view"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'split' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  title="Split view"
                >
                  <Split className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Editor Area */}
      {!baseText || !diffEnabled ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            className="w-full min-h-[300px] p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:bg-slate-50/50 transition-colors"
            placeholder={placeholder}
            value={currentText}
            onChange={handleChange}
            spellCheck={false}
          />
          {highlightVariables && currentText && (
            <div
              className="absolute inset-0 p-6 font-mono text-sm leading-relaxed pointer-events-none whitespace-pre-wrap break-words"
              style={{ color: 'transparent' }}
              dangerouslySetInnerHTML={{ __html: highlightText(currentText) }}
            />
          )}
        </div>
      ) : viewMode === 'inline' ? (
        <InlineDiffView
          diffLines={diffResult.lines}
          currentText={currentText}
          onChange={onChange}
          placeholder={placeholder}
        />
      ) : (
        <SplitDiffView
          baseText={baseText}
          currentText={currentText}
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

interface InlineDiffViewProps {
  diffLines: DiffLine[]
  currentText: string
  onChange: (text: string) => void
  placeholder: string
}

function InlineDiffView({ diffLines, currentText, onChange, placeholder }: InlineDiffViewProps) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Diff display */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 max-h-40 overflow-auto">
        <div className="font-mono text-sm">
          {diffLines.length === 0 ? (
            <span className="text-gray-400">No changes</span>
          ) : (
            diffLines.map((line, idx) => (
              <div
                key={idx}
                className={`px-2 py-0.5 ${line.type === 'added'
                    ? 'bg-green-50 text-green-800 border-l-2 border-green-500'
                    : line.type === 'removed'
                      ? 'bg-red-50 text-red-800 border-l-2 border-red-500 line-through'
                      : 'text-gray-600'
                  }`}
              >
                <span className="inline-block w-6 text-gray-400 text-xs">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </span>
                {line.content || '\u00A0'}
              </div>
            ))
          )}
        </div>
      </div>
      {/* Editable area */}
      <textarea
        className="w-full min-h-48 p-3 font-mono text-sm resize-none focus:outline-none border-0"
        placeholder={placeholder}
        value={currentText}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

interface SplitDiffViewProps {
  baseText: string
  currentText: string
  onChange: (text: string) => void
  placeholder: string
}

function SplitDiffView({ baseText, currentText, onChange, placeholder }: SplitDiffViewProps) {
  const baseLines = baseText.split('\n')

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Base version (read-only) */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 border-b border-gray-200">
          Base Version (read-only)
        </div>
        <div className="p-3 font-mono text-sm bg-gray-50 min-h-48 max-h-64 overflow-auto">
          {baseLines.map((line, idx) => (
            <div key={idx} className="flex">
              <span className="w-8 text-gray-400 text-xs select-none">{idx + 1}</span>
              <span className="text-gray-600">{line || '\u00A0'}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Current version (editable) */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <div className="bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 border-b border-gray-200">
          Current Version (editing)
        </div>
        <textarea
          className="w-full min-h-48 p-3 font-mono text-sm resize-none focus:outline-none border-0"
          placeholder={placeholder}
          value={currentText}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}
