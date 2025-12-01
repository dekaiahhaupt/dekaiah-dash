'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MapPin } from 'lucide-react';

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface Ride {
    id: string;
    passengerName: string;
    passengerPhone?: string;
    status: string;
    pickupLocation: Location;
    dropoffLocation: Location;
}

interface ActiveDriveCardProps {
    ride: Ride;
}

export default function ActiveDriveCard({ ride }: ActiveDriveCardProps) {
    const updateStatus = async (newStatus: string) => {
        await updateDoc(doc(db, 'rides', ride.id), {
            status: newStatus,
            [`${newStatus}At`]: serverTimestamp(),
        });

        if (ride.passengerPhone) {
            let message = "";
            if (newStatus === 'en_route') message = "Driver is en route!";
            if (newStatus === 'arrived') message = "Driver has arrived!";
            if (newStatus === 'in_progress') message = "Ride started!";
            if (newStatus === 'completed') message = "Ride completed. Thanks for riding with Dekaiah Dash!";

            if (message) {
                await fetch('/api/sms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: ride.passengerPhone,
                        message: message,
                    }),
                });
            }
        }
    }


    const handleNavigate = () => {
        const destination = ride.status === 'in_progress' ? ride.dropoffLocation : ride.pickupLocation;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
        window.open(url, '_blank');
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl">
            <CardHeader>
                <CardTitle>Current Passenger: {ride.passengerName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                    <p><strong>Status:</strong> {ride.status.replace('_', ' ').toUpperCase()}</p>
                    <p><strong>Pickup:</strong> {ride.pickupLocation.address || `${ride.pickupLocation.lat.toFixed(4)}, ${ride.pickupLocation.lng.toFixed(4)}`}</p>
                    <p><strong>Dropoff:</strong> {ride.dropoffLocation.address || `${ride.dropoffLocation.lat.toFixed(4)}, ${ride.dropoffLocation.lng.toFixed(4)}`}</p>
                </div>

                <Button variant="outline" className="w-full gap-2" onClick={handleNavigate}>
                    <MapPin className="h-4 w-4" />
                    Navigate to {ride.status === 'in_progress' ? 'Dropoff' : 'Pickup'}
                </Button>

                <div className="grid grid-cols-1 gap-2 mt-4">
                    {ride.status === 'accepted' && (
                        <Button onClick={() => updateStatus('en_route')}>En Route</Button>
                    )}
                    {ride.status === 'en_route' && (
                        <Button onClick={() => updateStatus('arrived')}>Arrived</Button>
                    )}
                    {ride.status === 'arrived' && (
                        <Button onClick={() => updateStatus('in_progress')}>Start Ride</Button>
                    )}
                    {ride.status === 'in_progress' && (
                        <Button onClick={() => updateStatus('completed')} variant="default" className="bg-green-600 hover:bg-green-700">
                            Complete Ride
                        </Button>
                    )}
                </div>

                {['accepted', 'en_route', 'arrived'].includes(ride.status) && (
                    <Button
                        variant="destructive"
                        className="w-full mt-4"
                        onClick={async () => {
                            if (confirm("Are you sure you want to cancel this ride?")) {
                                await updateDoc(doc(db, 'rides', ride.id), {
                                    status: 'cancelled',
                                    cancelledAt: serverTimestamp(),
                                });
                            }
                        }}
                    >
                        Cancel Ride
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
