import express from 'express';
import fetch from 'node-fetch';// Librería para hacer peticiones HTTP desde Node.js

const router = express.Router();
// Ruta POST para loguear al usuario
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    const apiKey = 'AIzaSyC3hYAyTLHBZlKCWv6pPWzKlVT-qKZbip0'; // API Key pública de Firebase Auth
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(401).json({ error: data.error.message });
    }

    res.json({ idToken: data.idToken, refreshToken: data.refreshToken, uid: data.localId });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

export default router;
