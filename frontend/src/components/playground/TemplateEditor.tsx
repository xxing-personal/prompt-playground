import { Input } from '../ui/Input'

interface TemplateEditorProps {
  template: string
  variables: Record<string, string>
  onChange: (template: string) => void
  onVariableChange: (key: string, value: string) => void
}

export function TemplateEditor({ template, variables, onChange, onVariableChange }: TemplateEditorProps) {
  // Extract variables from template
  const extractedVars = template.match(/\{\{(\w+)\}\}/g)?.map(v => v.slice(2, -2)) || []

  return (
    <div>
      <h2 className="font-medium text-gray-900 mb-4">Template</h2>
      <textarea
        className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your prompt template... Use {{variable}} for variables"
        value={template}
        onChange={(e) => onChange(e.target.value)}
      />

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
