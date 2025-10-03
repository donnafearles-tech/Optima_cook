import { ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-headline font-bold text-lg", className)}>
      <ChefHat className="h-6 w-6 text-primary" />
      <span>Optimal Cook</span>
    </div>
  );
}
