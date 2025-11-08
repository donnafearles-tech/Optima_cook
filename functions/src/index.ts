// ESTO ES LO QUE DEBES USAR EN TUS CLOUD FUNCTIONS O GENKIT

import * as admin from 'firebase-admin';

// La función detecta automáticamente la Cuenta de Servicio asignada al entorno de Firebase.
// Es el método más seguro y no requiere subir archivos clave.
admin.initializeApp();
