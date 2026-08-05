export type Devise = 'CAD' | 'EUR' | 'DZD'
export const DEVISES: Devise[] = ['CAD', 'EUR', 'DZD']

export type Categorie = 'NOURRITURE' | 'TRANSPORT' | 'LOGEMENT' | 'LOISIRS' | 'FACTURES' | 'AUTRE'
export const CATEGORIES: Categorie[] = ['NOURRITURE', 'TRANSPORT', 'LOGEMENT', 'LOISIRS', 'FACTURES', 'AUTRE']

export type StatutDette = 'RENDU' | 'NON_RENDU'

export interface Sejour {
  id: number
  nom: string
  dateDebut: string
  dateFin: string
  budgetTotal: number
  deviseReference: Devise
  createdAt: string
}

export interface Depense {
  id: number
  sejourId: number
  montant: number
  devise: Devise
  montantConverti: number
  deviseRef: Devise
  categorie: Categorie
  description: string
  date: string
  createdAt: string
}

export interface Dette {
  id: number
  sejourId: number
  montant: number
  devise: Devise
  montantConverti: number
  deviseRef: Devise
  personne: string
  dateEcheance: string | null
  statut: StatutDette
  createdAt: string
}

export interface TauxInfo {
  rates: Record<Devise, number>
  date: string | null
  source: 'api' | 'cache' | 'fallback' | 'manuel'
}

export interface DonneesSejour {
  nom: string
  dateDebut: string
  dateFin: string
  budgetTotal: number
  deviseReference: Devise
}

export interface DonneesDepense {
  sejourId: number
  montant: number
  devise: Devise
  categorie: Categorie
  description: string
  date: string
}

export interface DonneesDette {
  sejourId: number
  montant: number
  devise: Devise
  personne: string
  dateEcheance?: string | null
  statut: StatutDette
}
