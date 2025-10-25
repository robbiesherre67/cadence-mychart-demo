import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import { router as api } from './routes.js'
import { router as fhir } from './mockFhir.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

const clientDist = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDist))

app.use('/api', api)
app.use('/fhir', fhir)

app.get('/health', (_req, res) => res.json({ ok: true }))

app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

const PORT = process.env.PORT || 10000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
