import type { Depense, Dette, DonneesDepense, DonneesDette, DonneesSejour, Sejour, StatutDette, TauxInfo } from './types'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const rep = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  if (!rep.ok) {
    let message = `Erreur ${rep.status}`
    try {
      const corps = await rep.json()
      if (corps?.error) message = corps.error
    } catch {
      // réponse non JSON
    }
    throw new Error(message)
  }
  if (rep.status === 204) return undefined as T
  return rep.json() as Promise<T>
}

interface Filtres {
  sejourId?: number
  categorie?: string
  statut?: StatutDette
  du?: string
  au?: string
}

function qs(filtres: Filtres): string {
  const params = new URLSearchParams()
  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur !== undefined && valeur !== '') params.set(cle, String(valeur))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

export const api = {
  sejours: () => req<Sejour[]>('/api/sejours'),
  creerSejour: (d: DonneesSejour) => req<Sejour>('/api/sejours', { method: 'POST', body: JSON.stringify(d) }),
  modifierSejour: (id: number, d: Partial<DonneesSejour>) =>
    req<Sejour>(`/api/sejours/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  supprimerSejour: (id: number) => req<void>(`/api/sejours/${id}`, { method: 'DELETE' }),

  depenses: (filtres: Filtres = {}) => req<Depense[]>(`/api/depenses${qs(filtres)}`),
  creerDepense: (d: DonneesDepense) => req<Depense>('/api/depenses', { method: 'POST', body: JSON.stringify(d) }),
  modifierDepense: (id: number, d: Partial<DonneesDepense>) =>
    req<Depense>(`/api/depenses/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  supprimerDepense: (id: number) => req<void>(`/api/depenses/${id}`, { method: 'DELETE' }),

  dettes: (filtres: Filtres = {}) => req<Dette[]>(`/api/dettes${qs(filtres)}`),
  creerDette: (d: DonneesDette) => req<Dette>('/api/dettes', { method: 'POST', body: JSON.stringify(d) }),
  modifierDette: (id: number, d: Partial<DonneesDette>) =>
    req<Dette>(`/api/dettes/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  supprimerDette: (id: number) => req<void>(`/api/dettes/${id}`, { method: 'DELETE' }),

  taux: () => req<TauxInfo>('/api/rates'),
  actualiserTaux: () => req<TauxInfo>('/api/rates/refresh', { method: 'POST' }),
  tauxManuels: (eurVersCad: number, cadVersDzd: number) =>
    req<TauxInfo>('/api/rates/manuel', { method: 'POST', body: JSON.stringify({ eurVersCad, cadVersDzd }) }),
  tauxAuto: () => req<TauxInfo>('/api/rates/auto', { method: 'POST' }),
}
