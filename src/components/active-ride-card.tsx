'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface Ride {
    id: string;
    driverName?: string;
    status: string;
    pickupLocation: Location;
    dropoffLocation: Location;
}

interface ActiveRideCardProps {
    ride: Ride;
}

export default function ActiveRideCard({ ride }: ActiveRideCardProps) {
    const [rating, setRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const handleCancel = async () => {
        if (confirm("Are you sure you want to cancel?")) {
            await updateDoc(doc(db, 'rides', ride.id), {
                status: 'cancelled',
                cancelledAt: serverTimestamp(),
            });
        }
    };

    const handleRatingSubmit = async () => {
        if (rating === 0) return;
        try {
            await updateDoc(doc(db, 'rides', ride.id), {
                rating: rating,
                ratedAt: serverTimestamp()
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Error submitting rating:", error);
        }
    };

    const getStatusMessage = (status: string) => {
        switch (status) {
            case 'requested': return "Waiting for a driver...";
            case 'accepted': return `${ride.driverName} accepted your ride!`;
            case 'en_route': return `${ride.driverName} is on the way!`;
            case 'arrived': return `${ride.driverName} has arrived!`;
            case 'in_progress': return "Ride in progress";
            case 'completed': return "Ride completed";
            default: return "Unknown status";
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-xl">
            <CardHeader>
                <CardTitle>Current Ride</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center py-4">
                    <h3 className="text-xl font-bold text-blue-600 mb-2">
                        {getStatusMessage(ride.status)}
                    </h3>
                    {ride.driverName && (
                        <p className="text-gray-600">Driver: {ride.driverName}</p>
                    )}
                </div>

                {['requested', 'accepted', 'en_route', 'arrived'].includes(ride.status) && (
                    <Button variant="destructive" className="w-full" onClick={handleCancel}>
                        Cancel Ride
                    </Button>
                )}

                {ride.status === 'completed' && !submitted && (
                    <div className="flex flex-col items-center gap-4 mt-4">
                        <p className="font-medium">Rate your driver</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-2xl transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleRatingSubmit} disabled={rating === 0} className="w-full">
                            Submit Rating
                        </Button>
                    </div>
                )}

                {ride.status === 'completed' && submitted && (
                    <div className="text-center text-green-600 font-medium mt-4">
                        Thank you for your feedback!
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
