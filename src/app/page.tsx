import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ChefHat, Clock, GitMerge, UploadCloud } from 'lucide-react';
import Logo from '@/components/logo';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    icon: <ChefHat className="h-10 w-10 text-primary" />,
    title: 'Cocina Basada en Proyectos',
    description: 'Organiza tus comidas en proyectos, como "Cena de Navidad" o "Preparación Semanal".',
  },
  {
    icon: <UploadCloud className="h-10 w-10 text-primary" />,
    title: 'Importa Recetas Fácilmente',
    description: 'Importa recetas desde archivos de texto, PDF e incluso imágenes. Analizamos los ingredientes y pasos por ti.',
  },
  {
    icon: <GitMerge className="h-10 w-10 text-primary" />,
    title: 'Sugerencias de Dependencias con IA',
    description: 'Nuestra IA sugiere dependencias de tareas para construir la secuencia de cocina más lógica.',
  },
  {
    icon: <Clock className="h-10 w-10 text-primary" />,
    title: 'Ruta de Cocina Optimizada',
    description: 'El algoritmo de Ruta Crítica calcula la forma más rápida de cocinar todo, mostrándote qué hacer y cuándo.',
  },
];

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Logo />
        <Button asChild>
          <Link href="/login">Comenzar</Link>
        </Button>
      </header>

      <main className="flex-grow">
        <section className="relative py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-gray-900 dark:text-white">
              Cocina de forma más inteligente, no más difícil.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Happy Bunny Food agiliza tu cocina convirtiendo recetas complejas en una guía simple y optimizada paso a paso.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/login">Comienza tu Primer Proyecto</Link>
              </Button>
              <Button size="lg" variant="outline">
                Saber Más
              </Button>
            </div>
          </div>
          {heroImage && (
            <div className="absolute inset-0 -z-10 overflow-hidden">
               <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  fill
                  className="object-cover opacity-10"
                  data-ai-hint={heroImage.imageHint}
                />
            </div>
          )}
        </section>

        <section id="features" className="py-20 bg-white dark:bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">Una Revolución en tu Cocina</h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                Todo lo que necesitas para sincronizar perfectamente tus comidas complejas.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 font-headline text-lg font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="bg-primary text-primary-foreground shadow-2xl">
              <CardContent className="p-10 md:p-16 flex flex-col items-center text-center">
                <h2 className="text-3xl font-headline font-bold">¿Listo para convertirte en un Maestro de la Cocina?</h2>
                <p className="mt-4 max-w-2xl text-lg opacity-90">
                  Deja de hacer malabares con los temporizadores y empieza a disfrutar del arte de cocinar. Deja que Happy Bunny Food se encargue de la logística.
                </p>
                <Button variant="secondary" size="lg" className="mt-8" asChild>
                  <Link href="/login">Comienza Ahora</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <p className="text-sm text-gray-500 mt-4 sm:mt-0">
            &copy; {new Date().getFullYear()} Happy Bunny Food. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
