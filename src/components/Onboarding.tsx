import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { api } from '../lib/api'
import SejourForm from './SejourForm'
import { IconPlus, IconWallet } from './icons'

export default function Onboarding() {
  const { definirSejour, actualiser } = useApp()
  const [creer, setCreer] = useState(false)

  if (creer) {
    return (
      <div className="mx-auto max-w-md py-8">
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Créer mon séjour</h1>
        <p className="mb-5 text-sm text-fade">Définis tes dates, ton budget et ta devise de référence.</p>
        <div className="carte p-5">
          <SejourForm
            bouton="Créer le séjour"
            onSubmit={async (donnees) => {
              const s = await api.creerSejour(donnees)
              definirSejour(s)
              void actualiser()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-600/15 text-indigo-500">
        <IconWallet className="h-8 w-8" />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Bienvenue !</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fade">
        Crée ton séjour pour définir ton budget, ta devise de référence et tes dates. Tu pourras ensuite suivre
        chaque dépense, tes dettes et ton budget restant, avec conversion automatique entre CAD, EUR et DZD.
      </p>
      <button onClick={() => setCreer(true)} className="btn-primaire mt-6">
        <IconPlus className="h-4 w-4" />
        Créer mon séjour
      </button>
    </div>
  )
}
