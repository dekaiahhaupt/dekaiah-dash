'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type UserRole = 'passenger' | 'driver';

interface AuthContextType {
    user: User | null;
    role: UserRole;
    loading: boolean;
    signInWithGoogle: (phoneNumber?: string) => Promise<void>;
    logout: () => Promise<void>;
    toggleRole: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole>('passenger');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // Check if user exists in Firestore, if not create them
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    const isDriver = user.email === 'dekaiahhaupt@gmail.com';
                    await setDoc(userRef, {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        role: isDriver ? 'driver' : 'passenger',
                        createdAt: new Date(),
                    });
                    setRole(isDriver ? 'driver' : 'passenger');
                } else {
                    // Load saved role but enforce email check for driver
                    const data = userSnap.data();
                    const isDriver = user.email === 'dekaiahhaupt@gmail.com';
                    const correctRole = isDriver ? 'driver' : 'passenger';

                    if (data?.role !== correctRole) {
                        // Fix role in DB if it doesn't match email policy
                        await setDoc(userRef, { role: correctRole }, { merge: true });
                    }
                    setRole(correctRole);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async (phoneNumber?: string) => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (user && phoneNumber) {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, { phoneNumber }, { merge: true });
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const toggleRole = async () => {
        // Role is now determined by email, so this is a no-op or could be removed
        console.warn("Role toggling is disabled. Roles are assigned based on email.");
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, signInWithGoogle, logout, toggleRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
