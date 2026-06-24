import { Router } from 'express';
import { getMe, loginSuccess, logout, register, auditLogAction, publicAuditLogAction, getDepartments, getSupervisors } from '../controllers/auth.js';
import { verifyToken, verifyFirebaseTokenOnly } from '../middleware/auth.js';

const router = Router();

router.get('/me', verifyToken, getMe);
router.post('/login-success', verifyToken, loginSuccess);
router.post('/logout', verifyToken, logout);
router.get('/departments', verifyFirebaseTokenOnly, getDepartments);
router.get('/supervisors', verifyFirebaseTokenOnly, getSupervisors);
router.post('/register', verifyFirebaseTokenOnly, register);
router.post('/audit', verifyFirebaseTokenOnly, auditLogAction);
router.post('/public-audit', publicAuditLogAction);

export default router;
