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
    title: 'Project-Based Cooking',
    description: 'Organize your meals into projects, like "Thanksgiving Dinner" or "Weekend Meal Prep".',
  },
  {
    icon: <UploadCloud className="h-10 w-10 text-primary" />,
    title: 'Import Recipes Easily',
    description: 'Import recipes from text files, PDFs, and even images. We parse the ingredients and steps for you.',
  },
  {
    icon: <GitMerge className="h-10 w-10 text-primary" />,
    title: 'AI-Powered Dependency Suggestion',
    description: 'Our AI suggests task dependencies to build the most logical cooking sequence.',
  },
  {
    icon: <Clock className="h-10 w-10 text-primary" />,
    title: 'Optimized Cooking Path',
    description: 'The Critical Path Method algorithm calculates the fastest way to cook everything, showing you what to do when.',
  },
];

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Logo />
        <Button asChild>
          <Link href="/dashboard">Get Started</Link>
        </Button>
      </header>

      <main className="flex-grow">
        <section className="relative py-20 md:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight text-gray-900 dark:text-white">
              Cook Smarter, Not Harder.
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Optimal Cook streamlines your kitchen by turning complex recipes into a simple, optimized step-by-step guide.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">Start Your First Project</Link>
              </Button>
              <Button size="lg" variant="outline">
                Learn More
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
              <h2 className="text-3xl font-headline font-bold text-gray-900 dark:text-white">A Revolution in Your Kitchen</h2>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
                Everything you need to perfectly time your complex meals.
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
                <h2 className="text-3xl font-headline font-bold">Ready to Become a Kitchen Maestro?</h2>
                <p className="mt-4 max-w-2xl text-lg opacity-90">
                  Stop juggling timers and start enjoying the art of cooking. Let Optimal Cook handle the logistics.
                </p>
                <Button variant="secondary" size="lg" className="mt-8" asChild>
                  <Link href="/dashboard">Create a Free Account</Link>
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
            &copy; {new Date().getFullYear()} Optimal Cook. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
