
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirebase, initiateEmailSignUp, initiateEmailSignIn, initiateGoogleSignIn, useUser } from '@/firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Logo from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.999,36.586,44,31.016,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { auth } = useFirebase();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleAuthError = (error: unknown) => {
    let title = 'Error de Autenticación';
    let description = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';

    if (error instanceof FirebaseError) {
        switch (error.code) {
        case 'auth/popup-blocked-by-browser':
            title = 'Ventana Emergente Bloqueada';
            description = 'Tu navegador bloqueó la ventana de inicio de sesión. Por favor, permite las ventanas emergentes para este sitio e inténtalo de nuevo.';
            break;
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
            title = 'Credenciales Incorrectas';
            description = 'El correo o la contraseña no son válidos. Por favor, verifica tus datos.';
            break;
        case 'auth/email-already-in-use':
            title = 'Correo ya Registrado';
            description = 'Este correo electrónico ya está en uso. Intenta iniciar sesión.';
            break;
        case 'auth/weak-password':
            title = 'Contraseña Débil';
            description = 'La contraseña debe tener al menos 6 caracteres.';
            break;
        case 'auth/network-request-failed':
            title = 'Error de Red';
            description = 'No se pudo conectar con los servidores. Revisa tu conexión y que el dominio esté autorizado en Firebase.';
            break;
        case 'auth/popup-closed-by-user':
            // Esto no es un error real, el usuario cerró la ventana de Google.
            return;
        case 'auth/unauthorized-domain':
            title: 'Dominio no Autorizado';
            description = 'Este dominio no está autorizado para operaciones de autenticación. Añádelo en la consola de Firebase.';
            break;
        default:
            // Para otros errores de Firebase, muestra el código
            title = `Error de Firebase (${error.code})`;
            description = error.message;
            break;
        }
    } else if (error instanceof Error) {
        // Para errores genéricos de JavaScript
        description = error.message;
    }

    toast({
      title: title,
      description: description,
      variant: 'destructive',
    });
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    try {
      await initiateEmailSignUp(auth, email, password);
      // En caso de éxito, el listener onAuthStateChanged se encargará del redireccionamiento.
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    try {
      await initiateEmailSignIn(auth, email, password);
      // En caso de éxito, el listener onAuthStateChanged se encargará del redireccionamiento.
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      await initiateGoogleSignIn(auth);
    } catch (error) {
       handleAuthError(error);
    }
  }

  if (isUserLoading || user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div>Cargando...</div>
        </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <Tabs defaultValue="signin" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="signup">Crear Cuenta</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenido de Nuevo</CardTitle>
              <CardDescription>
                Inicia sesión para acceder a tus proyectos de cocina.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Correo Electrónico</Label>
                  <Input id="email-signin" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">Contraseña</Label>
                  <Input id="password-signin" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" type="submit" disabled={isSigningIn}>
                    {isSigningIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </form>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                Google
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Crear una Cuenta</CardTitle>
              <CardDescription>
                Comienza a planificar tus obras maestras culinarias.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="email-signup">Correo Electrónico</Label>
                  <Input id="email-signup" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Contraseña</Label>
                  <Input id="password-signup" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter>
                 <Button className="w-full" type="submit" disabled={isSigningUp}>
                    {isSigningUp ? 'Creando cuenta...' : 'Crear Cuenta'}
                 </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
