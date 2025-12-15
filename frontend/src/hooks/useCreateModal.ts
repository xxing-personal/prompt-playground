import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface UseCreateModalOptions<T> {
  queryKey: string[]
  mutationFn: (name: string) => Promise<T>
}

export function useCreateModal<T>({ queryKey, mutationFn }: UseCreateModalOptions<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setIsOpen(false)
      setName('')
    },
  })

  return {
    isOpen,
    name,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    setName,
    create: () => mutation.mutate(name),
    isCreating: mutation.isPending,
  }
}
