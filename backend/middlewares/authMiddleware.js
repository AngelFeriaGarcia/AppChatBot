import { admin, db } from '../config/firebaseAdmin.js';
// verificar que el usuario tenga un token válido
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Si el encabezado no existe o no sigue el formato adecuado, se responde con error 401 no autorizado
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado o malformado" });
  }

  const idToken = authHeader.split(" ")[1];

  try {
    // Verificamos el token usando Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};
