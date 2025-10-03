import { cn } from '@/lib/utils';

const BunnyIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2C9.243 2 7 4.243 7 7c0 1.571.742 2.964 1.898 3.874A5.463 5.463 0 008 13.5c0 2.485 2.015 4.5 4.5 4.5h.5v.5a2.5 2.5 0 105 0v-.5h.5c2.485 0 4.5-2.015 4.5-4.5a5.463 5.463 0 00-1.898-3.874C20.258 9.964 21 8.571 21 7c0-2.757-2.243-5-5-5h-4zm-2.5 5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5S9.5 8.38 9.5 7z" />
    <path d="M6 15.5c0-1.294-1.01-2.435-2.31-2.494A2.502 2.502 0 001 15.5V16a5 5 0 005 5h.5v-2.5c-1.38 0-2.5-1.12-2.5-2.5v-.5z" />
  </svg>
);


export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-headline font-bold text-lg", className)}>
      <BunnyIcon className="h-7 w-7 text-primary" />
      <span>Happy Bunny Food</span>
    </div>
  );
}
