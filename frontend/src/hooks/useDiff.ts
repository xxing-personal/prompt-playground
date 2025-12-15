import { useMemo } from 'react'
import { diffLines, Change } from 'diff'

export interface DiffLine {
  content: string
  type: 'added' | 'removed' | 'unchanged'
  lineNumber?: number
}

export interface DiffResult {
  lines: DiffLine[]
  hasChanges: boolean
  addedCount: number
  removedCount: number
}

export function computeDiff(oldText: string, newText: string): DiffResult {
  const changes = diffLines(oldText, newText)
  const lines: DiffLine[] = []
  let addedCount = 0
  let removedCount = 0
  let lineNumber = 1

  changes.forEach((change: Change) => {
    const lineContents = change.value.split('\n')
    // Remove last empty element from split if value ends with newline
    if (lineContents[lineContents.length - 1] === '') {
      lineContents.pop()
    }

    lineContents.forEach((content) => {
      if (change.added) {
        lines.push({ content, type: 'added', lineNumber: lineNumber++ })
        addedCount++
      } else if (change.removed) {
        lines.push({ content, type: 'removed' })
        removedCount++
      } else {
        lines.push({ content, type: 'unchanged', lineNumber: lineNumber++ })
      }
    })
  })

  return {
    lines,
    hasChanges: addedCount > 0 || removedCount > 0,
    addedCount,
    removedCount,
  }
}

export function useDiff(oldText: string, newText: string): DiffResult {
  return useMemo(() => computeDiff(oldText, newText), [oldText, newText])
}
