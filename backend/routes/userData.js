import express from 'express';
import { admin, db } from '../config/firebaseAdmin.js';

const router = express.Router();
// Ruta POST para guardar datos personalizados del usuario
router.post('/', async (req, res) => {
  const { uid, nombre, rol } = req.body;
  if (!uid || !nombre || !rol) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const db = admin.database();
    await db.ref(`users/${uid}`).set({ nombre, rol });
    res.status(201).json({ message: 'Datos de usuario guardados correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Ruta GET para obtener los datos del usuario autenticado
router.get('/', async (req, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(401).json({ error: 'No autorizado' });

  try {
    const db = admin.database();
    const snapshot = await db.ref(`users/${uid}`).once('value');
    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'Datos no encontrados' });
    }

    res.status(200).json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;