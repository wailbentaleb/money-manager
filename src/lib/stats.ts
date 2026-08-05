import type { Categorie, Depense } from './types'
import { parseIso, ymd } from './format'

export interface PointCumul {
  date: string
  cumul: number
  label: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function moisCourt(d: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d)
}

export function cumulParJour(depenses: Depense[], debut: string, fin: string): PointCumul[] {
  const sommes = new Map<string, number>()
  for (const d of depenses) {
    const cle = d.date.slice(0, 10)
    sommes.set(cle, (sommes.get(cle) ?? 0) + (d.montantConverti ?? 0))
  }
  const points: PointCumul[] = []
  const cur = parseIso(debut)
  const dernier = parseIso(fin)
  let cumul = 0
  while (cur.getTime() <= dernier.getTime()) {
    const cle = ymd(cur)
    cumul += sommes.get(cle) ?? 0
    points.push({
      date: cle,
      cumul: Math.round(cumul * 100) / 100,
      label: `${cur.getDate()} ${moisCourt(cur)}`,
    })
    cur.setDate(cur.getDate() + 1)
  }
  return points
}

export interface SommeCategorie {
  categorie: Categorie
  total: number
}

export function sommeParCategorie(depenses: Depense[]): SommeCategorie[] {
  const map = new Map<Categorie, number>()
  for (const d of depenses) {
    map.set(d.categorie, (map.get(d.categorie) ?? 0) + (d.montantConverti ?? 0))
  }
  return [...map.entries()]
    .map(([categorie, total]) => ({ categorie, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total)
}

export interface BarrePeriode {
  cle: string
  label: string
  total: number
}

export function sommeParPeriode(depenses: Depense[], unite: 'semaine' | 'mois'): BarrePeriode[] {
  const map = new Map<string, number>()
  const labels = new Map<string, string>()
  for (const d of depenses) {
    const date = parseIso(d.date)
    let cle: string
    let label: string
    if (unite === 'semaine') {
      const lundi = new Date(date)
      lundi.setDate(date.getDate() - ((date.getDay() + 6) % 7))
      cle = ymd(lundi)
      label = `${lundi.getDate()} ${moisCourt(lundi)}`
    } else {
      cle = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`
      label = `${moisCourt(date)} ${date.getFullYear()}`
    }
    map.set(cle, (map.get(cle) ?? 0) + (d.montantConverti ?? 0))
    labels.set(cle, label)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cle, total]) => ({ cle, label: labels.get(cle) ?? cle, total: Math.round(total * 100) / 100 }))
}
