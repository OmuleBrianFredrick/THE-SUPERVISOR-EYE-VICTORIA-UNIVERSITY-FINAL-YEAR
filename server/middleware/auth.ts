import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase.js';
import { db } from '../db/index.js';
import { users, roles, departments } from '../db/schema.js';
import { eq } from 'drizzle-orm';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      dbUser?: any;
      role?: any;
    }
  }
}

export const verifyFirebaseTokenOnly = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    if (!auth) throw new Error("Firebase Admin not configured.");
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    if (!auth) throw new Error("Firebase Admin not configured.");
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;

    let result = await db.select({
      user: users,
      role: roles,
      department: departments
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .leftJoin(departments, eq(users.departmentId, departments.id))
    .where(eq(users.firebaseUid, decodedToken.uid))
    .limit(1);

    if (!result.length && decodedToken.email) {
      const emailResult = await db.select({
        user: users,
        role: roles,
        department: departments
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .where(eq(users.email, decodedToken.email))
      .limit(1);

      if (emailResult.length) {
        await db.update(users)
          .set({ firebaseUid: decodedToken.uid })
          .where(eq(users.id, emailResult[0].user.id));
        result = emailResult;
        console.log(`Linked existing user ${decodedToken.email} to Firebase UID ${decodedToken.uid}`);
      }
    }

    if (!result.length && decodedToken.email === 'christianekarel@gmail.com') {
      try {
        let adminRole = await db.select().from(roles).where(eq(roles.name, 'SUPER_ADMIN')).limit(1);
        if (!adminRole.length) {
           const newRole = await db.insert(roles).values({ name: 'SUPER_ADMIN', permissions: { all: true } }).returning();
           adminRole = newRole;
        }
        if (adminRole.length) {
          const newUser = await db.insert(users).values({
            firebaseUid: decodedToken.uid,
            email: decodedToken.email,
            firstName: 'Christian',
            lastName: 'E.',
            roleId: adminRole[0].id,
            status: 'ACTIVE',
            onboardingComplete: true,
          }).returning();
          result = [{
            user: newUser[0],
            role: adminRole[0],
            department: null as any
          }];
        }
      } catch (err) {
        console.error("Error creating SUPER_ADMIN account", err);
      }
    }

    if (!result.length) {
      if (req.originalUrl.includes('/api/v1/auth/me')) {
        res.json({ onboardingComplete: false });
        return;
      }
      res.status(404).json({ error: 'User not mapped' });
      return;
    }

    const { user, role, department } = result[0];

    // Status checks
    if (user.status === 'PENDING_APPROVAL') {
      res.status(403).json({ error: 'Forbidden: Account pending approval', status: user.status });
      return;
    }
    if (user.status === 'REJECTED') {
      res.status(403).json({ error: 'Forbidden: Account rejected', status: user.status });
      return;
    }
    if (user.status !== 'ACTIVE') {
      res.status(403).json({ error: 'Forbidden: Account is inactive', status: user.status });
      return;
    }

    req.dbUser = { ...user, role, department };
    req.role = role;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role) {
      res.status(403).json({ error: 'Forbidden: No role context' });
      return;
    }
    
    const hasRole = allowedRoles.some(
      role => role.toLowerCase() === req.role.name.toLowerCase()
    );
    
    if (!hasRole) {
      res.status(403).json({ error: `Forbidden: Requires one of roles: ${allowedRoles.join(', ')}` });
      return;
    }

    next();
  };
};
