import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import { Breadcrumbs } from '../components/layout/Breadcrumbs'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import {
  DiffEditorPane,
  ChatTemplateEditor,
  VersionSelector,
  EvalModal,
  VariableSidePanel,
  MultiModelSelector,
  ResultsComparisonTable,
  RunHistoryPanel,
  createDefaultModelConfigs,
  type ModelConfig,
} from '../components/playground'
import { useSavePlaygroundRun, type RunHistoryEntry } from '../hooks/usePlaygroundRuns'
import { VersionDiffModal } from '../components/prompt-editor'
import {
  usePrompt,
  usePromptVersions,
  useCreateVersion,
  useDatasets,
  useCreateEvalRun,
  useUpdatePrompt,
  usePromoteVersion,
  useDemoteVersion,
  useMultiModelRun,
  useUseCase,
} from '../hooks'
import { TagEditor } from '../components/shared'

export function PromptDetailPage() {
  const { promptId } = useParams<{ promptId: string }>()

  // State
  const [promptType, setPromptType] = useState<'text' | 'chat'>('text')
  const [template, setTemplate] = useState('')
  const [baseTemplate, setBaseTemplate] = useState('')
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'system', content: '' },
    { role: 'user', content: '' },
  ])
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [showEvalModal, setShowEvalModal] = useState(false)
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [showDiff, setShowDiff] = useState(false)
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null)

  // Multi-model state
  const [selectedModels, setSelectedModels] = useState<ModelConfig[]>(createDefaultModelConfigs())

  // Multi-model execution hook
  const { isRunning, runningModels, resultsArray, runMultiModel, clearResults, setResults } = useMultiModelRun()

  // Queries
  const { data: prompt } = usePrompt(promptId)
  const { data: useCase } = useUseCase(prompt?.use_case_id)
  const { data: versions } = usePromptVersions(promptId)
  const { data: datasets } = useDatasets(prompt?.use_case_id)
  const createVersionMutation = useCreateVersion(promptId)
  const createEvalMutation = useCreateEvalRun()
  const updatePromptMutation = useUpdatePrompt(promptId)
  const promoteVersionMutation = usePromoteVersion(promptId)
  const demoteVersionMutation = useDemoteVersion(promptId)

  // Load latest version when versions are fetched
  useEffect(() => {
    if (versions?.items && versions.items.length > 0 && !selectedVersionId) {
      const latestVersion = versions.items[0]
      setSelectedVersionId(latestVersion.id)
      if (!hasUnsavedChanges) {
        setPromptType(latestVersion.type || 'text')
        const templateText = latestVersion.template_text || ''
        setTemplate(templateText)
        setBaseTemplate(templateText)
        if (latestVersion.template_messages) {
          setMessages(latestVersion.template_messages)
        }
      }
    }
  }, [versions, hasUnsavedChanges, selectedVersionId])

  const handleSelectVersion = (versionId: string) => {
    const version = versions?.items.find((v) => v.id === versionId)
    if (version) {
      setSelectedVersionId(versionId)
      setPromptType(version.type || 'text')
      const templateText = version.template_text || ''
      setTemplate(templateText)
      setBaseTemplate(templateText)
      if (version.template_messages) {
        setMessages(version.template_messages)
      }
      setHasUnsavedChanges(false)
      setShowVersions(false)
      clearResults()
    }
  }

  const handleTemplateChange = (newTemplate: string) => {
    setTemplate(newTemplate)
    setHasUnsavedChanges(true)
  }

  const handleMessagesChange = (newMessages: { role: string; content: string }[]) => {
    setMessages(newMessages)
    setHasUnsavedChanges(true)
  }

  const handleVariableChange = (key: string, value: string) => {
    setVariables({ ...variables, [key]: value })
  }

  const handleInsertVariable = (varName: string) => {
    const insertion = `{{${varName}}}`
    setTemplate((prev) => prev + insertion)
    setHasUnsavedChanges(true)
  }

  const handleSaveVersion = async () => {
    if (promptType === 'text' && !template.trim()) return
    if (promptType === 'chat' && messages.every((m) => !m.content.trim())) return

    await createVersionMutation.mutateAsync({
      type: promptType,
      template_text: promptType === 'text' ? template : undefined,
      template_messages: promptType === 'chat' ? messages : undefined,
      commit_message: `Version saved at ${new Date().toLocaleString()}`,
    })
    setBaseTemplate(template)
    setHasUnsavedChanges(false)
  }

  const saveRunMutation = useSavePlaygroundRun()

  const handleRunMulti = async () => {
    const enabledModels = selectedModels.filter((m) => m.enabled)
    if (enabledModels.length === 0) return

    await runMultiModel({
      templateType: promptType,
      templateText: promptType === 'text' ? template : undefined,
      templateMessages: promptType === 'chat' ? messages : undefined,
      variables,
      models: enabledModels,
      onComplete: (params, results) => {
        if (promptId) {
          saveRunMutation.mutate({
            promptId,
            versionId: selectedVersionId || undefined,
            config: {
              templateType: params.templateType,
              templateText: params.templateText,
              templateMessages: params.templateMessages,
              variables: params.variables,
              models: params.models,
            },
            results,
          })
        }
      },
    })
  }

  const handleLoadRun = (entry: RunHistoryEntry) => {
    // Restore configuration
    setPromptType(entry.config.templateType)
    if (entry.config.templateText !== undefined) {
      setTemplate(entry.config.templateText)
    }
    if (entry.config.templateMessages) {
      setMessages(entry.config.templateMessages)
    }
    setVariables(entry.config.variables)
    setSelectedModels(entry.config.models)
    // Restore results
    if (entry.results && entry.results.length > 0) {
      setResults(entry.results)
    }
  }

  const handleCreateEvalRun = async () => {
    if (!selectedVersionId || !selectedDatasetId) return
    const firstModel = selectedModels.find((m) => m.enabled)
    if (!firstModel) return

    try {
      const response = await createEvalMutation.mutateAsync({
        prompt_version_id: selectedVersionId,
        dataset_id: selectedDatasetId,
        models: selectedModels
          .filter((m) => m.enabled)
          .map((m) => ({ model: m.model, temperature: m.temperature, max_tokens: m.maxTokens })),
      })
      setShowEvalModal(false)
      window.location.href = `/eval-runs/${response.data.id}`
    } catch {
      // Error is handled by mutation's error state
    }
  }

  const selectedVersion = versions?.items.find((v) => v.id === selectedVersionId)
  const enabledModelCount = selectedModels.filter((m) => m.enabled).length
  const canRun =
    enabledModelCount > 0 && (promptType === 'text' ? !!template.trim() : messages.some((m) => m.content.trim()))

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Studio Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Breadcrumbs
            items={[
              { label: 'Projects', href: '/' },
              ...(useCase ? [{ label: useCase.name, href: `/use-cases/${useCase.id}`, className: 'hidden sm:block max-w-[12rem] truncate' }] : []),
              { label: prompt?.name || '' }
            ]}
          />
          {prompt?.tags && (
            <div className="h-4 w-px bg-slate-200 mx-2" />
          )}
          <TagEditor
            tags={prompt?.tags || []}
            onChange={(tags) => updatePromptMutation.mutate({ tags })}
            disabled={updatePromptMutation.isPending}
            variant="minimal"
          />
        </div>

        <div className="flex items-center gap-2">
          <VersionSelector
            versions={versions?.items || []}
            selectedId={selectedVersionId}
            isOpen={showVersions}
            onToggle={() => setShowVersions(!showVersions)}
            onSelect={handleSelectVersion}
            onCompare={(id) => {
              setCompareVersionId(id)
              setShowDiff(true)
            }}
            onPromote={(versionNumber, label) => promoteVersionMutation.mutate({ versionNumber, label })}
            onDemote={(versionNumber, label) => demoteVersionMutation.mutate({ versionNumber, label })}
          />
          <Button
            onClick={handleSaveVersion}
            disabled={createVersionMutation.isPending || (promptType === 'text' && !template.trim()) || !hasUnsavedChanges}
            variant={hasUnsavedChanges ? 'primary' : 'secondary'}
            size="sm"
          >
            {createVersionMutation.isPending ? 'Saving...' : hasUnsavedChanges ? 'Save Version' : 'Saved'}
          </Button>
          <Button
            onClick={() => setShowEvalModal(true)}
            disabled={!selectedVersionId || hasUnsavedChanges}
            variant="secondary"
            size="sm"
          >
            Run Evaluation
          </Button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Canvas (Editor + Results) */}
        <main className="flex-1 overflow-auto p-6 min-w-0">
          <div className="max-w-5xl mx-auto space-y-6">
            <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
              <div className="border-b border-slate-100 bg-white p-2 flex items-center justify-between">
                {/* Editor Toolbar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">Type:</span>
                  <div className="flex bg-slate-100 rounded p-0.5">
                    <button
                      onClick={() => setPromptType('text')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all ${promptType === 'text' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setPromptType('chat')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all ${promptType === 'chat' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      Chat
                    </button>
                  </div>
                </div>
                {hasUnsavedChanges && (
                  <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                    Unsaved changes
                  </span>
                )}
              </div>

              {promptType === 'text' ? (
                <div className="border-b border-slate-100">
                  <DiffEditorPane
                    baseText={baseTemplate}
                    currentText={template}
                    onChange={handleTemplateChange}
                    placeholder="Enter your prompt template... Use {{variable}} for variables"
                    highlightVariables={true}
                  />
                </div>
              ) : (
                <div className="p-4 border-b border-slate-100">
                  <ChatTemplateEditor
                    messages={messages}
                    variables={variables}
                    onChange={handleMessagesChange}
                    onVariableChange={handleVariableChange}
                  />
                </div>
              )}

              {/* Action Bar */}
              <div className="p-3 bg-slate-50 flex justify-end">
                <Button onClick={handleRunMulti} disabled={isRunning || !canRun} className="w-full sm:w-auto">
                  {isRunning ? `Running ${runningModels.size} model(s)...` : `Run ${enabledModelCount} Model(s)`}
                </Button>
              </div>
            </Card>

            {/* Results */}
            <ResultsComparisonTable
              results={resultsArray}
              isRunning={isRunning}
              runningModels={runningModels}
            />

            {/* Run History */}
            {selectedVersionId && (
              <RunHistoryPanel
                versionId={selectedVersionId}
                onLoadRun={handleLoadRun}
              />
            )}
          </div>
        </main>

        {/* Right: Tools Panel */}
        <aside className="w-80 border-l border-slate-200 bg-white overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 space-y-6">
            {/* Variables */}
            <section>
              <VariableSidePanel
                template={promptType === 'text' ? template : messages.map((m) => m.content).join('\n')}
                variables={variables}
                onVariableChange={handleVariableChange}
                onInsertVariable={promptType === 'text' ? handleInsertVariable : undefined}
              />
            </section>

            <div className="h-px bg-slate-100" />

            {/* Models */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-900">Models</h3>
                <span className="text-xs text-slate-500">{enabledModelCount} selected</span>
              </div>
              <MultiModelSelector selectedModels={selectedModels} onChange={setSelectedModels} />
            </section>
          </div>
        </aside>
      </div>

      {/* Version Diff Modal */}
      <VersionDiffModal
        isOpen={showDiff}
        onClose={() => setShowDiff(false)}
        oldVersion={versions?.items.find((v) => v.id === compareVersionId) || null}
        newVersion={selectedVersion || null}
        variables={variables}
        model={selectedModels.find((m) => m.enabled)?.model || 'openai/gpt-4o'}
        temperature={selectedModels.find((m) => m.enabled)?.temperature || 0.7}
        maxTokens={selectedModels.find((m) => m.enabled)?.maxTokens || 1024}
      />

      {/* Evaluation Modal */}
      <EvalModal
        isOpen={showEvalModal}
        onClose={() => setShowEvalModal(false)}
        promptName={prompt?.name || ''}
        versionNumber={selectedVersion?.version_number || 0}
        useCaseId={prompt?.use_case_id || ''}
        datasets={datasets?.items || []}
        selectedDatasetId={selectedDatasetId}
        onDatasetChange={setSelectedDatasetId}
        model={selectedModels.find((m) => m.enabled)?.model || 'gpt-4o-mini'}
        temperature={selectedModels.find((m) => m.enabled)?.temperature || 0.7}
        maxTokens={selectedModels.find((m) => m.enabled)?.maxTokens || 1024}
        onSubmit={handleCreateEvalRun}
        isSubmitting={createEvalMutation.isPending}
      />
    </div>
  )
}
