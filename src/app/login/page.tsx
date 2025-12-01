'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
    const { user, signInWithGoogle } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/');
        }
    }, [user, router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Dekaiah Dash
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Private ride-sharing for the crew
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                            Phone Number (Optional)
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            placeholder="555-0123"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(e) => {
                                // Store in a local variable or state if needed, but for now we'll just grab it on click
                                // Actually, we need state. Let's refactor to use state.
                            }}
                        />
                        <p className="text-xs text-gray-500">
                            Enter your phone number to auto-fill it when requesting rides.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            const phoneInput = document.getElementById('phone') as HTMLInputElement;
                            signInWithGoogle(phoneInput.value);
                        }}
                        className="w-full flex justify-center py-6 text-lg"
                    >
                        Sign in with Google
                    </Button>
                </div>
            </div>
        </div>
    );
}
