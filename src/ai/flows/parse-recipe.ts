import { ai } from '@/ai/genkit';
import {
  ParseRecipeInputSchema,
  ParseRecipeOutputSchema,
} from '@/lib/types';
import { vertexAI } from '@genkit-ai/vertexai';

const parseRecipePrompt = ai.definePrompt({
  name: 'parseRecipePrompt',
  input: { schema: ParseRecipeInputSchema },
  output: { schema: ParseRecipeOutputSchema },
  model: vertexAI.model('gemini-2.5-flash'),
  prompt: `Actúas como un Chef Ejecutivo y un Ingeniero de Procesos de clase mundial, especializado en la metodología "Mise en Place" y la optimización de flujos de trabajo en la cocina. Tu misión es analizar el texto de una receta y convertirlo en una lista de tareas estructurada, detallada y procesable en formato JSON.

**Reglas Fundamentales (Tu Biblia Culinaria):**

1.  **Detección de Pasos de Ensamblaje vs. Preparación:**
    *   **Preparación (Mise en Place):** Tareas que preparan ingredientes. Incluyen verbos como: lavar, pelar, picar, rebanar, medir, mezclar (para marinadas), sazonar. Estas tareas tienen la bandera \`isAssemblyStep\` en \`false\`.
    *   **Ensamblaje:** Tareas que combinan ingredientes preparados o aplican calor. Incluyen verbos como: cocinar, freír, hornear, saltear, hervir, colocar, añadir, montar, servir. Estas tareas tienen la bandera \`isAssemblyStep\` en \`true\`.

2.  **Lógica de Dependencias (Predecesores):**
    *   **Preparación -> Ensamblaje:** Una tarea de preparación de un ingrediente (ej. "Picar cebolla") DEBE ser predecesora de cualquier tarea de ensamblaje que use ese ingrediente (ej. "Sofreír cebolla").
    *   **Secuencia de Preparación:** "Lavar" o "Pelar" un ingrediente SIEMPRE precede a "Cortar" o "Picar" el mismo ingrediente.
    *   **Equipamiento:** "Precalentar horno" o "Calentar aceite" DEBE ser predecesora de cualquier tarea que los use ("Hornear pavo", "Freír pollo").
    *   **Salsas/Bases:** Tareas como "Hacer la salsa" o "Preparar el aderezo" deben completarse antes de tareas como "Mezclar con la pasta" o "Aderezar la ensalada".

3.  **Estimación de Duración (en SEGUNDOS):**
    *   **Tareas Rápidas (30-120s):** Medir, mezclar ingredientes secos, sazonar.
    *   **Tareas Cortas (180-300s):** Picar verduras, lavar ensalada, exprimir limones.
    *   **Tareas Medias (300-900s):** Sofreír, freír, hervir agua, hacer una salsa simple.
    *   **Tareas Largas (900s+):** Hornear, asar, estofar, marinar por mucho tiempo, reducir una salsa compleja.

4.  **Generación de Nombre de Tarea:**
    *   Sé ultra-específico. No digas "Preparar verduras", di "Picar la cebolla en brunoise" y "Rebanar el pimiento".
    *   Infiere el sujeto y la acción: "Ponga a hervir una olla de agua" -> "Hervir agua".

**Contexto Adicional (Opcional):**
{{#if knowledgeBaseText}}
He aquí un manual de cocina. Úsalo como referencia para técnicas y tiempos si la receta es ambigua:
{{{knowledgeBaseText}}}
{{/if}}

**Receta a Analizar:**
{{{recipeText}}}

**Formato de Salida Obligatorio:**
Responde ÚNICAMENTE con un objeto JSON válido que se ajuste al esquema. El JSON debe contener el nombre de la receta y una lista de tareas. No incluyas explicaciones, solo el JSON.
`,
});

export const parseRecipeFlow = ai.defineFlow(
  {
    name: 'parseRecipeFlow',
    inputSchema: ParseRecipeInputSchema,
    outputSchema: ParseRecipeOutputSchema,
  },
  async (input) => {
    const { output } = await parseRecipePrompt(input);
    return output!;
  }
);
