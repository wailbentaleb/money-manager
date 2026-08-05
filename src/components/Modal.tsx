import type { ReactNode } from 'react'
import { IconFermer } from './icons'

interface Props {
  ouvert: boolean
  titre: string
  onFermer: () => void
  children: ReactNode
}

export default function Modal({ ouvert, titre, onFermer, children }: Props) {
  if (!ouvert) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onFermer} />
      <div className="relative z-10 max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-ligne bg-carte p-5 pb-8 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:pb-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{titre}</h2>
          <button
            onClick={onFermer}
            className="rounded-lg p-1.5 text-fade transition hover:bg-bg"
            title="Fermer"
          >
            <IconFermer className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
