import { useState, useEffect, type ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, type User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-6">
        <h1 className="text-2xl font-bold text-foreground">Welcome</h1>
        <p className="text-muted-foreground text-sm">Sign in to continue</p>
        <button
          onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
          className="bg-primary text-primary-foreground rounded-xl px-8 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export { auth };
