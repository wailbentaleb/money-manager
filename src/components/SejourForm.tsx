import { useState } from 'react'
import type { FormEvent } from 'react'
import { ajouterJours, aujourdYmd } from '../lib/format'
import type { Devise, DonneesSejour, Sejour } from '../lib/types'
import { DEVISES } from '../lib/types'

interface Props {
  initial?: Sejour
  onSubmit: (donnees: DonneesSejour) => Promise<void>
  onCancel?: () => void
  bouton?: string
}

export default function SejourForm({ initial, onSubmit, onCancel, bouton = 'Enregistrer' }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [dateDebut, setDateDebut] = useState(initial?.dateDebut ?? aujourdYmd())
  const [dateFin, setDateFin] = useState(initial?.dateFin ?? ajouterJours(aujourdYmd(), 60))
  const [budget, setBudget] = useState(initial ? String(initial.budgetTotal) : '')
  const [devise, setDevise] = useState<Devise>(initial?.deviseReference ?? 'CAD')
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)

  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    const b = Number(budget)
    if (!nom.trim()) return setErreur('Donne un nom à ton séjour.')
    if (!dateDebut || !dateFin) return setErreur('Renseigne les deux dates.')
    if (dateFin <= dateDebut) return setErreur('La date de fin doit être après le début.')
    if (!isFinite(b) || b <= 0) return setErreur('Le budget doit être un montant positif.')
    setErreur('')
    setEnvoi(true)
    try {
      await onSubmit({ nom: nom.trim(), dateDebut, dateFin, budgetTotal: b, deviseReference: devise })
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={envoyer} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Nom du séjour</label>
        <input
          className="champ"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Séjour d'études à Montréal"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Date de début</label>
          <input type="date" className="champ" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Date de fin</label>
          <input type="date" className="champ" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Budget total</label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="champ"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="5000"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Devise de référence</label>
          <select className="champ" value={devise} onChange={(e) => setDevise(e.target.value as Devise)}>
            {DEVISES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
      {erreur && <p className="text-sm font-medium text-red-500">{erreur}</p>}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondaire flex-1">
            Annuler
          </button>
        )}
        <button type="submit" disabled={envoi} className="btn-primaire flex-1">
          {envoi ? 'Enregistrement…' : bouton}
        </button>
      </div>
    </form>
  )
}
