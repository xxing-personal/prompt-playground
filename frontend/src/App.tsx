import { BrowserRouter, Routes, Route } from 'react-router-dom'
import {
  ProjectsPage,
  ProjectDetailPage,
  UseCaseDetailPage,
  PromptDetailPage,
  EvaluationsPage,
  EvalRunDetailPage,
  DatasetsPage,
  DatasetDetailPage,
  CompareEvalRunsPage,
} from './pages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/use-cases/:useCaseId" element={<UseCaseDetailPage />} />
        <Route path="/use-cases/:useCaseId/datasets" element={<DatasetsPage />} />
        <Route path="/prompts/:promptId" element={<PromptDetailPage />} />
        <Route path="/evaluations" element={<EvaluationsPage />} />
        <Route path="/eval-runs/:runId" element={<EvalRunDetailPage />} />
        <Route path="/datasets/:datasetId" element={<DatasetDetailPage />} />
        <Route path="/compare" element={<CompareEvalRunsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
