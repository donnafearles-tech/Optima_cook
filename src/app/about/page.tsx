import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/components/logo';
import { ArrowLeft } from 'lucide-react';

const qrImage = PlaceHolderImages.find((img) => img.id === 'qr-code');

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Logo />
        <Button asChild variant="outline">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio</Link>
        </Button>
      </header>

      <main className="flex-grow py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-headline font-bold text-center">
                    ¿Quién es Donna Zavala?
                </h1>
                <p className="text-xl text-center text-primary font-semibold mt-2">Y por qué puede ayudarte a transformar tu cocina</p>
                
                <div className="prose prose-lg dark:prose-invert mx-auto mt-10">
                    <p>
                        En un mundo lleno de recetas complicadas y videos de cocina de un minuto que omiten lo esencial, surge una pregunta: ¿dónde quedaron la precisión y el arte de cocinar sin estrés?
                    </p>
                    <p>
                        Donna Zavala, una ingeniera de procesos obsesionada con la eficiencia y una apasionada chef de alta cocina, se hizo la misma pregunta. Durante años, asesoró a cocinas industriales para optimizar sus líneas de ensamblaje, reduciendo tiempos y costes en operaciones a gran escala. Pero en casa, se encontraba con el mismo caos que todos: temporizadores que se solapan, ingredientes olvidados y el estrés de no saber qué hacer a continuación.
                    </p>
                    <blockquote className="border-l-4 border-primary pl-4 italic">
                        "¿Y si pudiera aplicar la misma lógica que optimiza una fábrica a la preparación de una cena compleja?"
                    </blockquote>
                    <p>
                        Con esa idea, nació "Happy Bunny Food".
                    </p>
                    <p>
                        Lo que empezó como un proyecto personal para organizar sus propias cenas navideñas, pronto se convirtió en la herramienta que amigos y colegas querían usar. Cientos de cocineros caseros, desde principiantes hasta expertos, ya han transformado su forma de planificar, descubriendo una calma y un control que no creían posibles.
                    </p>
                    <p>
                        Donna ha volcado toda su experiencia en esta aplicación. No es solo un gestor de tareas; es un sistema de optimización personal. Es la culminación de años de experiencia en ingeniería de procesos, ahora disponible para ti.
                    </p>
                    <p>
                        Sin embargo, esta herramienta es algo exclusivo. Donna ha decidido mantener el acceso limitado para garantizar que puede ofrecer el mejor soporte y seguir perfeccionando la aplicación basándose en la experiencia de una comunidad selecta de usuarios. Unirse ahora significa formar parte de un grupo pionero que está redescubriendo el placer de cocinar.
                    </p>
                </div>
                
                <div className="text-center mt-12">
                    <h3 className="text-2xl font-headline font-bold">¿Listo para unirte?</h3>
                    <p className="mt-2 text-muted-foreground">Escanea el código para empezar o únete a nuestra comunidad.</p>
                     {qrImage && (
                        <div className="mt-6 flex justify-center">
                            <Image
                                src={qrImage.imageUrl}
                                alt={qrImage.description}
                                width={200}
                                height={200}
                                className="rounded-lg shadow-lg"
                                data-ai-hint={qrImage.imageHint}
                            />
                        </div>
                    )}
                    <Button size="lg" className="mt-8" asChild>
                        <Link href="/login">Comienza tu Primer Proyecto</Link>
                    </Button>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
