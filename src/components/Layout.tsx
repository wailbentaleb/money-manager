import { NavLink, Outlet } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { SYMBOLE } from '../lib/format'
import type { Devise } from '../lib/types'
import { DEVISES } from '../lib/types'
import Onboarding from './Onboarding'
import {
  IconAccueil,
  IconGear,
  IconLune,
  IconRecu,
  IconRefresh,
  IconSoleil,
  IconStat,
  IconUser,
  IconWallet,
} from './icons'

const nav = [
  { to: '/', label: 'Accueil', icone: IconAccueil },
  { to: '/depenses', label: 'Dépenses', icone: IconRecu },
  { to: '/dettes', label: 'À rendre', icone: IconUser },
  { to: '/stats', label: 'Stats', icone: IconStat },
  { to: '/reglages', label: 'Réglages', icone: IconGear },
]

export default function Layout() {
  const { sejour, deviseAffichage, definirDeviseAffichage, theme, basculerTheme, chargement } = useApp()

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-ligne bg-carte/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
          <NavLink to="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white">
              <IconWallet className="h-4.5 w-4.5" />
            </span>
            <span className="hidden sm:block">Budget Séjour</span>
          </NavLink>
          <nav className="ml-2 hidden flex-1 items-center gap-1 md:flex">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-fade hover:bg-bg hover:text-encre'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={deviseAffichage}
              onChange={(e) => definirDeviseAffichage(e.target.value as Devise)}
              title="Devise d'affichage"
              className="champ w-auto py-1.5 text-sm"
            >
              {DEVISES.map((d) => (
                <option key={d} value={d}>
                  {d} · {SYMBOLE[d]}
                </option>
              ))}
            </select>
            <button
              onClick={basculerTheme}
              className="btn-secondaire px-2.5 py-1.5"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            >
              {theme === 'dark' ? <IconSoleil className="h-4.5 w-4.5" /> : <IconLune className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 md:pb-16">
        {chargement ? (
          <div className="grid min-h-[60vh] place-items-center">
            <IconRefresh className="h-8 w-8 animate-spin text-fade" />
          </div>
        ) : sejour ? (
          <Outlet />
        ) : (
          <Onboarding />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ligne bg-carte/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {nav.map(({ to, label, icone: Icone }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                  isActive ? 'text-indigo-500' : 'text-fade'
                }`
              }
            >
              <Icone className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
