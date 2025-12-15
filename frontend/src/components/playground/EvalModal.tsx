import { Link } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { AVAILABLE_MODELS } from '../../constants'

interface Dataset {
  id: string
  name: string
  item_count?: number
}

interface EvalModalProps {
  isOpen: boolean
  onClose: () => void
  promptName: string
  versionNumber: number
  useCaseId: string
  datasets: Dataset[]
  selectedDatasetId: string
  onDatasetChange: (id: string) => void
  model: string
  temperature: number
  maxTokens: number
  onSubmit: () => void
  isSubmitting: boolean
}

export function EvalModal({
  isOpen,
  onClose,
  promptName,
  versionNumber,
  useCaseId,
  datasets,
  selectedDatasetId,
  onDatasetChange,
  model,
  temperature,
  maxTokens,
  onSubmit,
  isSubmitting,
}: EvalModalProps) {
  const modelInfo = AVAILABLE_MODELS.find(m => m.id === model)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Run Evaluation"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !selectedDatasetId}
          >
            {isSubmitting ? 'Starting...' : 'Start Evaluation'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prompt Version
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            Version {versionNumber} - {promptName}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dataset
          </label>
          {datasets.length === 0 ? (
            <div className="text-sm text-gray-500">
              No datasets available.{' '}
              <Link to={`/use-cases/${useCaseId}/datasets`} className="text-blue-600 hover:underline">
                Create one first
              </Link>.
            </div>
          ) : (
            <select
              value={selectedDatasetId}
              onChange={(e) => onDatasetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a dataset...</option>
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.item_count || 0} items)
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            {modelInfo?.name || model} (temp: {temperature}, max: {maxTokens})
          </div>
          <p className="text-xs text-gray-500 mt-1">Uses current model settings from the playground</p>
        </div>
      </div>
    </Modal>
  )
}
