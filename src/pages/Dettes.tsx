import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Modal from '../components/Modal'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import { convertir } from '../lib/convert'
import { formatDate, formatMontant } from '../lib/format'
import { DEVISES } from '../lib/types'
import type { Dette, Devise, StatutDette } from '../lib/types'
import { IconEdit, IconPlus, IconTrash } from '../components/icons'

interface Formulaire {
  personne: string
  montant: string
  devise: Devise
  dateEcheance: string
  statut: StatutDette
}

export default function Dettes() {
  const { sejour, taux, deviseAffichage } = useApp()
  const [liste, setListe] = useState<Dette[]>([])
  const [filtre, setFiltre] = useState<'TOUTES' | StatutDette>('TOUTES')
  const [modalOuverte, setModalOuverte] = useState(false)
  const [edition, setEdition] = useState<Dette | null>(null)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    if (!sejour) return
    try {
      setListe(await api.dettes({ sejourId: sejour.id }))
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur')
    }
  }, [sejour?.id])

  useEffect(() => {
    void charger()
  }, [charger])

  const totals = useMemo(() => {
    let nonRendu = 0
    let rendu = 0
    for (const d of liste) {
      if (d.statut === 'NON_RENDU') nonRendu += d.montantConverti
      else rendu += d.montantConverti
    }
    return { nonRendu, rendu }
  }, [liste])

  const visibles = useMemo(
    () => (filtre === 'TOUTES' ? liste : liste.filter((d) => d.statut === filtre)),
    [liste, filtre],
  )

  if (!sejour) return null
  const aff = (v: number) =>
    formatMontant(convertir(v, sejour.deviseReference, deviseAffichage, taux), deviseAffichage)

  const basculerStatut = async (d: Dette) => {
    await api.modifierDette(d.id, { statut: d.statut === 'RENDU' ? 'NON_RENDU' : 'RENDU' })
    await charger()
  }

  const supprimer = async (d: Dette) => {
    if (!window.confirm(`Supprimer la dette envers ${d.personne} ?`)) return
    await api.supprimerDette(d.id)
    await charger()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="etiquette">Argent à rendre</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Dettes</h1>
          <p className="mt-1 text-sm text-fade">
            Déduites de ton budget disponible tant qu'elles ne sont pas remboursées.
          </p>
        </div>
        <button
          onClick={() => {
            setEdition(null)
            setModalOuverte(true)
          }}
          className="btn-primaire"
        >
          <IconPlus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="carte p-4">
          <p className="etiquette">Non remboursé</p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-amber-500">{aff(totals.nonRendu)}</p>
          <p className="mt-1 text-xs text-fade">{liste.filter((d) => d.statut === 'NON_RENDU').length} dette(s)</p>
        </div>
        <div className="carte p-4">
          <p className="etiquette">Remboursé</p>
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-emerald-500">{aff(totals.rendu)}</p>
          <p className="mt-1 text-xs text-fade">{liste.filter((d) => d.statut === 'RENDU').length} dette(s)</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['TOUTES', 'NON_RENDU', 'RENDU'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              filtre === f
                ? 'bg-indigo-600 text-white'
                : 'border border-ligne bg-carte text-fade hover:text-encre'
            }`}
          >
            {f === 'TOUTES' ? 'Toutes' : f === 'RENDU' ? 'Remboursées' : 'À rendre'}
          </button>
        ))}
      </div>

      {erreur && <p className="text-sm font-medium text-red-500">{erreur}</p>}

      <section className="carte px-5 py-1">
        {visibles.length === 0 ? (
          <p className="py-8 text-center text-sm text-fade">Aucune dette à afficher.</p>
        ) : (
          <ul className="divide-y divide-ligne">
            {visibles.map((d) => (
              <li key={d.id} className="flex items-center gap-3 py-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                    d.statut === 'RENDU'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}
                >
                  {d.personne.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.personne}</p>
                  <p className="text-xs text-fade">
                    Échéance : {formatDate(d.dateEcheance)}
                    {d.devise !== deviseAffichage && (
                      <>
                        {' '}· <span className="tabular-nums">{formatMontant(d.montant, d.devise)}</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold tabular-nums ${d.statut === 'RENDU' ? 'text-emerald-500 line-through' : ''}`}>
                    {aff(d.montantConverti)}
                  </p>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      d.statut === 'RENDU'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}
                  >
                    {d.statut === 'RENDU' ? 'Remboursé' : 'À rendre'}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => void basculerStatut(d)}
                    title={d.statut === 'RENDU' ? 'Repasser à non remboursé' : 'Marquer comme remboursé'}
                    className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition ${d.statut === 'RENDU' ? 'bg-emerald-500' : 'bg-ligne'}`}
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${d.statut === 'RENDU' ? 'translate-x-5' : ''}`}
                    />
                  </button>
                  <button
                    onClick={() => {
                      setEdition(d)
                      setModalOuverte(true)
                    }}
                    className="rounded-lg p-1.5 text-fade transition hover:bg-bg"
                    title="Modifier"
                  >
                    <IconEdit className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => void supprimer(d)}
                    className="rounded-lg p-1.5 text-fade transition hover:bg-red-500/10 hover:text-red-500"
                    title="Supprimer"
                  >
                    <IconTrash className="h-4.5 w-4.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        ouvert={modalOuverte}
        titre={edition ? 'Modifier la dette' : 'Ajouter une dette'}
        onFermer={() => setModalOuverte(false)}
      >
        <FormulaireDette
          initial={
            edition
              ? {
                  personne: edition.personne,
                  montant: String(edition.montant),
                  devise: edition.devise,
                  dateEcheance: edition.dateEcheance?.slice(0, 10) ?? '',
                  statut: edition.statut,
                }
              : { personne: '', montant: '', devise: sejour.deviseReference, dateEcheance: '', statut: 'NON_RENDU' }
          }
          onSubmit={async (donnees) => {
            const payload = {
              sejourId: sejour.id,
              montant: Number(donnees.montant),
              devise: donnees.devise,
              personne: donnees.personne,
              dateEcheance: donnees.dateEcheance || null,
              statut: donnees.statut,
            }
            if (edition) await api.modifierDette(edition.id, payload)
            else await api.creerDette(payload)
            setModalOuverte(false)
            await charger()
          }}
        />
      </Modal>
    </div>
  )
}

function FormulaireDette({
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
    if (!form.personne.trim()) return setErreur('Indique à qui tu dois cet argent.')
    if (!isFinite(m) || m <= 0) return setErreur('Montant invalide.')
    setErreur('')
    setEnvoi(true)
    try {
      await onSubmit({ ...form, personne: form.personne.trim() })
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={envoyer} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">À qui ?</label>
        <input
          className="champ"
          value={form.personne}
          onChange={(e) => maj('personne', e.target.value)}
          placeholder="Ex : Ahmed"
          autoFocus
        />
      </div>
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
            placeholder="150"
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
        <label className="mb-1.5 block text-sm font-medium">Date d'échéance (optionnel)</label>
        <input type="date" className="champ" value={form.dateEcheance} onChange={(e) => maj('dateEcheance', e.target.value)} />
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.statut === 'RENDU'}
          onChange={(e) => maj('statut', e.target.checked ? 'RENDU' : 'NON_RENDU')}
          className="h-4.5 w-4.5 accent-emerald-500"
        />
        Déjà remboursé
      </label>
      {erreur && <p className="text-sm font-medium text-red-500">{erreur}</p>}
      <button type="submit" disabled={envoi} className="btn-primaire w-full">
        {envoi ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
