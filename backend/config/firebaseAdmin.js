import admin from 'firebase-admin';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(await readFile(
  new URL('./firebase-adminsdk.json', import.meta.url)
));

// Importamos la clave de servicio (archivo JSON generado desde la consola Firebase)
// con las credenciales necesarias para autenticar como administrador
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    //URL de la base de datos en tiempo real del proyecto
    databaseURL: "https://chatbot-f496c-default-rtdb.europe-west1.firebasedatabase.app"
  });
}
//autenticar con las credenciales del archivo.
const db = admin.database();
const auth = admin.auth();

export { admin, db, auth };