import { useMemo } from 'react'
import { Plus, Variable } from 'lucide-react'
import { Input } from '../ui/Input'

interface VariableSidePanelProps {
  template: string
  variables: Record<string, string>
  onVariableChange: (key: string, value: string) => void
  onInsertVariable?: (variableName: string) => void
}

// Extract unique variable names from template
export function extractVariables(template: string): string[] {
  const matches = template.matchAll(/\{\{(\w+)\}\}/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

export function VariableSidePanel({
  template,
  variables,
  onVariableChange,
  onInsertVariable,
}: VariableSidePanelProps) {
  const detectedVariables = useMemo(() => extractVariables(template), [template])

  // Suggested variables that aren't in the template yet
  const suggestedVariables = ['user', 'context', 'question', 'task', 'input', 'output']
  const availableSuggestions = suggestedVariables.filter(
    (v) => !detectedVariables.includes(v)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Variable className="w-4 h-4" />
          Variables
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">
          {detectedVariables.length} DETECTED
        </span>
      </div>

      {/* Detected Variables */}
      {detectedVariables.length > 0 ? (
        <div className="space-y-4">
          {detectedVariables.map((varName) => (
            <div key={varName} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700 font-mono">
                  {varName}
                </label>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-wide">
                  Required
                </span>
              </div>
              <Input
                value={variables[varName] || ''}
                onChange={(e) => onVariableChange(varName, e.target.value)}
                placeholder={`Value for ${varName}`}
                className="text-sm"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-400 py-8 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
          No variables detected.
          <br />
          <span className="text-xs text-slate-400 mt-1 block">
            Use <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-600 font-mono text-[10px]">{'{{variable}}'}</code> syntax
          </span>
        </div>
      )}

      {/* Insert Variable Buttons */}
      {onInsertVariable && availableSuggestions.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Quick insert</div>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.slice(0, 4).map((varName) => (
              <button
                key={varName}
                onClick={() => onInsertVariable(varName)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-slate-200 rounded-md hover:bg-white hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all text-slate-500 bg-slate-50"
              >
                <Plus className="w-3 h-3" />
                {varName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variable Preview */}
      {detectedVariables.length > 0 && Object.values(variables).some(v => v) && (
        <div className="pt-4 border-t border-slate-100 opacity-60 hover:opacity-100 transition-opacity">
          <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-2">Preview</div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 font-mono whitespace-pre-wrap break-words max-h-32 overflow-auto">
            {substituteVariables(template, variables)}
          </div>
        </div>
      )}
    </div>
  )
}

// Substitute variables in template with their values
export function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    return variables[varName] || match
  })
}
