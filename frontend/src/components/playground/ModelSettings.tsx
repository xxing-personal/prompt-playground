import { AVAILABLE_MODELS } from '../../constants'

interface ModelSettingsProps {
  model: string
  temperature: number
  maxTokens: number
  onModelChange: (model: string) => void
  onTemperatureChange: (temp: number) => void
  onMaxTokensChange: (tokens: number) => void
}

export function ModelSettings({
  model,
  temperature,
  maxTokens,
  onModelChange,
  onTemperatureChange,
  onMaxTokensChange,
}: ModelSettingsProps) {
  return (
    <div>
      <h2 className="font-medium text-gray-900 mb-4">Model Settings</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperature: {temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Precise</span>
            <span>Creative</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
          <input
            type="number"
            min="1"
            max="4096"
            value={maxTokens}
            onChange={(e) => onMaxTokensChange(parseInt(e.target.value) || 1024)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  )
}
