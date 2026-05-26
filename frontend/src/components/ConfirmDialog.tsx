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
      <p className="text-text dark:!text-slate-200 mb-6 text-lg">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl py-3 text-lg font-bold border border-gray-300 dark:border-slate-600 text-text-secondary dark:!text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
