import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({ title, children, onClose, width = 520 }: { title: string; children: ReactNode; onClose: () => void; width?: number }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} title="关闭"><X size={18} /></button></header>{children}</section></div>
}
