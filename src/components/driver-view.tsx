'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface Ride {
    id: string;
    passengerName: string;
    passengerPhone?: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    status: string;
    scheduledTime?: string;
}

interface DriverViewProps {
    rides: Ride[];
}

export default function DriverView({ rides }: DriverViewProps) {
    const { user } = useAuth();

    const handleAcceptRide = async (ride: Ride) => {
        if (!user) return;
        try {
            const rideRef = doc(db, 'rides', ride.id);
            await updateDoc(rideRef, {
                driverId: user.uid,
                driverName: user.displayName || user.email,
                status: 'accepted',
                acceptedAt: serverTimestamp(),
            });

            if (ride.passengerPhone) {
                await fetch('/api/sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: ride.passengerPhone,
                        message: `Your ride has been accepted by ${user.displayName || 'Driver'}!`,
                    }),
                });
            }
        } catch (error) {
            console.error("Error accepting ride:", error);
        }
    };

    return (
        <div className="bg-card/90 backdrop-blur-xl p-6 rounded-t-xl shadow-2xl max-h-[50vh] overflow-y-auto text-card-foreground border-t border-white/20">
            <h2 className="text-xl font-bold mb-4">Available Rides</h2>
            {rides.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No rides requested currently.</p>
            ) : (
                <div className="space-y-4">
                    {rides.map((ride) => (
                        <Card key={ride.id} className="border-2 border-gray-100 dark:border-gray-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{ride.passengerName}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
                                    <p>📍 Pickup: {ride.pickupLocation.address || `${ride.pickupLocation.lat.toFixed(4)}, ${ride.pickupLocation.lng.toFixed(4)}`}</p>
                                    <p>🏁 Dropoff: {ride.dropoffLocation.address || `${ride.dropoffLocation.lat.toFixed(4)}, ${ride.dropoffLocation.lng.toFixed(4)}`}</p>
                                    {ride.scheduledTime && (
                                        <p className="text-blue-600 font-semibold mt-2">
                                            🕒 Scheduled: {new Date(ride.scheduledTime).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() => handleAcceptRide(ride)}
                                >
                                    Accept Ride
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
