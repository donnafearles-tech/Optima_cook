
# Instrucciones para Copilot / Agentes de IA — Optima_cook

Este documento proporciona orientación específica y accionable para agentes de IA que trabajen en Optima_cook.

Arquitectura general
- Frontend: Next.js (App Router) en `src/app` — componentes de servidor y cliente coexisten.
- Orquestación de IA: `src/ai` contiene la configuración de `genkit` y flujos individuales en `src/ai/flows` (por ejemplo, `generate-recipe.ts`, `parse-recipe.ts`). Usa estos flujos como ejemplos canónicos de cómo estructurar prompts, parseo y tareas multi-paso con LLM.
- Firebase: helpers de cliente en `src/firebase` y funciones cloud en `functions/src`. Autenticación, acceso a Firestore y helpers de almacenamiento están en `src/firebase`.
- Micro-paquetes: `cancel/` y `functions/` tienen su propio `package.json` y `tsconfig.*` — trátalos como paquetes separados al hacer cambios que afecten el build o los tipos.

Flujos clave de desarrollo
- Desarrollo local: `npm run dev` (root) — ejecuta `npx genkit start` y `next dev` (ver scripts en el `package.json` raíz).
- Build: `npm run build`; Servidor en producción: `npm run start`.
- Genkit: `npm run genkit:dev` (servidor genkit en desarrollo), `npm run genkit:prod` para compilar flujos (la entrada de config es `src/ai/genkit.ts`).

Patrones y convenciones (no inventar)
- TypeScript primero: Muchos folders tienen su propio `tsconfig.json`. Prefiere los tsconfig locales al cambiar tipos a nivel de paquete.
- UI: Primitivas reutilizables en `src/app/ui` (por ejemplo, `button.tsx`, `dialog.tsx`). Sigue las formas de props y patrones de combinación de className usados en los componentes existentes.
- Flujos de IA: Cada flujo en `src/ai/flows` retorna salidas estructuradas (usualmente JSON u objetos tipados). Al crear o editar flujos, sigue las convenciones de parseo y manejo de errores existentes (ver `extract-text-from-file.ts` y `consolidate-tasks.ts`).
- Acciones de servidor y rutas API: Revisa `src/app/actions` y `src/app/api` para ver cómo la app invoca IA del lado servidor o endpoints backend.

Integración y dependencias externas
- Genkit se usa para orquestación LLM (dependencias `@genkit-ai/*`). Cambios en prompts o flujos suelen requerir actualizar `src/ai/genkit.ts` y recompilar artefactos genkit.
- Firebase: El uso del SDK cliente está en `src/firebase`. Las funciones cloud están en `functions/src` y tienen su propio `package.json` y pipeline de build.
- Dataconnect: `dataconnect/` contiene definiciones de conectores (`connector.yaml` y `schema/`) — los cambios aquí afectan integraciones externas.

Ejemplos rápidos (dónde mirar)
- Añadir un nuevo flujo de IA: copia el patrón de `src/ai/flows/generate-recipe.ts` y regístralo en `src/ai/genkit.ts`.
- Debug de IA: ejecuta `npm run genkit:dev` para iniciar genkit (prompt/servidor local) y `npm run dev` para ver interacciones en el frontend.
- Añadir una Cloud Function de Firebase: modifica `functions/src` y actualiza el `package.json`/`tsconfig` de ese paquete, luego despliega con tu workflow habitual de Firebase.

Lo que se debe y no se debe hacer
- Haz: Usa flujos y componentes UI existentes como ejemplos canónicos; prefiere ediciones mínimas y dirigidas.
- Haz: Ejecuta `npm run genkit:dev` al cambiar flujos para validar prompts localmente.
- No hagas: Mover la lógica central de IA fuera de `src/ai` sin actualizar la config de genkit.

Archivos de referencia para programar
- `src/ai/genkit.ts` — entrada/config de genkit
- `src/ai/flows/*.ts` — ejemplos de flujos de IA
- `src/app` — páginas del App Router de Next.js e interacciones servidor/cliente
- `src/firebase` y `functions/src` — integraciones Firebase
- `cancel/`, `dataconnect/` — paquetes separados con su propio contexto de build

Si algo no está claro, pregunta:
- ¿Qué target de despliegue quieres probar (dev local vs despliegue prod completo)?
- ¿Los cambios deben vivir en el workspace raíz o en un sub-paquete (`cancel/`, `functions/`)?

- Modelos Vertex AI: USA SIEMPRE el sufijo de versión específico para evitar errores 404 (ejemplo: usa 'gemini-1.5-flash-001', NO 'gemini-1.5-flash' ni versiones preview).
- Autenticación: Usa `@genkit-ai/vertexai` con Application Default Credentials (ADC). NUNCA uses `@genkit-ai/googleai` ni API Keys en este proyecto.
- Seguridad backend: Añade siempre `import 'server-only';` al inicio de `src/ai/genkit.ts` para evitar que la lógica backend se filtre al cliente.
- Limpieza de Markdown: Al parsear JSON de respuestas LLM, elimina siempre los bloques de código markdown (```json ... ```) antes de usar JSON.parse().

Fin de instrucciones — solicita feedback para iterar.
