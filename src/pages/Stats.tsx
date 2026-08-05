import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { convertir } from '../lib/convert'
import { formatMontant, HEX_CATEGORIE, LABEL_CATEGORIE, styleTooltip, ymd } from '../lib/format'
import { cumulParJour, sommeParCategorie, sommeParPeriode } from '../lib/stats'
import type { Depense } from '../lib/types'

type Periode = 'mois' | 'trimestre' | 'tout' | 'perso'

const PRESETS: Array<{ valeur: Periode; label: string }> = [
  { valeur: 'mois', label: 'Ce mois' },
  { valeur: 'trimestre', label: '3 derniers mois' },
  { valeur: 'tout', label: 'Tout le séjour' },
  { valeur: 'perso', label: 'Personnalisé' },
]

export default function Stats() {
  const { sejour, taux, deviseAffichage } = useApp()
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [periode, setPeriode] = useState<Periode>('mois')
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')
  const [unite, setUnite] = useState<'semaine' | 'mois'>('semaine')

  useEffect(() => {
    if (sejour) api.depenses({ sejourId: sejour.id }).then(setDepenses).catch(() => {})
  }, [sejour?.id])

  const { debut, fin } = useMemo(() => {
    if (!sejour) return { debut: '', fin: '' }
    const auj = new Date()
    if (periode === 'tout') return { debut: sejour.dateDebut, fin: sejour.dateFin }
    if (periode === 'perso') return { debut: du || sejour.dateDebut, fin: au || sejour.dateFin }
    const finIso = sejour.dateFin < ymd(auj) ? sejour.dateFin : ymd(auj)
    if (periode === 'mois') return { debut: ymd(new Date(auj.getFullYear(), auj.getMonth(), 1)), fin: finIso }
    return { debut: ymd(new Date(auj.getFullYear(), auj.getMonth() - 2, 1)), fin: finIso }
  }, [sejour, periode, du, au])

  const filtrees = useMemo(
    () => depenses.filter((d) => d.date.slice(0, 10) >= debut && d.date.slice(0, 10) <= fin),
    [depenses, debut, fin],
  )
  const cumul = useMemo(() => (filtrees.length ? cumulParJour(filtrees, debut, fin) : []), [filtrees, debut, fin])
  const parCat = useMemo(() => sommeParCategorie(filtrees), [filtrees])
  const parPeriode = useMemo(() => sommeParPeriode(filtrees, unite), [filtrees, unite])
  const totalFiltre = useMemo(() => filtrees.reduce((s, d) => s + d.montantConverti, 0), [filtrees])

  if (!sejour) return null
  const aff = (v: number) =>
    formatMontant(convertir(v, sejour.deviseReference, deviseAffichage, taux), deviseAffichage)
  const budget = convertir(sejour.budgetTotal, sejour.deviseReference, deviseAffichage, taux)
  const tickY = (v: unknown) => formatMontant(Number(v), deviseAffichage, 0)

  return (
    <div className="space-y-5">
      <div>
        <p className="etiquette">Graphiques</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Statistiques</h1>
        <p className="mt-1 text-sm text-fade">
          {filtrees.length} dépense{filtrees.length > 1 ? 's' : ''} · total{' '}
          <span className="font-semibold tabular-nums text-encre">{aff(totalFiltre)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.valeur}
            onClick={() => setPeriode(p.valeur)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              periode === p.valeur ? 'bg-indigo-600 text-white' : 'border border-ligne bg-carte text-fade hover:text-encre'
            }`}
          >
            {p.label}
          </button>
        ))}
        {periode === 'perso' && (
          <div className="flex items-center gap-2">
            <input type="date" className="champ w-auto py-1.5" value={du} onChange={(e) => setDu(e.target.value)} />
            <span className="text-fade">→</span>
            <input type="date" className="champ w-auto py-1.5" value={au} onChange={(e) => setAu(e.target.value)} />
          </div>
        )}
      </div>

      <section className="carte p-5">
        <h2 className="text-lg font-bold">Dépenses cumulées vs budget</h2>
        <p className="mb-3 text-xs text-fade">Ligne en pointillés : budget total du séjour.</p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={cumul} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCumul" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--c-ligne)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--c-fade)' }} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--c-fade)' }} tickLine={false} axisLine={false} width={56} tickFormatter={tickY} />
            <Tooltip contentStyle={styleTooltip} formatter={(v) => formatMontant(Number(v), deviseAffichage)} />
            <ReferenceLine
              y={budget}
              stroke="#f59e0b"
              strokeDasharray="6 4"
              label={{ value: 'Budget', fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }}
            />
            <Area type="monotone" dataKey="cumul" stroke="#6366f1" strokeWidth={2} fill="url(#gradCumul)" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="carte p-5">
          <h2 className="text-lg font-bold">Par catégorie</h2>
          {parCat.length === 0 ? (
            <p className="py-10 text-center text-sm text-fade">Aucune donnée sur cette période.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={parCat}
                    dataKey="total"
                    nameKey="categorie"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {parCat.map((c) => (
                      <Cell key={c.categorie} fill={HEX_CATEGORIE[c.categorie]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={styleTooltip} formatter={(v) => formatMontant(Number(v), deviseAffichage)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap gap-2">
                {parCat.map((c) => (
                  <span key={c.categorie} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-2.5 py-1 text-xs font-medium">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: HEX_CATEGORIE[c.categorie] }} />
                    {LABEL_CATEGORIE[c.categorie]}
                    <span className="font-bold tabular-nums">{aff(c.total)}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="carte p-5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Dépenses par période</h2>
            <div className="flex rounded-lg border border-ligne p-0.5 text-xs font-medium">
              <button
                onClick={() => setUnite('semaine')}
                className={`rounded-md px-2.5 py-1 transition ${unite === 'semaine' ? 'bg-indigo-600 text-white' : 'text-fade'}`}
              >
                Semaine
              </button>
              <button
                onClick={() => setUnite('mois')}
                className={`rounded-md px-2.5 py-1 transition ${unite === 'mois' ? 'bg-indigo-600 text-white' : 'text-fade'}`}
              >
                Mois
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={parPeriode} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--c-ligne)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--c-fade)' }} tickLine={false} axisLine={false} minTickGap={14} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--c-fade)' }} tickLine={false} axisLine={false} width={56} tickFormatter={tickY} />
              <Tooltip contentStyle={styleTooltip} formatter={(v) => formatMontant(Number(v), deviseAffichage)} />
              <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  )
}
