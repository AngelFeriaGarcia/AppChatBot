import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import registerRoutes from "./routes/register.js";
import privateRoutes from "./routes/private.js";
import userDataRoutes from "./routes/userData.js";
import { verifyToken } from "./middlewares/authMiddleware.js";
import messageRoutes from "./Mysql/message.controller.js";
import path from 'path';//acceso a url
import { fileURLToPath } from 'url';//acceso a url
import { admin, db } from './config/firebaseAdmin.js';
import authRoutes from "./routes/auth.js";
import conversacionesRoutes from './routes/conversaciones.controller.js';


dotenv.config();

const app = express();
const corsOptions = {
  origin: ["http://localhost:5500", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};

app.use(cors(corsOptions));

//app.use(cors());
app.use(express.json());

try {
  app.use("/mensajes", messageRoutes);//mysql mensajes
  console.log("Usando rutas de mensajes");
} catch (err) {
  console.error("error en /mensajes", err);
}
try {
  app.use("/register", registerRoutes);
  console.log("Usando rutas de registro");
} catch (err) {
  console.error("Error en /register:", err);
}

try {
  // Rutas protegidas
  app.use("/private", privateRoutes); // si ya está verificado internamente
  console.log("Usando rutas privadas");
} catch (err) {
  console.error("Error en /private:", err);
}
try {
  app.use("/user-data", verifyToken, userDataRoutes);
  console.log("Usando rutas de datos de usuario");
} catch (err) {
  console.error("Error en /user-data:", err);
}

// Ruta protegida de prueba
app.use("/private-route", verifyToken, (req, res) => {
  res.json({ message: `Hello ${req.user.email}, esta ruta está protegida` });
});

//para mysql login registro
app.use("/auth", authRoutes);
app.use('/conversaciones', conversacionesRoutes);

// Ruta de prueba para Firebase
app.get("/test-firebase", async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("test").get();
    res.json({ message: "Conexión Firebase Admin correcta", docs: snapshot.docs.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
console.log("Antes de escuchar el servidor");
const PORT = process.env.PORT || 5050;
console.log(` Escuchando en http://localhost:${PORT}`);

console.log(" Iniciando servidor...");
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
console.log("Después de escuchar el servidor");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Para rutas tipo SPA o si recargas páginas internas
//app.get('*', (req, res) => {
//res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
//});