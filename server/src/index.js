import express from 'express';
import cors from 'cors';
import { router as api } from './routes.js';
import { router as fhir } from './mockFhir.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true, name: 'cadence-mychart-server' }));
app.use('/api', api);
app.use('/fhir', fhir);

// SMART configuration (very minimal placeholder)
app.get('/.well-known/smart-configuration', (_req, res) => {
  res.json({
    authorization_endpoint: 'http://localhost:4000/oauth/authorize',
    token_endpoint: 'http://localhost:4000/oauth/token',
    capabilities: ['launch-standalone', 'context-ehr-patient', 'permission-patient'],
    scopes_supported: ['patient/Appointment.rs', 'patient/ServiceRequest.r']
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
