import { Router } from 'express';
import { dashboard } from '../db/repository.js';

export const dashboardRouter = Router();

dashboardRouter.get('/kpis', async (_req, res, next) => {
  try {
    res.json(await dashboard.kpis());
  } catch (e) {
    next(e);
  }
});

dashboardRouter.get('/facilities', async (_req, res, next) => {
  try {
    res.json(await dashboard.facilityOverview());
  } catch (e) {
    next(e);
  }
});
