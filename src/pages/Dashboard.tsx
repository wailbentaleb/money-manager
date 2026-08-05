import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import DepenseRow from '../components/DepenseRow'
import StatCard from '../components/StatCard'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { statsBudget } from '../lib/calc'
import { convertir } from '../lib/convert'
import { DEVISES } from '../lib/types'
import { formatDate, formatMontant, formatTaux, styleTooltip } from '../lib/format'
import { cumulParJour } from '../lib/stats'
import type { Depense, Dette } from '../lib/types'
import { IconPlus, IconRefresh } from '../components/icons'

const ETAT = {
  ok: {
    pastille: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30',
    barre: '#10b981',
    texte: 'En bonne voie',
    message: 'Au rythme actuel, ton budget tiendra jusqu’à la fin du séjour.',
  },
  attention: {
    pastille: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/30',
    barre: '#f59e0b',
    texte: 'Attention',
    message: 'Attention : au rythme actuel, tu vas atteindre la limite de ton budget.',
  },
  danger: {
    pastille: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/30',
    barre: '#ef4444',
    texte: 'Danger',
    message: 'Danger : au rythme actuel, tu dépasseras ton budget.',
  },
} as const

export default function Dashboard() {
  const { sejour, taux, deviseAffichage, actualiser } = useApp()
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [dettes, setDettes] = useState<Dette[]>([])
  const [rafraichitTaux, setRafraichitTaux] = useState(false)

  useEffect(() => {
    if (!sejour) return
    let actif = true
    Promise.all([api.depenses({ sejourId: sejour.id }), api.dettes({ sejourId: sejour.id })])
      .then(([d, det]) => {
        if (actif) {
          setDepenses(d)
          setDettes(det)
        }
      })
      .catch(() => {})
    return () => {
      actif = false
    }
  }, [sejour?.id])

  const stats = useMemo(() => (sejour ? statsBudget(sejour, depenses, dettes) : null), [sejour, depenses, dettes])
  const cumul = useMemo(
    () => (sejour ? cumulParJour(depenses, sejour.dateDebut, sejour.dateFin) : []),
    [depenses, sejour],
  )

  if (!sejour || !stats) return null

  const aff = (v: number) =>
    formatMontant(convertir(v, sejour.deviseReference, deviseAffichage, taux), deviseAffichage)

  const etat = ETAT[stats.statut]

  const rafraichirTaux = async () => {
    setRafraichitTaux(true)
    try {
      await api.actualiserTaux()
      await actualiser()
    } finally {
      setRafraichitTaux(false)
    }
  }

  const resteCouleur = stats.restant < 0 ? 'text-red-500' : stats.statut === 'danger' ? 'text-amber-500' : 'text-emerald-500'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="etiquette">Tableau de bord</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{sejour.nom}</h1>
          <p className="mt-1 text-sm text-fade">
            {formatDate(sejour.dateDebut)} — {formatDate(sejour.dateFin)} · Référence en {sejour.deviseReference}
          </p>
        </div>
        <Link to="/depenses" className="btn-primaire">
          <IconPlus className="h-4 w-4" />
          Ajouter une dépense
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard titre="Budget total" valeur={aff(sejour.budgetTotal)} accent="text-indigo-500" />
        <StatCard
          titre="Dépensé"
          valeur={aff(stats.depenseTotal)}
          sous={`${stats.pctDepense.toFixed(1)} % du budget`}
        />
        <StatCard
          titre="Budget restant"
          valeur={aff(stats.restant)}
          accent={resteCouleur}
          sous={`dettes à rendre : ${aff(stats.detteRestante)}`}
        />
        <StatCard
          titre="Jours restants"
          valeur={String(stats.joursRestants)}
          accent="text-sky-500"
          sous={`${stats.joursEcoules} écoulés sur ${stats.joursTotal}`}
        />
      </div>

      <section className="carte p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Détecteur de budget</h2>
            <p className="mt-0.5 text-sm text-fade">{etat.message}</p>
          </div>
          <span className={`pastille ${etat.pastille}`}>
            <span className="h-2 w-2 rounded-full" style={{ background: etat.barre }} />
            {etat.texte}
          </span>
        </div>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-fade">
            <span>Progression</span>
            <span className="tabular-nums">{stats.pctDepense.toFixed(1)} %</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ligne">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.pctDepense)}%`, background: etat.barre }}
            />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-bg p-3.5">
            <p className="etiquette">Moyenne / jour</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{aff(stats.moyenneParJour)}</p>
          </div>
          <div className="rounded-xl bg-bg p-3.5">
            <p className="etiquette">Projection fin de séjour</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{aff(stats.projection)}</p>
            <p className="mt-0.5 text-xs text-fade">au rythme actuel</p>
          </div>
          <div className="rounded-xl bg-bg p-3.5">
            <p className="etiquette">Recommandé / jour</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{aff(stats.recommandeParJour)}</p>
            <p className="mt-0.5 text-xs text-fade">pour chaque jour restant</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-5">
        <section className="carte p-5 md:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Taux de change</h2>
            <button onClick={rafraichirTaux} className="btn-secondaire px-2.5 py-1.5" title="Mettre à jour les taux">
              <IconRefresh className={`h-4 w-4 ${rafraichitTaux ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="space-y-2.5">
            {DEVISES.filter((d) => d !== sejour.deviseReference).map((d) => (
              <div key={d} className="flex items-center justify-between rounded-xl bg-bg px-3.5 py-2.5">
                <span className="text-sm font-medium">1 {sejour.deviseReference}</span>
                <span className="text-sm font-bold tabular-nums">
                  = {formatTaux(convertir(1, sejour.deviseReference, d, taux), d)}
                </span>
              </div>
            ))}
          </div>
          {taux && (
            <p className="mt-3 text-xs text-fade">
              {taux.source === 'api' && 'Taux en direct'}
              {taux.source === 'cache' && 'Taux mis en cache'}
              {taux.source === 'fallback' && 'Taux estimés (hors ligne)'}
              {taux.source === 'manuel' && 'Taux manuels (modifiables dans les paramètres)'}
              {taux.date ? ` · ${formatDate(taux.date)}` : ''}
            </p>
          )}
        </section>

        <section className="carte p-5 md:col-span-3">
          <h2 className="mb-2 text-lg font-bold">Évolution des dépenses</h2>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={cumul} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCumul" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--c-ligne)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--c-fade)' }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--c-fade)' }}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v) => formatMontant(Number(v), deviseAffichage, 0)}
              />
              <Tooltip contentStyle={styleTooltip} formatter={(v) => formatMontant(Number(v), deviseAffichage)} />
              <Area type="monotone" dataKey="cumul" stroke="#6366f1" strokeWidth={2} fill="url(#gradCumul)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="carte p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-bold">Dernières dépenses</h2>
          <Link to="/depenses" className="text-sm font-semibold text-indigo-500 hover:underline">
            Tout voir
          </Link>
        </div>
        {depenses.length === 0 ? (
          <p className="py-8 text-center text-sm text-fade">Aucune dépense enregistrée pour le moment.</p>
        ) : (
          <ul className="divide-y divide-ligne">
            {depenses.slice(0, 5).map((d) => (
              <DepenseRow key={d.id} d={d} aff={aff} deviseAffichage={deviseAffichage} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
