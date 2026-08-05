import { COULEUR_CATEGORIE, LABEL_CATEGORIE, formatDateCourt, formatMontant } from '../lib/format'
import type { Depense, Devise } from '../lib/types'
import { IconEdit, IconTrash } from './icons'

interface Props {
  d: Depense
  aff: (v: number) => string
  deviseAffichage: Devise
  onModifier?: () => void
  onSupprimer?: () => void
}

export default function DepenseRow({ d, aff, deviseAffichage, onModifier, onSupprimer }: Props) {
  const lettre = (d.description || LABEL_CATEGORIE[d.categorie]).charAt(0).toUpperCase()
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${COULEUR_CATEGORIE[d.categorie]}`}
      >
        {lettre}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{d.description || LABEL_CATEGORIE[d.categorie]}</p>
        <p className="text-xs text-fade">
          {LABEL_CATEGORIE[d.categorie]} · {formatDateCourt(d.date)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold tabular-nums">{aff(d.montantConverti)}</p>
        {d.devise !== deviseAffichage && (
          <p className="text-xs tabular-nums text-fade">{formatMontant(d.montant, d.devise)}</p>
        )}
      </div>
      {(onModifier || onSupprimer) && (
        <div className="flex shrink-0 gap-0.5">
          {onModifier && (
            <button onClick={onModifier} className="rounded-lg p-1.5 text-fade transition hover:bg-bg" title="Modifier">
              <IconEdit className="h-4.5 w-4.5" />
            </button>
          )}
          {onSupprimer && (
            <button
              onClick={onSupprimer}
              className="rounded-lg p-1.5 text-fade transition hover:bg-red-500/10 hover:text-red-500"
              title="Supprimer"
            >
              <IconTrash className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      )}
    </li>
  )
}
