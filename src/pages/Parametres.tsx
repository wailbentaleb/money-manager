import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SejourForm from '../components/SejourForm'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { convertir } from '../lib/convert'
import { formatDate, formatTaux, LIBELLE_DEVISE, SYMBOLE } from '../lib/format'
import { DEVISES } from '../lib/types'
import type { Devise } from '../lib/types'
import { IconLune, IconRefresh, IconSoleil, IconTrash } from '../components/icons'

function arrondi4(n: number): string {
  return String(Math.round(n * 10000) / 10000)
}

function numerique(valeur: string): number {
  return Number(valeur.replace(',', '.'))
}

export default function Parametres() {
  const { sejour, taux, deviseAffichage, definirDeviseAffichage, theme, basculerTheme, definirSejour, actualiser } =
    useApp()
  const navigate = useNavigate()
  const [erreur, setErreur] = useState('')
  const [rafraichitTaux, setRafraichitTaux] = useState(false)
  const [eurCad, setEurCad] = useState(taux ? arrondi4(taux.rates.CAD) : '1.61')
  const [cadDzd, setCadDzd] = useState(taux ? arrondi4(taux.rates.DZD / taux.rates.CAD) : '168')
  const [enregistreTaux, setEnregistreTaux] = useState(false)
  const [tauxErreur, setTauxErreur] = useState('')

  if (!sejour) return null

  const autresDevises = DEVISES.filter((d) => d !== sejour.deviseReference)

  const supprimer = async () => {
    if (!window.confirm('Supprimer ce séjour et toutes ses données ? Cette action est irréversible.')) return
    await api.supprimerSejour(sejour.id)
    definirSejour(null)
    navigate('/')
  }

  const rafraichirTaux = async () => {
    setRafraichitTaux(true)
    try {
      await api.actualiserTaux()
      await actualiser()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setRafraichitTaux(false)
    }
  }

  const appliquerTauxManuels = async () => {
    const e = numerique(eurCad)
    const c = numerique(cadDzd)
    if (!isFinite(e) || e <= 0 || !isFinite(c) || c <= 0) return setTauxErreur('Taux invalides.')
    setTauxErreur('')
    setEnregistreTaux(true)
    try {
      await api.tauxManuels(e, c)
      await actualiser()
    } catch (e) {
      setTauxErreur(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setEnregistreTaux(false)
    }
  }

  const revenirTauxAuto = async () => {
    setEnregistreTaux(true)
    try {
      await api.tauxAuto()
      await actualiser()
    } catch (e) {
      setTauxErreur(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setEnregistreTaux(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="etiquette">Configuration</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Paramètres</h1>
      </div>

      <section className="carte p-5">
        <h2 className="mb-4 text-lg font-bold">Mon séjour</h2>
        <SejourForm
          initial={sejour}
          bouton="Enregistrer"
          onSubmit={async (donnees) => {
            const s = await api.modifierSejour(sejour.id, donnees)
            definirSejour(s)
            void actualiser()
          }}
        />
      </section>

      <section className="carte p-5">
        <h2 className="mb-4 text-lg font-bold">Affichage</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Devise d'affichage globale</label>
            <p className="mb-2 text-xs text-fade">Tous les montants affichés sont convertis dans cette devise.</p>
            <div className="flex flex-wrap gap-2">
              {DEVISES.map((d) => (
                <button
                  key={d}
                  onClick={() => definirDeviseAffichage(d)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    deviseAffichage === d
                      ? 'bg-indigo-600 text-white'
                      : 'border border-ligne bg-bg text-fade hover:text-encre'
                  }`}
                >
                  {d} · {SYMBOLE[d]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Thème</p>
              <p className="text-xs text-fade">{theme === 'dark' ? 'Sombre (par défaut)' : 'Clair'}</p>
            </div>
            <button onClick={basculerTheme} className="btn-secondaire">
              {theme === 'dark' ? <IconSoleil className="h-4 w-4" /> : <IconLune className="h-4 w-4" />}
              {theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
            </button>
          </div>
        </div>
      </section>

      <section className="carte p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Taux de change</h2>
            <p className="text-xs text-fade">
              Référence : {sejour.deviseReference} ({LIBELLE_DEVISE[sejour.deviseReference]})
            </p>
          </div>
          <button onClick={rafraichirTaux} className="btn-secondaire px-2.5 py-1.5" title="Mettre à jour">
            <IconRefresh className={`h-4 w-4 ${rafraichitTaux ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="space-y-2.5">
          {autresDevises.map((d) => (
            <div key={d} className="flex items-center justify-between rounded-xl bg-bg px-3.5 py-2.5">
              <span className="text-sm font-medium">
                1 {sejour.deviseReference} <span className="text-fade">=</span>
              </span>
              <span className="text-sm font-bold tabular-nums">
                {formatTaux(convertir(1, sejour.deviseReference, d, taux), d)}
              </span>
            </div>
          ))}
          <p className="text-xs text-fade">
            {taux?.source === 'api' && 'Taux en direct (open.er-api.com)'}
            {taux?.source === 'cache' && 'Taux mis en cache localement (hors-ligne possible)'}
            {taux?.source === 'fallback' && 'Taux estimés : connexion indisponible'}
            {taux?.source === 'manuel' && 'Taux manuels en cours d’utilisation'}
            {taux?.date ? ` · dernière mise à jour le ${formatDate(taux.date)}` : ''}
          </p>
        </div>
      </section>

      <section className="carte p-5">
        <h2 className="text-lg font-bold">Taux manuels</h2>
        <p className="mt-0.5 text-sm text-fade">
          Si les taux automatiques ne correspondent pas à la réalité (ex : marché parallèle), saisis les tiens ici.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">1 EUR =</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                className="champ"
                value={eurCad}
                onChange={(e) => setEurCad(e.target.value)}
                placeholder="1.61"
              />
              <span className="shrink-0 text-sm font-medium text-fade">CAD</span>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">1 CAD =</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                className="champ"
                value={cadDzd}
                onChange={(e) => setCadDzd(e.target.value)}
                placeholder="168"
              />
              <span className="shrink-0 text-sm font-medium text-fade">DZD</span>
            </div>
          </div>
        </div>
        {tauxErreur && <p className="mt-2 text-sm font-medium text-red-500">{tauxErreur}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => void appliquerTauxManuels()} disabled={enregistreTaux} className="btn-primaire">
            {enregistreTaux ? 'Enregistrement…' : 'Utiliser ces taux'}
          </button>
          <button onClick={() => void revenirTauxAuto()} disabled={enregistreTaux} className="btn-secondaire">
            Revenir aux taux automatiques
          </button>
        </div>
      </section>

      {erreur && <p className="text-sm font-medium text-red-500">{erreur}</p>}

      <section className="carte border-red-500/30 p-5">
        <h2 className="mb-1 text-lg font-bold text-red-500">Zone de danger</h2>
        <p className="mb-4 text-xs text-fade">Supprime le séjour et toutes ses dépenses et dettes.</p>
        <button onClick={() => void supprimer()} className="btn-secondaire border-red-500/40 text-red-500 hover:bg-red-500/10">
          <IconTrash className="h-4 w-4" />
          Supprimer le séjour
        </button>
      </section>
    </div>
  )
}
