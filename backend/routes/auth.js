// backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import db from "../Mysql/DBConnection.js";

const router = express.Router();
const saltRounds = 10;

// REGISTRO
router.post("/register", async (req, res) => {
  const { email, password, nombre } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan campos" });
  }

  try {
    const [existing] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result] = await db.query(
      "INSERT INTO usuarios (email, password, nombre) VALUES (?, ?, ?)",
      [email, hashedPassword, nombre]
    );

    res.status(201).json({ success: true, userId: result.insertId });
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    const user = users[0];
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(403).json({ error: "Contraseña incorrecta" });

    // Devolvemos solo los datos necesarios
    res.status(200).json({ success: true, userId: user.id, nombre: user.nombre, email: user.email });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

export default router;
