import express from "express";
import db from "../Mysql/DBConnection.js";

const router = express.Router();

// POST: Crear o reutilizar conversación
router.post("/", async (req, res) => {
  const { usuarioId, titulo } = req.body;
  console.log("Recibido en /conversaciones:", { usuarioId, titulo });

  if (!usuarioId || !titulo) {
    return res.status(400).json({ error: "Faltan datos para la conversación" });
  }

  const userIdNum = parseInt(usuarioId);
  if (isNaN(userIdNum)) {
    return res.status(400).json({ error: "usuarioId inválido (no numérico)" });
  }

  try {
    // Verificar si ya existe una conversación con ese título para ese usuario
    const [existing] = await db.query(
      "SELECT id FROM conversaciones WHERE usuario_id = ? AND titulo = ? LIMIT 1",
      [userIdNum, titulo]
    );

    if (existing.length > 0) {
      console.log("Conversación ya existe con ID:", existing[0].id);
      return res.json({ success: true, id: existing[0].id });
    }

    // No existe, se crea una nueva conversación
    const [result] = await db.query(
      "INSERT INTO conversaciones (usuario_id, titulo) VALUES (?, ?)",
      [userIdNum, titulo]
    );

    console.log("Conversación insertada con ID:", result.insertId);
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Error creando conversación:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// GET: Listar conversaciones por usuario
router.get("/", async (req, res) => {
  const usuarioId = req.query.usuarioId;
  if (!usuarioId) {
    return res.status(400).json({ error: "Falta usuarioId" });
  }

  try {
    const [rows] = await db.query(
      "SELECT id, titulo, fecha_creacion FROM conversaciones WHERE usuario_id = ? ORDER BY fecha_creacion DESC",
      [usuarioId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener conversaciones:", err);
    res.status(500).json({ error: "Error al obtener conversaciones" });
  }
});

// PUT: Actualizar título
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo } = req.body;
  
  if (!titulo) {
    return res.status(400).json({ error: "Falta el nuevo título" });
  }

  try {
    await db.query("UPDATE conversaciones SET titulo = ? WHERE id = ?", [titulo, id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error actualizando título:", err);
    res.status(500).json({ error: "Error al actualizar" });
  }
});

// DELETE: Eliminar conversación (y sus mensajes)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Eliminar mensajes primero
    await db.query("DELETE FROM mensajes WHERE conversacion_id = ?", [id]);

    // Luego eliminar la conversación
    await db.query("DELETE FROM conversaciones WHERE id = ?", [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("Error al eliminar conversación:", err);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// GET: Obtener mensajes de una conversación por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: "ID de conversación inválido" });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
         contenido AS text,
         remitente AS role,
         timestamp
       FROM mensajes
       WHERE conversacion_id = ?
       ORDER BY timestamp ASC`,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error al obtener mensajes:", err);
    res.status(500).json({ error: "Error al obtener mensajes de la conversación" });
  }
});

export default router;