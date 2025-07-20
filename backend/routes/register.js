import express from 'express';
import { admin, db } from '../config/firebaseAdmin.js';

const router = express.Router();
// Ruta POST para registrar un nuevo usuario
router.post('/', async (req, res) => {
  const { email, password, nombre, rol } = req.body;

  if (!email || !password || !nombre || !rol) {
    return res.status(400).json({ error: 'Faltan campos: email, password, nombre, rol' });
  }

  // Validaciones básicas de email y password
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({ email, password });

    // Guardar datos extra en Realtime Database
    const db = admin.database();
    await db.ref(`users/${userRecord.uid}`).set({
      nombre,
      rol,
      createdAt: Date.now(),
    });

    res.status(201).json({ message: 'Usuario creado correctamente', uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;