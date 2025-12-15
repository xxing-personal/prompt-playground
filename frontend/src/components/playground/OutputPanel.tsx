import { BarChart3 } from 'lucide-react'
import { Button } from '../ui/Button'

interface OutputPanelProps {
  output: string
  isRunning: boolean
  onRunEval: () => void
  canRunEval: boolean
}

export function OutputPanel({ output, isRunning, onRunEval, canRunEval }: OutputPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-medium text-gray-900">Output</h2>
        <Button
          variant="secondary"
          onClick={onRunEval}
          disabled={!canRunEval}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Run Evaluation
        </Button>
      </div>
      <div className="w-full min-h-32 max-h-96 p-3 bg-gray-50 border border-gray-200 rounded-lg overflow-auto">
        <pre className="text-sm text-gray-800 whitespace-pre-wrap">
          {isRunning ? 'Running...' : output || 'Run the prompt to see output...'}
        </pre>
      </div>
    </div>
  )
}
