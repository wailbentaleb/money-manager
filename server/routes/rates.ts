import { Router } from 'express'
import { clearRatesManuels, getRates, setRatesManuels } from '../lib/rates'

const router = Router()

router.get('/', async (_req, res) => {
  res.json(await getRates(false))
})

router.post('/refresh', async (_req, res) => {
  res.json(await getRates(true))
})

router.post('/manuel', async (req, res) => {
  const { eurVersCad, cadVersDzd } = req.body ?? {}
  const e = Number(eurVersCad)
  const c = Number(cadVersDzd)
  if (!isFinite(e) || e <= 0 || !isFinite(c) || c <= 0) {
    return res.status(400).json({ error: 'Taux invalides' })
  }
  res.json(await setRatesManuels(e, c))
})

router.post('/auto', async (_req, res) => {
  res.json(await clearRatesManuels())
})

export default router
