import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface CreateModalProps {
  isOpen: boolean
  title: string
  inputLabel: string
  inputPlaceholder: string
  name: string
  isCreating: boolean
  close: () => void
  setName: (name: string) => void
  create: () => void
}

export function CreateModal({
  isOpen,
  title,
  inputLabel,
  inputPlaceholder,
  name,
  isCreating,
  close,
  setName,
  create,
}: CreateModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button onClick={create} disabled={!name || isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </>
      }
    >
      <Input
        label={inputLabel}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={inputPlaceholder}
      />
    </Modal>
  )
}
