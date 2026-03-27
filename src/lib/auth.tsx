import { useState, useEffect, type ReactNode } from 'react';

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const PREVIEW_TOKEN = import.meta.env.VITE_RCRT_PREVIEW_TOKEN;
const USE_FIREBASE = !!FIREBASE_API_KEY;

let firebaseAuth: any = null;
let firebaseInitialized = false;

async function initFirebase() {
  if (firebaseInitialized || !USE_FIREBASE) return;
  firebaseInitialized = true;
  const { initializeApp } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  const app = initializeApp({
    apiKey: FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  });
  firebaseAuth = getAuth(app);
}

export function getAuthToken(): Promise<string | null> {
  if (!USE_FIREBASE) return Promise.resolve(PREVIEW_TOKEN || null);
  if (!firebaseAuth?.currentUser) return Promise.resolve(null);
  return firebaseAuth.currentUser.getIdToken();
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!USE_FIREBASE);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!USE_FIREBASE) {
      setLoading(false);
      setReady(true);
      return;
    }

    initFirebase().then(async () => {
      const { onAuthStateChanged } = await import('firebase/auth');
      onAuthStateChanged(firebaseAuth, (u: any) => {
        setUser(u);
        setLoading(false);
        setReady(true);
      });
    });
  }, []);

  if (loading || !ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!USE_FIREBASE) {
    return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
        <p className="text-muted-foreground text-sm">Sign in to continue</p>
        <button
          onClick={async () => {
            const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
            signInWithPopup(firebaseAuth, new GoogleAuthProvider());
          }}
          className="bg-primary text-primary-foreground rounded-xl px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
