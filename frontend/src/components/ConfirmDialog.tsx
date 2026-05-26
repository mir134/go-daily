import Modal from './Modal'
import BigButton from './buttons/BigButton'

interface ConfirmDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-text mb-6 text-lg">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl py-3 text-lg font-bold border border-gray-300 text-text-secondary hover:bg-gray-50 transition-colors"
        >
          {cancelText}
        </button>
        <div className="flex-1">
          <BigButton onClick={onConfirm} variant="danger">
            {confirmText}
          </BigButton>
        </div>
      </div>
    </Modal>
  )
}