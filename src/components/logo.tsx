'use client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { BunnyIcon } from './icons/bunny-icon';


export default function Logo({ className, href = '/' }: { className?: string, href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-headline font-bold text-lg", className)}>
      <BunnyIcon className="h-7 w-7 text-primary" />
      <span>Happy Bunny Food</span>
    </Link>
  );
}
