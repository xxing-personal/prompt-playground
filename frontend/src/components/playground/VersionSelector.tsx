import { useState, useRef, useEffect } from 'react'
import { ChevronRight, MoreVertical } from 'lucide-react'

interface Version {
  id: string
  version_number: number
  created_at: string
  labels?: string[]
}

const LABELS = ['production', 'beta', 'alpha'] as const

interface VersionSelectorProps {
  versions: Version[]
  selectedId: string | null
  isOpen: boolean
  onToggle: () => void
  onSelect: (id: string) => void
  onCompare?: (id: string) => void
  onPromote?: (versionNumber: number, label: string) => void
  onDemote?: (versionNumber: number, label: string) => void
}

export function VersionSelector({
  versions,
  selectedId,
  isOpen,
  onToggle,
  onSelect,
  onCompare,
  onPromote,
  onDemote,
}: VersionSelectorProps) {
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedVersion = versions.find(v => v.id === selectedId)

  // Reset nested menu when parent closes
  useEffect(() => {
    if (!isOpen) {
      setMenuOpenFor(null)
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onToggle])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-full hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
      >
        <span className="text-slate-500">v</span>
        <span>{selectedVersion?.version_number || '?'}</span>
        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && versions.length > 0 && (
        <div className="absolute right-0 mt-1 min-w-[24rem] w-max max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {versions.map((v) => (
            <div
              key={v.id}
              className={`px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${v.id === selectedId ? 'bg-blue-50 text-blue-700' : ''
                }`}
            >
              <button
                onClick={() => onSelect(v.id)}
                className="flex items-center gap-2 flex-1 text-left whitespace-nowrap"
              >
                <span>Version {v.version_number}</span>
                {v.labels?.map(label => (
                  <span
                    key={label}
                    className={`px-1.5 py-0.5 text-xs rounded ${label === 'production' ? 'bg-green-100 text-green-700' :
                      label === 'beta' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {label}
                  </span>
                ))}
              </button>
              <div className="flex items-center gap-1">
                {onCompare && v.id !== selectedId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCompare(v.id); }}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    diff
                  </button>
                )}
                <span className="text-xs text-gray-500 mr-1">
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
                {(onPromote || onDemote) && (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpenFor(menuOpenFor === v.id ? null : v.id); }}
                      className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {menuOpenFor === v.id && (
                      <div className="absolute right-0 top-6 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                        {LABELS.map(label => {
                          const hasLabel = v.labels?.includes(label)
                          return (
                            <button
                              key={label}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (hasLabel) {
                                  onDemote?.(v.version_number, label)
                                } else {
                                  onPromote?.(v.version_number, label)
                                }
                                setMenuOpenFor(null)
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center justify-between"
                            >
                              <span>{hasLabel ? `Remove ${label}` : `Set as ${label}`}</span>
                              {hasLabel && (
                                <span className={`w-2 h-2 rounded-full ${label === 'production' ? 'bg-green-500' :
                                  label === 'beta' ? 'bg-yellow-500' : 'bg-gray-400'
                                  }`} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
