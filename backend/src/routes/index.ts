import { Router } from 'express';
import { authRouter } from './auth.js';
import { patientsRouter } from './patients.js';
import { findingsRouter } from './findings.js';
import { rulesRouter } from './rules.js';
import { dashboardRouter } from './dashboard.js';
import { auditRouter } from './audit.js';

export const router = Router();

router.use('/auth', authRouter);
router.use('/patients', patientsRouter);
router.use('/findings', findingsRouter);
router.use('/rules', rulesRouter);
router.use('/dashboard', dashboardRouter);
router.use('/audit', auditRouter);
