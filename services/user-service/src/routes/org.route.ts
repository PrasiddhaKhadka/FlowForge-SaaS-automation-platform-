import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as orgController from '../controllers/org.controller.js';

const router = Router();

// all routes require a valid JWT
router.use(authMiddleware);

router.post('/', orgController.createOrg);
router.get('/', orgController.getUserOrgs);
router.get('/:orgId', orgController.getOrg);
router.post('/:orgId/members', orgController.inviteMember);
router.get('/:orgId/members', orgController.getMembers);
router.delete('/:orgId/members/:userId', orgController.removeMember);

export default router;
