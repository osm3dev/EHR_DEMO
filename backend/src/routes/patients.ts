import { Router } from 'express';
import { patients, findings } from '../db/repository.js';

export const patientsRouter = Router();

patientsRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await patients.list());
  } catch (e) {
    next(e);
  }
});

patientsRouter.get('/:id', async (req, res, next) => {
  try {
    const p = await patients.byId(req.params.id);
    if (!p) return res.status(404).json({ error: 'not_found' });
    res.json(p);
  } catch (e) {
    next(e);
  }
});

patientsRouter.get('/:id/findings', async (req, res, next) => {
  try {
    const all = await findings.list();
    res.json(all.filter((f: { patientId: string }) => f.patientId === req.params.id));
  } catch (e) {
    next(e);
  }
});
