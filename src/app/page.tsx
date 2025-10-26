'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { useAuthActions } from '@/firebase/client-provider';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, limit } from 'firebase/firestore';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un email válido.' }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
});

const registerSchema = z
  .object({
    email: z
      .string()
      .email({ message: 'Por favor, introduce un email válido.' }),
    password: z
      .string()
      .min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
        email: '',
        password: '',
        confirmPassword: '',
    },
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { user, loading: userLoading } = useUser();
  const { signUp, signIn } = useAuthActions();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().role === 'pending-approval') {
          router.push('/pending-approval');
        } else {
          router.push('/dashboard');
        }
      });
    }
  }, [user, userLoading, router, firestore]);

  const handleAuthError = (err: any) => {
    if (err instanceof FirebaseError) {
      switch (err.code) {
        case 'auth/user-not-found':
          return 'No se encontró ningún usuario con este correo electrónico.';
        case 'auth/wrong-password':
          return 'La contraseña es incorrecta. Por favor, inténtalo de nuevo.';
        case 'auth/email-already-in-use':
          return 'Este correo electrónico ya está en uso. Por favor, inicia sesión.';
        case 'auth/invalid-email':
          return 'El formato del correo electrónico no es válido.';
        case 'auth/weak-password':
          return 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
        default:
          return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
      }
    }
    return err.message || 'Ocurrió un error inesperado.';
  };

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await signIn(values.email, values.password);
      // The useEffect will handle redirection
    } catch (err: any) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (values: z.infer<typeof registerSchema>) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
        // Check if a super-admin already exists
        const superAdminQuery = query(collection(firestore, 'users'), where('role', '==', 'super-admin'), limit(1));
        const superAdminSnapshot = await getDocs(superAdminQuery);
        const isFirstUser = superAdminSnapshot.empty;
        const role = isFirstUser ? 'super-admin' : 'pending-approval';

        const userCredential = await signUp(values.email, values.password);
        const newUser = userCredential.user;

        // Create user profile in Firestore
        await setDoc(doc(firestore, 'users', newUser.uid), {
            displayName: newUser.email?.split('@')[0] || 'Nuevo Usuario',
            email: newUser.email,
            role: role,
        });

        if (role === 'pending-approval') {
             // Create a document in pendingUsers for easier querying by admins
            await setDoc(doc(firestore, 'pendingUsers', newUser.uid), {
                email: newUser.email,
                uid: newUser.uid,
                requestedAt: serverTimestamp(),
            });
            setSuccessMessage('¡Registro exitoso! Tu cuenta está pendiente de aprobación por un administrador.');
            setActiveTab('login'); // Switch to login tab
        } else {
            // First user becomes super admin and can log in immediately
            router.push('/dashboard');
        }

    } catch (err: any) {
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

   if (userLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <Logo />
          </div>
          <CardTitle className="text-2xl">Bienvenido a DataWise AI</CardTitle>
          <CardDescription>
            Accede a tu panel de datos inteligente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLogin)}
                  className="space-y-4 pt-4"
                >
                  {error && activeTab === 'login' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {successMessage && activeTab === 'login' && (
                     <Alert variant='default' className='bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400'>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>¡Éxito!</AlertTitle>
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  )}
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Iniciar Sesión
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="register">
              <Form {...registerForm}>
                <form
                  onSubmit={registerForm.handleSubmit(onRegister)}
                  className="space-y-4 pt-4"
                >
                  {error && activeTab === 'register' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="m@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Registrarse
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
