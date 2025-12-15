import { useState, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'

interface TagEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  variant?: 'default' | 'minimal'
  disabled?: boolean
}

export function TagEditor({ tags, onChange, disabled, variant = 'default' }: TagEditorProps) {
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddTag = () => {
    const trimmed = inputValue.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInputValue('')
    setIsAdding(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setInputValue('')
      setIsAdding(false)
    }
  }



  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map(tag => (
        <span
          key={tag}
          className={`inline-flex h-6 items-center gap-1 px-2 text-xs rounded-full border transition-colors ${variant === 'minimal'
            ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            : 'bg-blue-50 border-blue-100 text-blue-700 hover:border-blue-200'
            }`}
        >
          {tag}
          {!disabled && (
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:text-slate-900 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </span>
      ))}

      {isAdding ? (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAddTag}
          placeholder="tag"
          autoFocus
          className="w-24 h-6 px-2 text-xs border border-blue-300 rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        />
      ) : (
        !disabled && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex h-6 items-center gap-1 px-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors border border-dashed border-slate-300"
          >
            <Plus className="w-3 h-3" />
            Add Tag
          </button>
        )
      )}
    </div>
  )
}
