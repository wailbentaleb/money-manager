import { prisma } from '../db'
import type { Devise } from '../../src/lib/types'

const SUPPORTEES: Devise[] = ['CAD', 'EUR', 'DZD']
const FALLBACK: Record<Devise, number> = { CAD: 1.61, EUR: 1, DZD: 270.48 }

export interface TauxInfo {
  rates: Record<Devise, number>
  date: string | null
  source: 'api' | 'cache' | 'fallback' | 'manuel'
}

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function convertir(
  montant: number,
  de: Devise,
  vers: Devise,
  rates: Record<Devise, number> | null | undefined,
): number {
  if (!rates || de === vers) return montant
  const tauxDe = rates[de]
  const tauxVers = rates[vers]
  if (!tauxDe || !tauxVers) return montant
  return (montant / tauxDe) * tauxVers
}

export async function getRates(force = false): Promise<TauxInfo> {
  const enBase = await prisma.tauxChange.findMany()
  const map = new Map(enBase.map((r) => [r.devise, r]))
  const dateCache = map.get('EUR')?.misAJour ?? null
  const aJour = dateCache !== null && ymd(dateCache) === ymd(new Date())

  const lire = (): Record<Devise, number> => {
    const rates = {} as Record<Devise, number>
    for (const d of SUPPORTEES) rates[d] = map.get(d)?.tauxEUR ?? FALLBACK[d]
    return rates
  }

  if (enBase.length >= 3 && enBase.every((r) => r.manuel)) {
    return { rates: lire(), date: dateCache ? ymd(dateCache) : null, source: 'manuel' }
  }

  if (!force && enBase.length >= 3 && aJour) {
    return { rates: lire(), date: dateCache ? ymd(dateCache) : null, source: 'cache' }
  }

  try {
    const rep = await fetch('https://open.er-api.com/v6/latest/EUR', {
      signal: AbortSignal.timeout(8000),
    })
    if (!rep.ok) throw new Error(`API ${rep.status}`)
    const data = (await rep.json()) as { result?: string; rates?: Record<string, number> }
    if (data.result !== 'success' || !data.rates) throw new Error('Réponse invalide')
    const rates: Record<Devise, number> = {
      CAD: Number(data.rates.CAD),
      EUR: 1,
      DZD: Number(data.rates.DZD),
    }
    if (!isFinite(rates.CAD) || !isFinite(rates.DZD)) throw new Error('Taux manquants')
    const maintenant = new Date()
    await Promise.all(
      SUPPORTEES.map((d) =>
        prisma.tauxChange.upsert({
          where: { devise: d },
          update: { tauxEUR: rates[d], misAJour: maintenant },
          create: { devise: d, tauxEUR: rates[d], misAJour: maintenant },
        }),
      ),
    )
    return { rates, date: ymd(maintenant), source: 'api' }
  } catch {
    if (enBase.length >= 3) {
      return { rates: lire(), date: dateCache ? ymd(dateCache) : null, source: 'cache' }
    }
    return { rates: { ...FALLBACK }, date: null, source: 'fallback' }
  }
}

export async function setRatesManuels(eurVersCad: number, cadVersDzd: number): Promise<TauxInfo> {
  const maintenant = new Date()
  const rates: Record<Devise, number> = {
    EUR: 1,
    CAD: eurVersCad,
    DZD: eurVersCad * cadVersDzd,
  }
  await Promise.all(
    SUPPORTEES.map((d) =>
      prisma.tauxChange.upsert({
        where: { devise: d },
        update: { tauxEUR: rates[d], misAJour: maintenant, manuel: true },
        create: { devise: d, tauxEUR: rates[d], misAJour: maintenant, manuel: true },
      }),
    ),
  )
  return { rates, date: ymd(maintenant), source: 'manuel' }
}

export async function clearRatesManuels(): Promise<TauxInfo> {
  await prisma.tauxChange.updateMany({ data: { manuel: false } })
  return getRates(true)
}
