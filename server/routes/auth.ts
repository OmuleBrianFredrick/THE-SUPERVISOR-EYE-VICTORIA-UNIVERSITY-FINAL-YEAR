import { Router } from 'express';
import { getMe, loginSuccess, logout, register, auditLogAction, publicAuditLogAction, getDepartments, getSupervisors } from '../controllers/auth.js';
import { verifyToken, verifyFirebaseTokenOnly } from '../middleware/auth.js';
import { validate, loginSuccessSchema, registerSchema, auditLogSchema } from '../validations/index.js';

const router = Router();

router.get('/me', verifyToken, getMe);
router.post('/login-success', verifyToken, validate(loginSuccessSchema), loginSuccess);
router.post('/logout', verifyToken, logout);
router.get('/departments', verifyFirebaseTokenOnly, getDepartments);
router.get('/supervisors', verifyFirebaseTokenOnly, getSupervisors);
router.post('/register', verifyFirebaseTokenOnly, validate(registerSchema), register);
router.post('/audit', verifyFirebaseTokenOnly, validate(auditLogSchema), auditLogAction);
router.post('/public-audit', validate(auditLogSchema), publicAuditLogAction);

export default router;
