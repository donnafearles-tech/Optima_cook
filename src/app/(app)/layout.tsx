'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Book,
  ChevronDown,
  Home,
  LogOut,
  PanelLeft,
  Settings,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import Logo from '@/components/logo';
import { useFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';


function UserMenu() {
  const { auth, user, isUserLoading } = useFirebase();

  if (isUserLoading) {
    return <Skeleton className="h-8 w-24" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user/40/40"} alt="User" />
            <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline">{user?.isAnonymous ? "Anonymous User" : user?.displayName || 'User'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => auth.signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MainSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" passHref>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard')}>
                <span>
                  <Home />
                  <span>Dashboard</span>
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="#" passHref>
              <SidebarMenuButton asChild>
                <span>
                  <Book />
                  <span>All Projects</span>
                </span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  const { auth, isUserLoading, user } = useFirebase();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      auth.signInAnonymously();
    }
  }, [isUserLoading, user, auth]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <MainSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(!open)}
          >
            <PanelLeft />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <div className="flex-1" />
          <UserMenu />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
