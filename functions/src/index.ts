import * as admin from "firebase-admin";

// La ruta "path/to/serviceAccountKey.json" es un marcador de posición.
// Deberías reemplazar "path/to/serviceAccountKey.json" por la ruta real a tu archivo de credenciales.
// Por ejemplo, si colocas el archivo en la misma carpeta, la ruta sería "./serviceAccountKey.json".
// Por seguridad, es recomendable no incluir este archivo directamente en el código fuente.
import * as serviceAccount from "../../sa.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://studio-99491860-5533f-default-rtdb.firebaseio.com"
});
