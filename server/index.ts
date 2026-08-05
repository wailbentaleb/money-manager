import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import sejoursRouter from './routes/sejours'
import depensesRouter from './routes/depenses'
import dettesRouter from './routes/dettes'
import ratesRouter from './routes/rates'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/sejours', sejoursRouter)
app.use('/api/depenses', depensesRouter)
app.use('/api/dettes', dettesRouter)
app.use('/api/rates', ratesRouter)

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

const PORT = Number(process.env.PORT) || 4000
app.listen(PORT, () => {
  console.log(`API prête sur http://localhost:${PORT}`)
})
