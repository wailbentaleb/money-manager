import { Router } from 'express'
import { prisma } from '../db'
import { getRates, convertir } from '../lib/rates'
import type { Devise } from '../../src/lib/types'

const router = Router()

router.get('/', async (req, res) => {
  const where: Record<string, unknown> = {}
  const sejourId = Number(req.query.sejourId)
  if (sejourId) where.sejourId = sejourId
  if (req.query.statut === 'RENDU' || req.query.statut === 'NON_RENDU') where.statut = req.query.statut
  const dettes = await prisma.argentARendre.findMany({ where, orderBy: [{ dateEcheance: 'desc' }, { id: 'desc' }] })
  res.json(dettes)
})

router.post('/', async (req, res) => {
  const { sejourId, montant, devise, personne, dateEcheance, statut } = req.body ?? {}
  const id = Number(sejourId)
  if (!isFinite(Number(montant)) || Number(montant) <= 0) return res.status(400).json({ error: 'Montant invalide' })
  if (!['CAD', 'EUR', 'DZD'].includes(devise)) return res.status(400).json({ error: 'Devise invalide' })
  if (!String(personne ?? '').trim()) return res.status(400).json({ error: 'Nom de la personne manquant' })
  const sejour = await prisma.sejour.findUnique({ where: { id } })
  if (!sejour) return res.status(404).json({ error: 'Séjour introuvable' })
  const taux = await getRates()
  const montantConverti = convertir(Number(montant), devise as Devise, sejour.deviseReference as Devise, taux.rates)
  const dette = await prisma.argentARendre.create({
    data: {
      sejourId: id,
      montant: Number(montant),
      devise,
      montantConverti,
      deviseRef: sejour.deviseReference,
      personne: String(personne).trim(),
      dateEcheance: dateEcheance ? String(dateEcheance).slice(0, 10) : null,
      statut: statut === 'RENDU' ? 'RENDU' : 'NON_RENDU',
    },
  })
  res.status(201).json(dette)
})

router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existante = await prisma.argentARendre.findUnique({ where: { id } })
  if (!existante) return res.status(404).json({ error: 'Dette introuvable' })
  const { montant, devise, personne, dateEcheance, statut } = req.body ?? {}
  const nouveauMontant = montant !== undefined ? Number(montant) : existante.montant
  const nouvelleDevise = devise ?? existante.devise
  if (!isFinite(nouveauMontant) || nouveauMontant <= 0) return res.status(400).json({ error: 'Montant invalide' })
  if (!['CAD', 'EUR', 'DZD'].includes(nouvelleDevise)) return res.status(400).json({ error: 'Devise invalide' })
  if (personne !== undefined && !String(personne).trim()) return res.status(400).json({ error: 'Nom invalide' })
  const sejour = await prisma.sejour.findUnique({ where: { id: existante.sejourId } })
  if (!sejour) return res.status(404).json({ error: 'Séjour introuvable' })
  const taux = await getRates()
  const montantConverti = convertir(nouveauMontant, nouvelleDevise as Devise, sejour.deviseReference as Devise, taux.rates)
  const dette = await prisma.argentARendre.update({
    where: { id },
    data: {
      montant: nouveauMontant,
      devise: nouvelleDevise,
      montantConverti,
      deviseRef: sejour.deviseReference,
      personne: personne !== undefined ? String(personne).trim() : undefined,
      dateEcheance: dateEcheance === undefined ? undefined : dateEcheance ? String(dateEcheance).slice(0, 10) : null,
      statut: statut === 'RENDU' || statut === 'NON_RENDU' ? statut : undefined,
    },
  })
  res.json(dette)
})

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const existante = await prisma.argentARendre.findUnique({ where: { id } })
  if (!existante) return res.status(404).json({ error: 'Dette introuvable' })
  await prisma.argentARendre.delete({ where: { id } })
  res.status(204).end()
})

export default router
