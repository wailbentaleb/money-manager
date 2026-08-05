import { Router } from 'express'
import { prisma } from '../db'

const router = Router()

router.get('/', async (_req, res) => {
  const sejours = await prisma.sejour.findMany({ orderBy: { id: 'desc' } })
  res.json(sejours)
})

router.post('/', async (req, res) => {
  const { nom, dateDebut, dateFin, budgetTotal, deviseReference } = req.body ?? {}
  if (!nom?.trim() || !dateDebut || !dateFin || !isFinite(Number(budgetTotal)) || Number(budgetTotal) <= 0) {
    return res.status(400).json({ error: 'Champs manquants ou invalides' })
  }
  if (!['CAD', 'EUR', 'DZD'].includes(deviseReference)) {
    return res.status(400).json({ error: 'Devise invalide' })
  }
  if (dateFin <= dateDebut) {
    return res.status(400).json({ error: 'La date de fin doit être après la date de début' })
  }
  const sejour = await prisma.sejour.create({
    data: {
      nom: String(nom).trim(),
      dateDebut,
      dateFin,
      budgetTotal: Number(budgetTotal),
      deviseReference,
    },
  })
  res.status(201).json(sejour)
})

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existant = await prisma.sejour.findUnique({ where: { id } })
  if (!existant) return res.status(404).json({ error: 'Séjour introuvable' })
  const { nom, dateDebut, dateFin, budgetTotal, deviseReference } = req.body ?? {}
  if (nom !== undefined && !String(nom).trim()) return res.status(400).json({ error: 'Nom invalide' })
  if (budgetTotal !== undefined && (!isFinite(Number(budgetTotal)) || Number(budgetTotal) <= 0)) {
    return res.status(400).json({ error: 'Budget invalide' })
  }
  if (deviseReference !== undefined && !['CAD', 'EUR', 'DZD'].includes(deviseReference)) {
    return res.status(400).json({ error: 'Devise invalide' })
  }
  const debut = dateDebut ?? existant.dateDebut
  const fin = dateFin ?? existant.dateFin
  if (fin <= debut) return res.status(400).json({ error: 'La date de fin doit être après la date de début' })
  const sejour = await prisma.sejour.update({
    where: { id },
    data: {
      nom: nom !== undefined ? String(nom).trim() : undefined,
      dateDebut,
      dateFin,
      budgetTotal: budgetTotal !== undefined ? Number(budgetTotal) : undefined,
      deviseReference,
    },
  })
  res.json(sejour)
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existant = await prisma.sejour.findUnique({ where: { id } })
  if (!existant) return res.status(404).json({ error: 'Séjour introuvable' })
  await prisma.sejour.delete({ where: { id } })
  res.status(204).end()
})

export default router
