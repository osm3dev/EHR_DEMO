import { Router } from 'express';
import { z } from 'zod';
import { withSchema } from '../db/pool.js';

export const authRouter = Router();

const loginBody = z.object({ email: z.string().email(), password: z.string().min(1) });

/**
 * Prototype auth: verifies the bcrypt hash seeded by db:seed and returns the
 * user profile. A production build would issue a signed session/JWT here.
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginBody.parse(req.body);
    const user = await withSchema(async (c) => {
      const row = (
        await c.query(
          `SELECT u.id, u.name, u.credentials, u.email, r.name AS role, u.facility_id AS "facilityId",
                  (u.password_hash = crypt($2, u.password_hash)) AS ok
           FROM app_user u JOIN role r ON r.id = u.role_id
           WHERE u.email = $1`,
          [email, password],
        )
      ).rows[0];
      return row;
    });
    if (!user || !user.ok) return res.status(401).json({ error: 'invalid_credentials' });
    delete user.ok;
    await withSchema((c) =>
      c.query(`INSERT INTO audit_event(user_id,user_name,role,action,module,entity,details) VALUES ($1,$2,$3,'Signed in','Authentication','Session',$4)`, [
        user.id,
        user.name,
        user.role,
        `${user.name} signed in`,
      ]),
    );
    res.json({ user });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: 'invalid_body', details: e.issues });
    next(e);
  }
});

authRouter.get('/me', async (_req, res) => {
  res.status(501).json({ error: 'not_implemented', message: 'Session handling is out of scope for the prototype.' });
});
