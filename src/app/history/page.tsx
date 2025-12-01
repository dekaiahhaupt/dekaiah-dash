'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Ride {
    id: string;
    createdAt: any;
    pickupLocation: { address?: string };
    dropoffLocation: { address?: string };
    status: string;

    driverName?: string;
    passengerName?: string;
}

export default function HistoryPage() {
    const { user, role } = useAuth();
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const q = query(
                    collection(db, 'rides'),
                    where(role === 'passenger' ? 'passengerId' : 'driverId', '==', user.uid),
                    orderBy('createdAt', 'desc')
                );

                const snapshot = await getDocs(q);
                const historyData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Ride[];

                setRides(historyData);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user, role]);

    return (
        <main className="min-h-screen bg-background text-foreground relative">
            <Navbar />
            <div className="container mx-auto px-4 pt-24 pb-8">
                <h1 className="text-3xl font-bold mb-6">Ride History</h1>

                {loading ? (
                    <div className="flex justify-center p-8">Loading history...</div>
                ) : rides.length === 0 ? (
                    <div className="text-center text-muted-foreground p-8">No rides found.</div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {rides.map((ride, index) => (
                            <motion.div
                                key={ride.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">
                                                {format(ride.createdAt?.toDate() || new Date(), 'MMM d, yyyy h:mm a')}
                                            </CardTitle>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize 
                                                ${ride.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                                    ride.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                                                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'}`}>
                                                {ride.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-2">
                                        <div>
                                            <span className="font-semibold text-green-600">Pickup:</span>
                                            <p className="truncate">{ride.pickupLocation.address || 'Unknown'}</p>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-red-600">Dropoff:</span>
                                            <p className="truncate">{ride.dropoffLocation.address || 'Unknown'}</p>
                                        </div>

                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
