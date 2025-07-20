const API_URL = "http://localhost:5050/conversaciones";
export async function guardarConversacionMySQL(usuarioId, titulo, mensajes, conversacionId = null) {
  if (!usuarioId || !mensajes || mensajes.length === 0) {
    console.error(" Usuario o mensajes no válidos");
    return null;
  }

  usuarioId = parseInt(usuarioId);
  if (isNaN(usuarioId)) {
    console.error(" usuarioId no es válido:", usuarioId);
    return null;
  }

  // Crear conversación si no existe
  if (!conversacionId) {
    console.log(" Creando nueva conversación:", { usuarioId, titulo });
    try {
      const res = await fetch("http://localhost:5050/conversaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, titulo })
      });

      const data = await res.json();
      if (!data.id || isNaN(data.id)) {
        console.error(" Conversación no creada:", data);
        return null;
      }

      conversacionId = parseInt(data.id);
      console.log(" Conversación creada con ID:", conversacionId);
    } catch (err) {
      console.error(" Error creando conversación:", err.message);
      return null;
    }
  } else {
    conversacionId = parseInt(conversacionId);
    if (isNaN(conversacionId)) {
      console.error(" conversacionId inválido:", conversacionId);
      return null;
    }
  }

  // Guardar mensajes
  for (const msg of mensajes) {
    const texto = msg.text?.trim();
    const isUser = msg.role === "user";

    if (!texto) continue;

    try {
      const res = await fetch("http://localhost:5050/mensajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: isUser ? texto : undefined,
          respuesta: !isUser ? texto : undefined,
          conversacionId,
          usuarioId,
          titulo 
        })
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(" Error al guardar mensaje:", data);
      } else {
        console.log(" Mensaje guardado:", { texto, conversacionId });
      }

    } catch (err) {
      console.error("Error de red al guardar mensaje:", err.message);
    }
  }

  return conversacionId;
}

export async function obtenerConversacionesMySQL(usuarioId) {
  const res = await fetch(`${API_URL}?usuarioId=${usuarioId}`);
  const data = await res.json();
  return data;
}

export async function actualizarTituloMySQL(convId, nuevoTitulo) {
  await fetch(`${API_URL}/${convId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo: nuevoTitulo })
  });
}

export async function eliminarConversacionMySQL(convId) {
  await fetch(`${API_URL}/${convId}`, { method: "DELETE" });
}