import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'

import { router as api } from './routes.js'      // <-- must exist
import { router as fhir } from './mockFhir.js'   // optional

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())

// serve built client
const clientDist = path.join(__dirname, '../../client/dist')
app.use(express.static(clientDist))

// mount APIs
app.use('/api', api)    // <-- critical
app.use('/fhir', fhir)  // optional

// health
app.get('/health', (_req, res) => res.json({ ok: true }))

// SPA fallback
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))

const PORT = process.env.PORT || 10000
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`))
