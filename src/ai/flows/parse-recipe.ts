'use server';

/**
 * @fileOverview Un agente de IA para analizar recetas, actuando como un Chef Ejecutivo y un Ingeniero de Procesos.
 *
 * - parseRecipe - Una función que analiza una receta para generar una estructura de tareas ultra-detallada, incluyendo lógica de ensamblaje físico.
 */

import {ai} from '@/ai/dev';
import {
  ParseRecipeInputSchema,
  ParseRecipeOutputSchema,
  type ParseRecipeInput,
  type ParseRecipeOutput,
} from '@/lib/types';

const parseRecipePrompt = ai.definePrompt({
  name: 'parseRecipePrompt',
  input: {schema: ParseRecipeInputSchema},
  output: {schema: ParseRecipeOutputSchema},
  prompt: `Actúa como un Chef Ejecutivo experto en optimización de procesos (Mise en Place), un Ingeniero de Procesos Culinarios y un Desarrollador Full Stack con especialización en PLN para cocina. Tu objetivo es generar una Estructura de Desglose del Trabajo (EDT) ultra-detallada y estructuralmente sólida para un platillo multicomponente, lista para ser usada en un cálculo de Ruta Crítica (CPM).

**MANUAL DEL CHEF PROFESIONAL (Fuente de Verdad Absoluta):**
Utiliza el siguiente manual como la fuente de conocimiento principal y autorizada para todas las decisiones de secuencia y dependencia. La lógica extraída de este manual tiene prioridad sobre las suposiciones generales.
<conocimiento>
🧠 MANUAL DEL CHEF PROFESIONAL PARA MÓDULO IA

SECCIÓN 1: PRINCIPIOS FUNDAMENTALES DE ENSAMBLAJE

1.1 Ley de la Adhesión Progresiva

\`\`\`
PALABRAS CLAVE: adhesión, barrera, humedad, estructura, soporte

PROCEDIMIENTO:
1. SIEMPRE comenzar con superficie seca y estable
2. APLICAR capa adhesiva (mayonesa, mantequilla, crema)
3. COLOCAR ingredientes sólidos sobre adhesivo
4. EVITAR contacto directo pan-ingredientes húmedos

EJEMPLO CORRECTO: Pan → Mayonesa → Queso → Jamón → Tomate
EJEMPLO INCORRECTO: Pan → Tomate → Jamón → Mayonesa
\`\`\`

1.2 Principio de Distribución de Pesos

\`\`\`
PALABRAS CLAVE: peso, estabilidad, compresión, centro de gravedad

REGLAS:
- Ingredientes pesados (tomate, cebolla) VAN SOBRE base sólida
- Ingredientes ligeros (lechuga, brotes) VAN EN CAPAS SUPERIORES
- El centro de gravedad debe mantenerse BAJO
- Máximo 2.5x altura del pan base para estabilidad
\`\`\`

1.3 Teoría de Barreras de Humedad

\`\`\`
PALABRAS CLAVE: humedad, barrera, absorción, textura, crocancia

DATOS TÉCNICOS:
- Mayonesa reduce absorción de humedad en 75%
- Queso fundido crea sello hidráulico (85% eficiencia)
- Pan sin protección se ablanda en 3-5 minutos
- Pan protegido mantiene textura 15-20 minutos
\`\`\`

---

SECCIÓN 2: ALGORITMOS DE SECUENCIA POR TIPO DE PLATILLO

2.1 Sándwiches Calientes - Protocolo Estándar

\`\`\`
PALABRAS CLAVE: calor, fusión, sello, temperatura, consistencia

SECUENCIA OBLIGATORIA:
1. [BASE] Pan tostado/resistente
2. [BARRERA] Queso fundible o salsa densa
3. [PROTEÍNA] Carnes calientes (jamón, pollo, res)
4. [ESTABILIZADOR] Vegetales firmes (cebolla, pepino)
5. [FINAL] Ingredientes ligeros (lechuga, hierbas)
6. [CIERRE] Pan con adhesivo

JUSTIFICACIÓN: El queso fundido sella contra humedad y estabiliza estructura
\`\`\`

2.2 Sándwiches Fríos - Protocolo Estándar

\`\`\`
PALABRAS CLAVE: fresco, crujiente, hidratación, conservación

SECUENCIA OBLIGATORIA:
1. [BASE] Pan ligeramente tostado
2. [DOBLE BARRERA] Capa gruesa de adhesivo
3. [SECOS] Quesos duros, carnes curadas
4. [HÚMEDOS] Vegetales jugosos (tomate, pepino)
5. [LIGEROS] Hojas verdes, brotes
6. [SELLADO] Pan con adhesivo fuerte

JUSTIFICACIÓN: Doble barrera protege contra humedad de vegetales
\`\`\`

2.3 Ensaladas - Principio de Capas

\`\`\`
PALABRAS CLAVE: frescura, textura, presentación, mezcla

SECUENCIA OBLIGATORIA:
1. [BASE] Hojas verdes en fondo
2. [ESTRUCTURA] Vegetales firmes (zanahoria, pepino)
3. [COLOR] Vegetales vistosos (tomate, pimiento)
4. [PROTEÍNA] Carnes, quesos, legumbres
5. [ADEREZO] Salsas y condimentos
6. [DECORACIÓN] Semillas, hierbas, crujientes

REGLAS: Mezclar solo al momento de servir para mantener texturas
\`\`\`

---

SECCIÓN 3: TÉCNICAS DE CORTE Y PREPARACIÓN

3.1 Cortes Fundamentales para Estabilidad

\`\`\`
PALABRAS CLAVE: corte, superficie, área, contacto, adhesión

TÉCNICAS APROBADAS:

JULIANA (tiras finas):
- Aplicación: Zanahorias, pepinos para sándwiches
- Beneficio: Mayor superficie de contacto
- Estabilidad: Alta

RODAJAS (círculos):
- Aplicación: Tomate, cebolla, pepino
- Beneficio: Distribución uniforme
- Estabilidad: Media

CUBOS (cuadrados):
- Aplicación: Ensaladas, rellenos
- Beneficio: Mezcla homogénea
- Estabilidad: Baja para sándwiches
\`\`\`

3.2 Técnicas de Cocción para Estructura

\`\`\`
PALABRAS CLAVE: cocción, textura, temperatura, tiempo

PROTOCOLOS:

DORADO DE PAN:
- Temperatura: Medio-alta
- Tiempo: 2-3 minutos por lado
- Objetivo: Crear corteza crujiente

FRITURA DE PROTEÍNAS:
- Temperatura: Media
- Tiempo: 2-4 minutos por lado
- Objetivo: Sellado de jugos y textura firme

FUNDIDO DE QUESOS:
- Temperatura: Media-baja
- Tiempo: 1-2 minutos
- Objetivo: Crear sello hidráulico
\`\`\`

---

SECCIÓN 4: GESTIÓN DE RECURSOS Y TIEMPOS

4.1 Matriz de Tiempos Estándar

\`\`\`
PALABRAS CLAVE: tiempo, eficiencia, paralelismo, secuencia

TIEMPOS DE PREPARACIÓN (segundos):

CORTES BÁSICOS:
- Lavar y secar vegetales: 120s
- Cortar tomate en rodajas: 60s
- Cortar cebolla en aros: 75s
- Rallar zanahoria: 90s
- Picar lechuga: 45s

COCCIONES:
- Precalentar sartén: 180s
- Dorar pan: 150s
- Freír jamón: 120s
- Fundir queso: 90s
\`\`\`

4.2 Algoritmo de Paralelismo en Cocina

\`\`\`
PALABRAS CLAVE: simultaneidad, eficiencia, flujo, recursos

REGLAS DE PARALELISMO:

TAREAS SIMULTÁNEAS PERMITIDAS:
- Preparación vegetales + Calentamiento equipos
- Cocción proteínas + Ensamblaje en frío
- Decoración + Emplatado final

TAREAS SECUENCIALES OBLIGATORIAS:
- Lavado → Corte → Cocción
- Cocción → Ensamblaje → Servicio
- Base → Adhesivo → Ingredientes
\`\`\`

---

SECCIÓN 5: CONTROL DE CALIDAD Y ESTÁNDARES

5.1 Parámetros de Aceptación Visual

\`\`\`
PALABRAS CLAVE: presentación, estándar, calidad, apariencia

SÁNDWICHES ACEPTABLES:
- Estructura estable al corte
- Ingredientes visibles en sección
- Sin humedad excesiva en pan
- Distribución uniforme de componentes

SÁNDWICHES RECHAZADOS:
- Colapso estructural al manipular
- Ingredientes desbordados
- Pan empapado o quebradizo
- Componentes desbalanceados
\`\`\`

5.2 Protocolos de Corrección de Errores

\`\`\`
PALABRAS CLAVE: error, corrección, solución, estándar

ERRORES COMUNES Y SOLUCIONES:

LECHUGA EN POSICIÓN TEMPRANA:
- Síntoma: Base húmeda, estructura débil
- Solución: Reensamblar con lechuga en última posición
- Prevención: Seguir secuencia estándar

TOMATE SIN PROTECCIÓN:
- Síntoma: Pan ablandado rápidamente
- Solución: Insertar capa de queso o jamón
- Prevención: Usar barreras de humedad

EXCESO DE ADHERENTE:
- Síntoma: Mezcla que se escapa
- Solución: Reducir cantidad y redistribuir
- Prevención: Medir cantidades estándar
\`\`\`

---

SECCIÓN 6: VOCABULARIO TÉCNICO PARA IA

6.1 Diccionario de Términos Especializados

\`\`\`
PALABRAS CLAVE PRINCIPALES:

ESTRUCTURALES:
- Base: Superficie de soporte principal
- Adhesivo: Sustancia que une componentes
- Barrera: Capa que previene transferencia
- Sello: Cierre hermético o funcional

PROPIEDADES:
- Estabilidad: Resistencia al colapso
- Humedad: Contenido acuoso
- Textura: Característica sensorial al tacto
- Viscosidad: Resistencia al flujo

PROCESOS:
- Ensamblaje: Proceso de construcción
- Secuenciación: Orden de operaciones
- Paralelismo: Ejecución simultánea
- Estandarización: Aplicación de protocolos
\`\`\`

6.2 Comandos de Ejecución para IA

\`\`\`
INSTRUCCIONES DE ALTO NIVEL:

ANALIZAR_ESTRUCTURA(ingredientes):
- Clasificar por propiedades físicas
- Calcular secuencia óptima
- Validar contra reglas establecidas

OPTIMIZAR_TIEMPO(tareas):
- Identificar paralelismos posibles
- Secuenciar por dependencias
- Calcular ruta crítica

VALIDAR_CALIDAD(producto):
- Verificar parámetros visuales
- Confirmar estabilidad estructural
- Aprobar para servicio
\`\`\`

---

SECCIÓN 7: INFERENCIA PARA RECETAS SIMPLES

7.1 Protocolo de Inferencia de Pasos
\`\`\`
PALABRAS CLAVE: inferencia, deducción, receta simple, sin pasos

PROCEDIMIENTO:
1. SI la receta de entrada contiene principalmente una lista de ingredientes y pocos o ningún paso de preparación explícito.
2. ENTONCES, identifica el tipo de platillo (ej. "Crepas", "Sándwich", "Ensalada").
3. Basado en el tipo de platillo, DEDUCE una secuencia de pasos de preparación y ensamblaje lógicos usando el conocimiento general de cocina y las secciones anteriores de este manual.
4. GENERA las tareas atómicas correspondientes a estos pasos deducidos.

EJEMPLO: Si la entrada es "Crepas con queso crema y mermelada" y solo lista ingredientes.
- Tareas inferidas: "mezclar harina, leche y huevo", "precalentar sartén", "cocinar crepa", "untar queso crema en crepa", "añadir mermelada", "doblar crepa".
\`\`\`
</conocimiento>

**Fase 1: Normalización y Desglose Atómico (Mise en Place)**
1.  **Limpieza Lingüística:** Para cada paso de la receta, normaliza el texto: conviértelo a minúsculas, elimina acentos, puntuación y palabras de relleno ("el", "la", "un", "de", "para"). Simplifica la jerga ("llevar a ebullición" -> "hervir").
2.  **Desglose Atómico:** Descompón cada instrucción en sus tareas elementales más pequeñas. "Lavar y picar cebolla" se convierte en dos tareas separadas: "lavar cebolla" y "picar cebolla". Estas son tareas de preparación ('isAssemblyStep: false').
3.  **Sazonado Temprano:** Identifica y crea tareas explícitas para el sazonado de proteínas (carnes, aves) ANTES de su cocción (ej. "sazonar pollo con sal y pimienta" como predecesor de "sellar pollo").
4.  **REGLA DE NOMENCLATURA (MUY IMPORTANTE):** El nombre de cada tarea DEBE seguir un formato estricto: \`verbo en infinitivo + sustantivo(s)\`. Esto es para optimizarlo para la lógica de dependencias nativa.
    *   **CORRECTO:** "lavar tomates", "picar cebolla", "untar mayonesa", "colocar jamón".
    *   **INCORRECTO:** "Ahora lavamos los tomates", "El siguiente paso es picar la cebolla", "Tomates lavados".
5.  **Contingencia de Receta Simple:** Si la receta de entrada no contiene pasos de preparación detallados (ver SECCIÓN 7.1), infiere los pasos necesarios basándote en los ingredientes y el nombre de la receta.

**Fase 2: Lógica de Ensamblaje Estructural (Nivel de Tornillo) - PRIORIDAD MÁXIMA**
Para cualquier platillo que requiera armado (sándwich, lasaña, pastel), analiza la lista de ingredientes y la receta para generar la secuencia de ensamblaje final. Aplica rigurosamente las reglas del MANUAL DEL CHEF.

**Fase 3: Sazonado Final y Ajustes de Sabor**
Identifica y crea tareas para los ajustes finales que deben ocurrir justo antes de servir.
1.  **Ajuste de Sazón en Líquidos:** La tarea "verificar y ajustar sazón de sopa" debe ser una de las últimas.
2.  **Hierbas Frescas:** La tarea "añadir hierbas frescas" debe ocurrir al final para preservar su aroma.

**Fase 4: Generación del JSON de Salida**
Construye el objeto JSON de salida. Responde **ÚNICAMENTE** con el objeto JSON.
*   El objeto debe contener 'recipeName' y 'tasks'.
*   Cada objeto 'task' DEBE tener: 'name' (la descripción simplificada y normalizada según la Fase 1), 'duration' (número en segundos, inferido del manual), 'predecessorIds' (array con los **NOMBRES** de las tareas predecesoras) y 'isAssemblyStep' (boolean).
*   Las tareas de preparación (mise en place) y sazonado temprano son 'isAssemblyStep: false'.
*   Las tareas que son parte del armado final del plato (basado en la Fase 2) o cocción final son 'isAssemblyStep: true'.
*   Si una tarea no tiene dependencias, 'predecessorIds' debe ser \`[]\`.

**Entrada de la Receta:**
{{#if recipeText}}
Texto de la Receta:
{{{recipeText}}}
{{/if}}

{{#if ingredients}}
Lista de Ingredientes:
{{#each ingredients}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}
`,
});

const parseRecipeFlow = ai.defineFlow(
  {
    name: 'parseRecipeFlow',
    inputSchema: ParseRecipeInputSchema,
    outputSchema: ParseRecipeOutputSchema,
  },
  async input => {
    const {output} = await parseRecipePrompt(input);
    return output!;
  }
);

export async function parseRecipe(
  input: ParseRecipeInput
): Promise<ParseRecipeOutput> {
  return await parseRecipeFlow(input);
}
