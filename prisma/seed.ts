import { PrismaClient } from '@prisma/client'
import type { Categorie, Devise } from '../src/lib/types'
import { getRates, convertir } from '../server/lib/rates'

const prisma = new PrismaClient()

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function decale(jours: number): string {
  const d = new Date()
  d.setDate(d.getDate() + jours)
  return ymd(d)
}

async function main() {
  await prisma.depense.deleteMany()
  await prisma.argentARendre.deleteMany()
  await prisma.sejour.deleteMany()

  const sejour = await prisma.sejour.create({
    data: {
      nom: "Séjour d'études à Montréal",
      dateDebut: decale(-30),
      dateFin: decale(60),
      budgetTotal: 5000,
      deviseReference: 'CAD',
    },
  })

  const taux = await getRates()

  const depenses: Array<{ m: number; d: Devise; c: Categorie; desc: string; j: number }> = [
    { m: 850, d: 'CAD', c: 'LOGEMENT', desc: "Loyer partagé", j: -29 },
    { m: 45.5, d: 'CAD', c: 'NOURRITURE', desc: "Courses d'épicerie", j: -28 },
    { m: 3.5, d: 'EUR', c: 'NOURRITURE', desc: 'Café en terrasse', j: -27 },
    { m: 18, d: 'CAD', c: 'TRANSPORT', desc: 'Métro et bus', j: -26 },
    { m: 60, d: 'CAD', c: 'LOISIRS', desc: 'Cinéma et sortie', j: -25 },
    { m: 2000, d: 'DZD', c: 'NOURRITURE', desc: 'Restaurant algérien', j: -24 },
    { m: 42, d: 'CAD', c: 'FACTURES', desc: 'Forfait téléphone', j: -23 },
    { m: 30, d: 'CAD', c: 'LOISIRS', desc: 'Abonnement gym', j: -21 },
    { m: 12, d: 'EUR', c: 'TRANSPORT', desc: 'Billet de train', j: -19 },
    { m: 55, d: 'CAD', c: 'NOURRITURE', desc: 'Courses hebdo', j: -17 },
    { m: 150, d: 'CAD', c: 'LOISIRS', desc: 'Week-end randonnée', j: -15 },
    { m: 40, d: 'CAD', c: 'FACTURES', desc: 'Internet partagé', j: -12 },
    { m: 85, d: 'CAD', c: 'NOURRITURE', desc: 'Restos de la semaine', j: -10 },
    { m: 23.75, d: 'CAD', c: 'TRANSPORT', desc: 'Essence', j: -8 },
    { m: 3000, d: 'DZD', c: 'LOISIRS', desc: 'Shopping', j: -6 },
    { m: 15, d: 'CAD', c: 'AUTRE', desc: 'Fournitures', j: -4 },
    { m: 95, d: 'CAD', c: 'LOGEMENT', desc: 'Loyer partagé', j: -2 },
    { m: 32, d: 'CAD', c: 'NOURRITURE', desc: "Courses d'épicerie", j: -1 },
  ]

  for (const e of depenses) {
    await prisma.depense.create({
      data: {
        sejourId: sejour.id,
        montant: e.m,
        devise: e.d,
        montantConverti: convertir(e.m, e.d, 'CAD', taux.rates),
        deviseRef: 'CAD',
        categorie: e.c,
        description: e.desc,
        date: decale(e.j),
      },
    })
  }

  await prisma.argentARendre.create({
    data: {
      sejourId: sejour.id,
      montant: 150,
      devise: 'EUR',
      montantConverti: convertir(150, 'EUR', 'CAD', taux.rates),
      deviseRef: 'CAD',
      personne: 'Ahmed',
      dateEcheance: decale(-12),
      statut: 'NON_RENDU',
    },
  })

  await prisma.argentARendre.create({
    data: {
      sejourId: sejour.id,
      montant: 40,
      devise: 'CAD',
      montantConverti: 40,
      deviseRef: 'CAD',
      personne: 'Sophie',
      dateEcheance: decale(-20),
      statut: 'RENDU',
    },
  })

  console.log(`Seed terminé : "${sejour.nom}" (${sejour.dateDebut} → ${sejour.dateFin})`)
}

main().finally(() => prisma.$disconnect())
