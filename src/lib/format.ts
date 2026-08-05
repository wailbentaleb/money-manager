import type { Categorie, Devise } from './types'
import type { CSSProperties } from 'react'

export const SYMBOLE: Record<Devise, string> = { CAD: '$', EUR: '€', DZD: 'DA' }
export const LIBELLE_DEVISE: Record<Devise, string> = {
  CAD: 'Dollar canadien',
  EUR: 'Euro',
  DZD: 'Dinar algérien',
}

export const LABEL_CATEGORIE: Record<Categorie, string> = {
  NOURRITURE: 'Nourriture',
  TRANSPORT: 'Transport',
  LOGEMENT: 'Logement',
  LOISIRS: 'Loisirs',
  FACTURES: 'Factures',
  AUTRE: 'Autre',
}

export const COULEUR_CATEGORIE: Record<Categorie, string> = {
  NOURRITURE: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  TRANSPORT: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  LOGEMENT: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  LOISIRS: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  FACTURES: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  AUTRE: 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
}

export const HEX_CATEGORIE: Record<Categorie, string> = {
  NOURRITURE: '#f59e0b',
  TRANSPORT: '#0ea5e9',
  LOGEMENT: '#8b5cf6',
  LOISIRS: '#ec4899',
  FACTURES: '#14b8a6',
  AUTRE: '#64748b',
}

export const styleTooltip: CSSProperties = {
  backgroundColor: 'var(--c-carte)',
  border: '1px solid var(--c-ligne)',
  borderRadius: '0.75rem',
  color: 'var(--c-encre)',
  fontSize: '0.75rem',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
}

function formateur(devise: Devise, fraction: number): Intl.NumberFormat {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  })
}

export function formatMontant(montant: number, devise: Devise, fraction?: number): string {
  if (!isFinite(montant)) return '—'
  const f = fraction ?? (Math.abs(montant) >= 1000 ? 0 : 2)
  return formateur(devise, f).format(montant)
}

export function formatTaux(montant: number, devise: Devise): string {
  if (!isFinite(montant)) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(montant)
}

export function parseIso(iso: string): Date {
  const [a, m, j] = iso.split('-').map(Number)
  return new Date(a, (m ?? 1) - 1, j ?? 1)
}

export function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function aujourdYmd(): string {
  return ymd(new Date())
}

export function ajouterJours(iso: string, jours: number): string {
  const d = parseIso(iso)
  d.setDate(d.getDate() + jours)
  return ymd(d)
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(parseIso(iso))
}

export function formatDateCourt(iso: string): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(parseIso(iso))
}
