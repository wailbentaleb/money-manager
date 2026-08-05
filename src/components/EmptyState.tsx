import type { ReactNode } from 'react'
import { IconRecu } from './icons'

export default function EmptyState({
  titre,
  message,
  action,
}: {
  titre: string
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <IconRecu className="h-10 w-10 text-fade/40" />
      <p className="font-semibold">{titre}</p>
      <p className="max-w-xs text-sm text-fade">{message}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
