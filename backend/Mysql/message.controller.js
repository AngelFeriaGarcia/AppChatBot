import express from "express";
import db from "./DBConnection.js";

const router = express.Router();

router.post("/", async (req, res) => {
  let { mensaje, respuesta, conversacionId, usuarioId, titulo } = req.body;

  if (!mensaje && !respuesta) {
    return res.status(400).json({ error: "Faltan datos de mensaje o respuesta" });
  }

  try {
    // Crear conversación si no existe
    if (!conversacionId) {
      if (!usuarioId || !titulo) {
        return res.status(400).json({ error: "Faltan usuarioId o título para crear conversación" });
      }

      const [convRes] = await db.execute(
        "INSERT INTO conversaciones (usuario_id, titulo) VALUES (?, ?)",
        [usuarioId, titulo]
      );
      conversacionId = convRes.insertId;
      console.log("Nueva conversación creada con ID:", conversacionId);
    }

    // Verificar que la conversación existe
    const [[conv]] = await db.query(
      "SELECT id FROM conversaciones WHERE id = ?", [conversacionId]
    );
    if (!conv) {
      return res.status(404).json({ error: "Conversación no encontrada" });
    }

    // Insertar mensajes
    if (mensaje) {
      await db.execute(
        "INSERT INTO mensajes (contenido, remitente, conversacion_id) VALUES (?, 'user', ?)",
        [mensaje, conversacionId]
      );
    }

    if (respuesta) {
      await db.execute(
        "INSERT INTO mensajes (contenido, remitente, conversacion_id) VALUES (?, 'bot', ?)",
        [respuesta, conversacionId]
      );
    }

    // DEVUELVE SIEMPRE EL CONVERSACION ID
    res.status(200).json({ success: true, conversacionId });
  } catch (err) {
    console.error(" Error al guardar mensaje:", err.message);
    res.status(500).json({ error: "Error al guardar mensaje", detalle: err.message });
  }
});

export default router;