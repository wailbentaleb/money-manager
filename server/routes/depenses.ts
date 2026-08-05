import { Router } from 'express'
import { prisma } from '../db'
import { getRates, convertir } from '../lib/rates'
import type { Devise } from '../../src/lib/types'

const router = Router()
const CATEGORIES = ['NOURRITURE', 'TRANSPORT', 'LOGEMENT', 'LOISIRS', 'FACTURES', 'AUTRE']

router.get('/', async (req, res) => {
  const where: Record<string, unknown> = {}
  const sejourId = Number(req.query.sejourId)
  if (sejourId) where.sejourId = sejourId
  if (req.query.categorie && CATEGORIES.includes(String(req.query.categorie))) {
    where.categorie = req.query.categorie
  }
  const plage: Record<string, string> = {}
  if (req.query.du) plage.gte = String(req.query.du)
  if (req.query.au) plage.lte = String(req.query.au)
  if (Object.keys(plage).length) where.date = plage
  const depenses = await prisma.depense.findMany({ where, orderBy: [{ date: 'desc' }, { id: 'desc' }] })
  res.json(depenses)
})

router.post('/', async (req, res) => {
  const { sejourId, montant, devise, categorie, description, date } = req.body ?? {}
  const id = Number(sejourId)
  if (!isFinite(Number(montant)) || Number(montant) <= 0) return res.status(400).json({ error: 'Montant invalide' })
  if (!['CAD', 'EUR', 'DZD'].includes(devise)) return res.status(400).json({ error: 'Devise invalide' })
  if (!CATEGORIES.includes(categorie)) return res.status(400).json({ error: 'Catégorie invalide' })
  if (!date) return res.status(400).json({ error: 'Date manquante' })
  const sejour = await prisma.sejour.findUnique({ where: { id } })
  if (!sejour) return res.status(404).json({ error: 'Séjour introuvable' })
  const taux = await getRates()
  const montantConverti = convertir(Number(montant), devise as Devise, sejour.deviseReference as Devise, taux.rates)
  const depense = await prisma.depense.create({
    data: {
      sejourId: id,
      montant: Number(montant),
      devise,
      montantConverti,
      deviseRef: sejour.deviseReference,
      categorie,
      description: String(description ?? ''),
      date: String(date).slice(0, 10),
    },
  })
  res.status(201).json(depense)
})

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existante = await prisma.depense.findUnique({ where: { id } })
  if (!existante) return res.status(404).json({ error: 'Dépense introuvable' })
  const { montant, devise, categorie, description, date } = req.body ?? {}
  const nouveauMontant = montant !== undefined ? Number(montant) : existante.montant
  const nouvelleDevise = devise ?? existante.devise
  if (!isFinite(nouveauMontant) || nouveauMontant <= 0) return res.status(400).json({ error: 'Montant invalide' })
  if (!['CAD', 'EUR', 'DZD'].includes(nouvelleDevise)) return res.status(400).json({ error: 'Devise invalide' })
  if (categorie !== undefined && !CATEGORIES.includes(categorie)) return res.status(400).json({ error: 'Catégorie invalide' })
  const sejour = await prisma.sejour.findUnique({ where: { id: existante.sejourId } })
  if (!sejour) return res.status(404).json({ error: 'Séjour introuvable' })
  const taux = await getRates()
  const montantConverti = convertir(nouveauMontant, nouvelleDevise as Devise, sejour.deviseReference as Devise, taux.rates)
  const depense = await prisma.depense.update({
    where: { id },
    data: {
      montant: nouveauMontant,
      devise: nouvelleDevise,
      montantConverti,
      deviseRef: sejour.deviseReference,
      categorie: categorie ?? undefined,
      description: description !== undefined ? String(description) : undefined,
      date: date !== undefined ? String(date).slice(0, 10) : undefined,
    },
  })
  res.json(depense)
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existante = await prisma.depense.findUnique({ where: { id } })
  if (!existante) return res.status(404).json({ error: 'Dépense introuvable' })
  await prisma.depense.delete({ where: { id } })
  res.status(204).end()
})

export default router
