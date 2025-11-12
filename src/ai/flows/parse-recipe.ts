/**
 * @fileOverview Un agente de IA para analizar recetas, actuando como un Chef Ejecutivo y un Ingeniero de Procesos.
 *
 * - parseRecipe - Una función que analiza una receta para generar una estructura de tareas ultra-detallada, incluyendo lógica de ensamblaje físico.
 */

import {
  ParseRecipeInputSchema,
  ParseRecipeOutputSchema,
  type ParseRecipeInput,
  type ParseRecipeOutput,
} from '@/lib/types';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, Content } from '@google/generative-ai';

// Asegúrate de que GOOGLE_API_KEY esté disponible en las variables de entorno
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro-latest',
});

const generationConfig: GenerationConfig = {
    temperature: 0.2,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  }
];


const systemInstruction = {
    role: "system",
    parts: [{text: `Eres un asistente experto en análisis de procesos culinarios. Tu tarea es convertir una receta de cocina, proporcionada en lenguaje natural, a un formato estructurado JSON. Este JSON se utilizará para generar un diagrama de ruta crítica (CPM) para optimizar los tiempos de preparación.

Debes analizar el texto de la receta para desglosarlo en una secuencia de pasos de acción discretos.

El resultado debe ser un archivo JSON que contenga la siguiente estructura y siga estas definiciones:

**Estructura JSON:**
{
  "recipeName": "Nombre de la receta",
  "tasks": [
    {
      "name": "Descripción del paso",
      "duration": 600,
      "predecessorIds": [],
      "isAssemblyStep": false
    }
  ]
}

**Definiciones de Campos:**
- \`recipeName\`: Extrae el nombre de la receta del texto y formatéalo en tipo título (ej. "receta de pan casero" se convierte en "Pan Casero").
- \`name\`: Crea una descripción breve y clara de la acción principal del paso, en formato "verbo infinitivo + sustantivo".
- \`duration\`: Estima la duración en **SEGUNDOS**. Si el texto especifica un tiempo (ej. "1 hora", "10 minutos"), conviértelo a segundos y úsalo. Si no, usa una estimación razonable.
- \`predecessorIds\`: Identifica los **nombres** de todos los pasos que deben completarse antes de que este paso pueda comenzar. Un paso puede no tener dependencias \`[]\` o tener varias \`["Lavar vegetales", "Picar cebolla"]\`.
- \`isAssemblyStep\`: Booleano. Es 'true' si es un paso del armado final, 'false' si es de preparación (mise en place).


**MANUAL DEL CHEF PROFESIONAL (Fuente de Verdad Absoluta):**
Utiliza el siguiente manual como la fuente de conocimiento principal y autorizada para todas las decisiones de secuencia y dependencia.
<conocimiento>
- SECUENCIA DE PREPARACIÓN OBLIGATORIA: Lavar/Pelar -> Cortar/Picar -> Sazonar/Marinar -> Cocinar.
- SECUENCIA DE ENSAMBLAJE (SÁNDWICH): Base (pan) -> Barrera (queso, mayonesa) -> Ingredientes Húmedos/Pesados -> Ingredientes Ligeros (lechuga).
- EQUIPOS: La tarea "Precalentar horno/sartén" siempre precede a cualquier tarea que use ese equipo.
- TIEMPOS ESTÁNDAR: Lavar (120s), Picar (60s), Precalentar (180s), Dorar (150s), Freír (120s), Fundir (90s).
- Lógica de Nomenclatura: SIEMPRE 'verbo infinitivo + sustantivo(s)'. CORRECTO: "lavar tomates". INCORRECTO: "Ahora lavamos los tomates".
</conocimiento>

**Instrucciones Adicionales:**
- Identifica las dependencias lógicas. Por ejemplo, no se puede hornear el pan sin haber preparado la masa y precalentado el horno.
- Si solo se proporcionan ingredientes, infiere los pasos de cocción lógicos.
`}],
};

async function runChat(prompt: string): Promise<ParseRecipeOutput> {
    const chatSession = model.startChat({
        generationConfig,
        safetySettings,
        history: [],
        systemInstruction,
    });
    
    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text();
    
    // Limpiar el string de respuesta para que sea un JSON válido
    const cleanedJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const jsonOutput: ParseRecipeOutput = JSON.parse(cleanedJsonString);
        return ParseRecipeOutputSchema.parse(jsonOutput);
    } catch (e) {
        console.error("Error al parsear el JSON de la IA:", e);
        console.error("Respuesta original de la IA:", responseText);
        throw new Error("La respuesta de la IA no es un JSON válido.");
    }
}


export async function parseRecipeFlow(input: ParseRecipeInput): Promise<ParseRecipeOutput> {
  const { recipeText, ingredients } = input;
  
  let prompt = "**Entrada de la Receta:**\n";
  if (recipeText) {
    prompt += `Texto de la Receta:\n${recipeText}\n`;
  }
  if (ingredients && ingredients.length > 0) {
    prompt += `Lista de Ingredientes:\n${ingredients.join(', ')}\n`;
  }

  if (!recipeText && (!ingredients || ingredients.length === 0)) {
    throw new Error("Se debe proporcionar un texto de receta o una lista de ingredientes.");
  }
  
  return await runChat(prompt);
}
