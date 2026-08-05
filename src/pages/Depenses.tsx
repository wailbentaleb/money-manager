import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import DepenseRow from '../components/DepenseRow'
import Modal from '../components/Modal'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { convertir } from '../lib/convert'
import { aujourdYmd, formatMontant } from '../lib/format'
import { CATEGORIES, DEVISES } from '../lib/types'
import type { Categorie, Depense, Devise, DonneesDepense } from '../lib/types'
import { IconPlus } from '../components/icons'

interface Formulaire {
  montant: string
  devise: Devise
  categorie: Categorie
  description: string
  date: string
}

export default function Depenses() {
  const { sejour, taux, deviseAffichage } = useApp()
  const [liste, setListe] = useState<Depense[]>([])
  const [filtreCat, setFiltreCat] = useState('')
  const [du, setDu] = useState('')
  const [au, setAu] = useState('')
  const [modalOuverte, setModalOuverte] = useState(false)
  const [edition, setEdition] = useState<Depense | null>(null)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    if (!sejour) return
    try {
      const data = await api.depenses({
        sejourId: sejour.id,
        categorie: filtreCat || undefined,
        du: du || undefined,
        au: au || undefined,
      })
      setListe(data)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur')
    }
  }, [sejour?.id, filtreCat, du, au])

  useEffect(() => {
    void charger()
  }, [charger])

  const totalFiltre = useMemo(() => liste.reduce((s, d) => s + d.montantConverti, 0), [liste])

  if (!sejour) return null
  const aff = (v: number) =>
    formatMontant(convertir(v, sejour.deviseReference, deviseAffichage, taux), deviseAffichage)

  const ouvrirAjout = () => {
    setEdition(null)
    setModalOuverte(true)
  }

  const ouvrirEdition = (d: Depense) => {
    setEdition(d)
    setModalOuverte(true)
  }

  const supprimer = async (d: Depense) => {
    if (!window.confirm(`Supprimer cette dépense (${d.description || 'sans description'}) ?`)) return
    await api.supprimerDepense(d.id)
    await charger()
  }

  const filtresActifs = filtreCat || du || au

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="etiquette">Historique</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Dépenses</h1>
          <p className="mt-1 text-sm text-fade">
            {liste.length} dépense{liste.length > 1 ? 's' : ''} · total{' '}
            <span className="font-semibold tabular-nums text-encre">{aff(totalFiltre)}</span>
          </p>
        </div>
        <button onClick={ouvrirAjout} className="btn-primaire">
          <IconPlus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="carte flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-36 flex-1">
          <label className="mb-1 block text-xs font-medium text-fade">Catégorie</label>
          <select className="champ" value={filtreCat} onChange={(e) => setFiltreCat(e.target.value)}>
            <option value="">Toutes</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fade">Du</label>
          <input type="date" className="champ w-auto" value={du} onChange={(e) => setDu(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fade">Au</label>
          <input type="date" className="champ w-auto" value={au} onChange={(e) => setAu(e.target.value)} />
        </div>
        {filtresActifs && (
          <button
            onClick={() => {
              setFiltreCat('')
              setDu('')
              setAu('')
            }}
            className="btn-secondaire"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {erreur && <p className="text-sm font-medium text-red-500">{erreur}</p>}

      <section className="carte px-5 py-1">
        {liste.length === 0 ? (
          <p className="py-8 text-center text-sm text-fade">
            Aucune dépense{du || au ? ' sur cette période' : ''} pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-ligne">
            {liste.map((d) => (
              <DepenseRow
                key={d.id}
                d={d}
                aff={aff}
                deviseAffichage={deviseAffichage}
                onModifier={() => ouvrirEdition(d)}
                onSupprimer={() => void supprimer(d)}
              />
            ))}
          </ul>
        )}
      </section>

      <Modal ouvert={modalOuverte} titre={edition ? 'Modifier la dépense' : 'Ajouter une dépense'} onFermer={() => setModalOuverte(false)}>
        <FormulaireDepense
          initial={
            edition
              ? {
                  montant: String(edition.montant),
                  devise: edition.devise,
                  categorie: edition.categorie,
                  description: edition.description,
                  date: edition.date.slice(0, 10),
                }
              : { montant: '', devise: sejour.deviseReference, categorie: 'AUTRE', description: '', date: aujourdYmd() }
          }
          onSubmit={async (donnees) => {
            const payload: DonneesDepense = { ...donnees, montant: Number(donnees.montant), sejourId: sejour.id }
            if (edition) await api.modifierDepense(edition.id, payload)
            else await api.creerDepense(payload)
            setModalOuverte(false)
            await charger()
          }}
        />
      </Modal>
    </div>
  )
}

function FormulaireDepense({
  initial,
  onSubmit,
}: {
  initial: Formulaire
  onSubmit: (f: Formulaire) => Promise<void>
}) {
  const [form, setForm] = useState<Formulaire>(initial)
  const [erreur, setErreur] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const maj = (champ: keyof Formulaire, valeur: string) => setForm((f) => ({ ...f, [champ]: valeur }))

  const envoyer = async (e: FormEvent) => {
    e.preventDefault()
    const m = Number(form.montant)
    if (!isFinite(m) || m <= 0) return setErreur('Montant invalide.')
    if (!form.date) return setErreur('Choisis une date.')
    setErreur('')
    setEnvoi(true)
    try {
      await onSubmit({ ...form, montant: form.montant })
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={envoyer} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Montant</label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            className="champ"
            value={form.montant}
            onChange={(e) => maj('montant', e.target.value)}
            placeholder="25,00"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Devise</label>
          <select className="champ" value={form.devise} onChange={(e) => maj('devise', e.target.value)}>
            {DEVISES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Catégorie</label>
        <select className="champ" value={form.categorie} onChange={(e) => maj('categorie', e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Description</label>
        <input
          className="champ"
          value={form.description}
          onChange={(e) => maj('description', e.target.value)}
          placeholder="Ex : Courses d'épicerie"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Date</label>
        <input type="date" className="champ" value={form.date} onChange={(e) => maj('date', e.target.value)} />
      </div>
      {erreur && <p className="text-sm font-medium text-red-500">{erreur}</p>}
      <button type="submit" disabled={envoi} className="btn-primaire w-full">
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
