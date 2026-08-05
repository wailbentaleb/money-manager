import type { Devise, TauxInfo } from './types'

export function convertir(
  montant: number,
  de: Devise,
  vers: Devise,
  taux: TauxInfo | null,
): number {
  if (!taux || de === vers) return montant
  const tauxDe = taux.rates[de]
  const tauxVers = taux.rates[vers]
  if (!tauxDe || !tauxVers) return montant
  return (montant / tauxDe) * tauxVers
}
