import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface Message {
  role: string
  content: string
}

interface ChatTemplateEditorProps {
  messages: Message[]
  variables: Record<string, string>
  onChange: (messages: Message[]) => void
  onVariableChange: (key: string, value: string) => void
}

export function ChatTemplateEditor({ messages, variables, onChange, onVariableChange }: ChatTemplateEditorProps) {
  const handleMessageChange = (index: number, field: 'role' | 'content', value: string) => {
    const updated = [...messages]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const handleAddMessage = () => {
    onChange([...messages, { role: 'user', content: '' }])
  }

  const handleRemoveMessage = (index: number) => {
    if (messages.length <= 1) return
    onChange(messages.filter((_, i) => i !== index))
  }

  // Extract variables from all messages
  const extractedVars = messages
    .flatMap(m => m.content.match(/\{\{(\w+)\}\}/g) || [])
    .map(v => v.slice(2, -2))
    .filter((v, i, arr) => arr.indexOf(v) === i)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Chat Messages</h2>
        <Button variant="secondary" size="sm" onClick={handleAddMessage}>
          <Plus className="w-4 h-4 mr-1" /> Add Message
        </Button>
      </div>

      <div className="space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className="flex gap-2 items-start">
            <select
              value={msg.role}
              onChange={(e) => handleMessageChange(index, 'role', e.target.value)}
              className="px-2 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system">System</option>
              <option value="user">User</option>
              <option value="assistant">Assistant</option>
            </select>
            <textarea
              value={msg.content}
              onChange={(e) => handleMessageChange(index, 'content', e.target.value)}
              placeholder={`${msg.role} message...`}
              className="flex-1 h-20 p-2 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {messages.length > 1 && (
              <button
                onClick={() => handleRemoveMessage(index)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {extractedVars.length > 0 && (
        <div className="mt-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Variables</h3>
          {extractedVars.map((varName) => (
            <Input
              key={varName}
              label={varName}
              value={variables[varName] || ''}
              onChange={(e) => onVariableChange(varName, e.target.value)}
              placeholder={`Enter ${varName}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
