import { Router } from 'express';
import { rules } from '../db/repository.js';

export const rulesRouter = Router();

rulesRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await rules.list());
  } catch (e) {
    next(e);
  }
});

rulesRouter.get('/:id', async (req, res, next) => {
  try {
    const r = await rules.byId(req.params.id);
    if (!r) return res.status(404).json({ error: 'not_found' });
    res.json(r);
  } catch (e) {
    next(e);
  }
});
