'use client';
import { useState } from 'react'; // Ya no necesitamos useEffect
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
// Importamos solo lo necesario, quitamos handleRedirectResult
import { useFirebase, initiateEmailSignUp, initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase/auth';
import { useRouter } from 'next/navigation';
import Logo from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

export default function LoginPage() {
  const { auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // --- NUEVA LÓGICA DE GOOGLE (POPUP) ---
  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    try {
      // Al ser Popup, la ejecución se pausa aquí hasta que el usuario termina en la ventana flotante
      await initiateGoogleSignIn(auth);
      
      toast({ title: "¡Bienvenido!", description: "Has iniciado sesión correctamente." });
      
      // Redirigimos inmediatamente al terminar
      router.push('/dashboard'); 
    } catch (error: any) {
      console.error("Error Google Sign-In:", error);
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: error.message || "No se pudo iniciar sesión con Google."
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  // --------------------------------------

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsSigningIn(true);
    try {
      await initiateEmailSignIn(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
        let errorMessage = "Ocurrió un error al iniciar sesión.";
        if (error instanceof FirebaseError) {
             if (error.code === 'auth/invalid-credential') errorMessage = "Credenciales inválidas.";
             else if (error.code === 'auth/user-not-found') errorMessage = "Usuario no encontrado.";
             else if (error.code === 'auth/wrong-password') errorMessage = "Contraseña incorrecta.";
        }
        toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsSigningUp(true);
    try {
      await initiateEmailSignUp(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
        let errorMessage = "Error al crear la cuenta.";
         if (error instanceof FirebaseError) {
             if (error.code === 'auth/email-already-in-use') errorMessage = "El correo ya está en uso.";
             else if (error.code === 'auth/weak-password') errorMessage = "La contraseña es muy débil.";
        }
        toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="signup">Registrarse</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Bienvenido de nuevo</CardTitle>
              <CardDescription>
                Ingresa tus credenciales para acceder a tu cuenta.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleEmailSignIn}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button className="w-full" type="submit" disabled={isSigningIn}>
                    {isSigningIn ? 'Iniciando...' : 'Iniciar Sesión'}
                </Button>
              </CardFooter>
            </form>
            <CardContent className="pb-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>
            </CardContent>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                <GoogleIcon className="mr-2 h-4 w-4" />
                {isGoogleLoading ? 'Conectando...' : 'Google'}
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