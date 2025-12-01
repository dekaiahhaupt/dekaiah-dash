'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const { user, role } = useAuth();
    const [name, setName] = useState(user?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpdate = async () => {
        if (!user) return;
        setLoading(true);
        setMessage('');

        try {
            await updateProfile(user, { displayName: name });
            // Also update in Firestore if we have a user document there (optional depending on architecture)
            // await updateDoc(doc(db, 'users', user.uid), { name });

            setMessage('Profile updated successfully!');
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-background text-foreground relative">
            <Navbar />
            <div className="container mx-auto px-4 pt-24 pb-8 flex justify-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>My Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center mb-6">
                                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl">
                                    {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input value={user?.email || ''} disabled />
                            </div>

                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Role</Label>
                                <div className="p-2 border rounded-md bg-muted capitalize">
                                    {role}
                                </div>
                            </div>

                            {message && (
                                <div className={`text-sm text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                    {message}
                                </div>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleUpdate}
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Save Changes'}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}
