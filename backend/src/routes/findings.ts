import { Router } from 'express';
import { z } from 'zod';
import { findings } from '../db/repository.js';

export const findingsRouter = Router();

findingsRouter.get('/', async (req, res, next) => {
  try {
    const rows = await findings.list({
      facilityId: req.query.facilityId as string | undefined,
      severity: req.query.severity as string | undefined,
      status: req.query.status as string | undefined,
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

findingsRouter.get('/:id', async (req, res, next) => {
  try {
    const f = await findings.byId(req.params.id);
    if (!f) return res.status(404).json({ error: 'not_found' });
    res.json(f);
  } catch (e) {
    next(e);
  }
});

const transitionBody = z.object({
  status: z.enum(['assigned', 'acknowledged', 'in_progress', 'corrected', 'awaiting_verification', 'closed', 'false_positive', 'accepted_exception']),
  note: z.string().min(1),
  actorId: z.string().uuid().optional(),
  actorName: z.string().optional(),
});

findingsRouter.post('/:id/transition', async (req, res, next) => {
  try {
    const body = transitionBody.parse(req.body);
    const updated = await findings.transition(req.params.id, body.status, { id: body.actorId, name: body.actorName }, body.note);
    res.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: 'invalid_body', details: e.issues });
    next(e);
  }
});
