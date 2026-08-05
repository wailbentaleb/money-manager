import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../lib/api'
import type { Devise, Sejour, TauxInfo } from '../lib/types'

interface ContexteApp {
  sejour: Sejour | null
  taux: TauxInfo | null
  deviseAffichage: Devise
  theme: 'dark' | 'light'
  chargement: boolean
  actualiser: () => Promise<void>
  definirSejour: (s: Sejour | null) => void
  definirDeviseAffichage: (d: Devise) => void
  basculerTheme: () => void
}

const Ctx = createContext<ContexteApp | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [sejour, setSejour] = useState<Sejour | null>(null)
  const [taux, setTaux] = useState<TauxInfo | null>(null)
  const [deviseAffichage, setDeviseAffichage] = useState<Devise>(
    () => (localStorage.getItem('devise-affichage') as Devise) || 'CAD',
  )
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  )
  const [chargement, setChargement] = useState(true)

  const actualiser = useCallback(async () => {
    try {
      const [liste, t] = await Promise.all([api.sejours(), api.taux()])
      setSejour(liste[0] ?? null)
      setTaux(t)
    } catch {
      // erreur silencieuse : l'interface s'affiche sans données
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    void actualiser()
  }, [actualiser])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('devise-affichage', deviseAffichage)
  }, [deviseAffichage])

  return (
    <Ctx.Provider
      value={{
        sejour,
        taux,
        deviseAffichage,
        theme,
        chargement,
        actualiser,
        definirSejour: setSejour,
        definirDeviseAffichage: setDeviseAffichage,
        basculerTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useApp(): ContexteApp {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp doit être utilisé dans AppProvider')
  return ctx
}
