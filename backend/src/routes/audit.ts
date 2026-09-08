import { Router } from 'express';
import { audit } from '../db/repository.js';

export const auditRouter = Router();

auditRouter.get('/', async (req, res, next) => {
  try {
    res.json(await audit.list(Number(req.query.limit ?? 100)));
  } catch (e) {
    next(e);
  }
});
