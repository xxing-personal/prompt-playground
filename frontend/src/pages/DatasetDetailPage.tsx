import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus } from 'lucide-react'
import { datasetsApi } from '../services/api'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'

export function DatasetDetailPage() {
  const { datasetId } = useParams<{ datasetId: string }>()
  const [showAddItem, setShowAddItem] = useState(false)
  const [newInput, setNewInput] = useState('{}')
  const [newExpected, setNewExpected] = useState('')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const { data: dataset } = useQuery({
    queryKey: ['dataset', datasetId],
    queryFn: () => datasetsApi.get(datasetId!).then(r => r.data),
    enabled: !!datasetId,
  })

  const { data: items } = useQuery({
    queryKey: ['datasetItems', datasetId],
    queryFn: () => datasetsApi.listItems(datasetId!).then(r => r.data),
    enabled: !!datasetId,
  })

  const addItemMutation = useMutation({
    mutationFn: (data: { input: Record<string, unknown>; expected_output?: string }) =>
      datasetsApi.createItem(datasetId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasetItems', datasetId] })
      setShowAddItem(false)
      setNewInput('{}')
      setNewExpected('')
      setError('')
    },
    onError: (e) => {
      setError(String(e))
    },
  })

  const handleAddItem = () => {
    setError('')
    try {
      const input = JSON.parse(newInput) as Record<string, unknown>
      addItemMutation.mutate({
        input,
        expected_output: newExpected || undefined,
      })
    } catch {
      setError('Invalid JSON for input')
    }
  }

  const handleCloseModal = () => {
    setShowAddItem(false)
    setError('')
  }

  return (
    <Layout>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-gray-900">Projects</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">{dataset?.name || 'Dataset'}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{dataset?.name}</h1>
        <Button onClick={() => setShowAddItem(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      <Card>
        {items?.items && items.items.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-gray-700">Input</th>
                <th className="text-left py-3 px-3 font-medium text-gray-700">Expected Output</th>
                <th className="text-left py-3 px-3 font-medium text-gray-700">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3 max-w-xs truncate font-mono text-xs">
                    {JSON.stringify(item.input)}
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate font-mono text-xs">
                    {item.expected_output ? String(item.expected_output) : '-'}
                  </td>
                  <td className="py-3 px-3 text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No items yet. Click "Add Item" to create one.
          </div>
        )}
      </Card>

      <Modal
        isOpen={showAddItem}
        onClose={handleCloseModal}
        title="Add Dataset Item"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
              {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input (JSON)
            </label>
            <textarea
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
              className="w-full h-24 p-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder='{"text": "Your input here"}'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Output (optional)
            </label>
            <textarea
              value={newExpected}
              onChange={(e) => setNewExpected(e.target.value)}
              className="w-full h-24 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Expected result..."
            />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
