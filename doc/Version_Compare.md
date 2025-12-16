# Version Compare Feature

## Overview

The Version Compare feature allows users to compare two prompt versions side-by-side, viewing both template differences and output comparisons.

## Features

### 1. Template Diff View
- Side-by-side text diff using `react-diff-viewer-continued`
- Word-level change highlighting (additions in green, deletions in red)
- Line numbers and gutter indicators
- Support for both text and chat message templates

### 2. Output Comparison View
- Run two versions with the same model and settings
- Side-by-side output display with latency metrics
- Configurable settings panel:
  - Model selector (OpenAI, Anthropic, Google models)
  - Temperature slider (0-2)
  - Max tokens input
  - Auto-detected template variables with input fields
- Error handling for failed runs

### 3. UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| `VersionDiffModal` | `frontend/src/components/prompt-editor/` | Main modal with tabbed interface |
| `VersionOutputComparison` | `frontend/src/components/prompt-editor/` | Output comparison tab content |
| `DiffHeader` | `frontend/src/components/prompt-editor/` | Version info header |
| `DiffStats` | `frontend/src/components/prompt-editor/` | Diff statistics footer |

### 4. Backend API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/playground/run-versions` | POST | Run multiple versions in parallel |

## How to Use

1. Open a prompt in the Prompt Detail page
2. Click the version selector dropdown (e.g., "v 5")
3. Click **"diff"** next to any version (not the currently selected one)
4. The Version Diff Modal opens with two tabs:
   - **Template Diff**: Shows text differences between versions
   - **Output Comparison**: Run both versions and compare outputs

### Output Comparison Steps

1. Switch to the **"Output Comparison"** tab
2. Click **"Settings"** to expand the configuration panel
3. Select a model and adjust parameters
4. Fill in any required template variables
5. Click **"Run Both Versions"**
6. View side-by-side outputs with latency metrics

## Architecture

```
VersionDiffModal
├── DiffHeader (version info cards)
├── Tab Navigation (Template Diff | Output Comparison)
├── Template Diff Tab
│   ├── ReactDiffViewer
│   └── DiffStats
└── Output Comparison Tab
    └── VersionOutputComparison
        ├── Settings Panel (collapsible)
        │   ├── Model Selector
        │   ├── Temperature/MaxTokens
        │   └── Variable Inputs
        └── Results Grid (side-by-side)
```

## Implementation Details

### State Preservation
Both tabs are rendered simultaneously but hidden with CSS (`hidden` class) to preserve state when switching tabs. This ensures:
- Settings are preserved when switching tabs
- Run results are preserved when switching tabs
- Running state is preserved if switching mid-execution

### Multi-Version Run API
The `/playground/run-versions` endpoint:
1. Fetches all version data sequentially (avoids SQLAlchemy concurrent session issues)
2. Runs LLM calls in parallel using `asyncio.gather`
3. Returns results with version info and metrics

## Future Improvements

- [ ] Add "Previous/Next Change" navigation buttons for long diffs
- [ ] Add diff output comparison (compare the outputs themselves)
- [ ] Support running with different models per version
- [ ] Add export functionality for comparison results
- [ ] Keyboard shortcuts for tab switching

---
*Last updated: December 2024*
