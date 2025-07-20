import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();
// Ruta GET que solo puede acceder un usuario autenticado
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    message: `Hola ${req.user.email}, accediste a /private/profile`,
    uid: req.user.uid,
  });
});

export default router;
