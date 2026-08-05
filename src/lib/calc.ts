import type { Depense, Dette, Sejour } from './types'
import { ymd } from './format'

const JOUR = 86400000

export type StatutBudget = 'ok' | 'attention' | 'danger'

export interface StatsBudget {
  joursTotal: number
  joursEcoules: number
  joursRestants: number
  depenseTotal: number
  detteRestante: number
  restant: number
  moyenneParJour: number
  projection: number
  recommandeParJour: number
  pctDepense: number
  statut: StatutBudget
}

export function statsBudget(sejour: Sejour, depenses: Depense[], dettes: Dette[]): StatsBudget {
  const debut = Date.parse(`${sejour.dateDebut}T00:00:00`)
  const fin = Date.parse(`${sejour.dateFin}T00:00:00`)
  const aujourd = Date.parse(`${ymd(new Date())}T00:00:00`)

  const joursTotal = Math.max(1, Math.round((fin - debut) / JOUR) + 1)
  const joursEcoules = Math.min(joursTotal, Math.max(0, Math.floor((aujourd - debut) / JOUR) + 1))
  const joursRestants = Math.max(0, joursTotal - joursEcoules)

  const depenseTotal = depenses.reduce((s, d) => s + (d.montantConverti ?? 0), 0)
  const detteRestante = dettes
    .filter((d) => d.statut === 'NON_RENDU')
    .reduce((s, d) => s + (d.montantConverti ?? 0), 0)

  const restant = sejour.budgetTotal - depenseTotal - detteRestante
  const moyenneParJour = joursEcoules > 0 ? depenseTotal / joursEcoules : 0
  const projection = moyenneParJour * joursTotal
  const recommandeParJour = joursRestants > 0 ? Math.max(0, restant) / joursRestants : 0
  const pctDepense = sejour.budgetTotal > 0 ? (depenseTotal / sejour.budgetTotal) * 100 : 0

  const ratioProjection = sejour.budgetTotal > 0 ? projection / sejour.budgetTotal : 0
  const statut: StatutBudget =
    restant < 0 || ratioProjection > 1 ? 'danger' : ratioProjection > 0.9 ? 'attention' : 'ok'

  return {
    joursTotal,
    joursEcoules,
    joursRestants,
    depenseTotal,
    detteRestante,
    restant,
    moyenneParJour,
    projection,
    recommandeParJour,
    pctDepense,
    statut,
  }
}
