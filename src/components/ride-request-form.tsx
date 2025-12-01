import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { searchAddress, calculateDistance } from '@/lib/geocoding';
import { calculateRideCost, estimateDuration } from '@/lib/pricing';
import { sendSMS } from '@/lib/sms';
import { motion, AnimatePresence } from 'framer-motion';

interface Location {
    lat: number;
    lng: number;
    address?: string;
}

interface RideRequestFormProps {
    pickup: Location | null;
    dropoff: Location | null;
    onPickupSelect: () => void;
    onDropoffSelect: () => void;
    onRequestCreated: () => void;
    setPickup: (loc: Location | null) => void;
    setDropoff: (loc: Location | null) => void;
}

export default function RideRequestForm({
    pickup,
    dropoff,
    onPickupSelect,
    onDropoffSelect,
    onRequestCreated,
    setPickup,
    setDropoff
}: RideRequestFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');

    useEffect(() => {
        if (user) {
            // Try to get phone from Firestore if not already set
            const fetchPhone = async () => {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().phoneNumber) {
                    setPhone(docSnap.data().phoneNumber);
                }
            };
            fetchPhone();
        }
    }, [user]);

    // Search State
    const [pickupQuery, setPickupQuery] = useState('');
    const [dropoffQuery, setDropoffQuery] = useState('');
    const [pickupSuggestions, setPickupSuggestions] = useState<any[]>([]);
    const [dropoffSuggestions, setDropoffSuggestions] = useState<any[]>([]);
    const [activeSearch, setActiveSearch] = useState<'pickup' | 'dropoff' | null>(null);

    // Estimation State
    const [estimatedDuration, setEstimatedDuration] = useState<string | null>(null);

    // Scheduled Ride State
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledTime, setScheduledTime] = useState('');

    // Sync props to local state when map selection happens
    useEffect(() => {
        if (pickup?.address) setPickupQuery(pickup.address);
        else if (pickup) setPickupQuery(`${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`);
    }, [pickup]);

    useEffect(() => {
        if (dropoff?.address) setDropoffQuery(dropoff.address);
        else if (dropoff) setDropoffQuery(`${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`);
    }, [dropoff]);

    // Calculate Estimates
    useEffect(() => {
        if (pickup && dropoff) {
            const distance = calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
            const duration = estimateDuration(distance);
            setEstimatedDuration(`${duration} mins`);
        } else {
            setEstimatedDuration(null);
        }
    }, [pickup, dropoff]);

    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.log("Error getting location for search bias:", error)
            );
        }
    }, []);

    // Debounced Search Effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (activeSearch === 'pickup' && pickupQuery.length > 2) {
                const results = await searchAddress(pickupQuery, userLocation?.lat, userLocation?.lng);
                setPickupSuggestions(results);
            } else if (activeSearch === 'dropoff' && dropoffQuery.length > 2) {
                const results = await searchAddress(dropoffQuery, userLocation?.lat, userLocation?.lng);
                setDropoffSuggestions(results);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [pickupQuery, dropoffQuery, activeSearch, userLocation]);

    const handleSearch = (query: string, type: 'pickup' | 'dropoff') => {
        if (type === 'pickup') {
            setPickupQuery(query);
            if (query.length <= 2) setPickupSuggestions([]);
        } else {
            setDropoffQuery(query);
            if (query.length <= 2) setDropoffSuggestions([]);
        }
        setActiveSearch(type);
    };

    const selectSuggestion = (item: any, type: 'pickup' | 'dropoff') => {
        const location = { lat: item.lat, lng: item.lng, address: item.display_name };
        if (type === 'pickup') {
            setPickup(location);
            setPickupQuery(item.display_name);
            setPickupSuggestions([]);
        } else {
            setDropoff(location);
            setDropoffQuery(item.display_name);
            setDropoffSuggestions([]);
        }
        setActiveSearch(null); // Stop searching
    };

    const handleRequestRide = async () => {
        if (!user || !pickup || !dropoff || !phone) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'rides'), {
                passengerId: user.uid,
                passengerName: user.displayName || user.email,
                passengerPhone: phone,
                status: 'requested',
                pickupLocation: pickup,
                dropoffLocation: dropoff,

                estimatedTime: estimatedDuration,
                scheduledTime: isScheduled && scheduledTime ? new Date(scheduledTime).toISOString() : null,
                createdAt: serverTimestamp(),
            });

            // Send SMS to Admin/Driver
            const timeMsg = isScheduled && scheduledTime ? `Scheduled for: ${new Date(scheduledTime).toLocaleString()}` : "Time: Now";
            await sendSMS(
                '', // 'to' is ignored when isAdminAlert is true
                `New Ride Request from ${user.displayName || 'Passenger'}!
Pickup: ${pickup.address || 'Location Selected'}
${timeMsg}

View Ride: dash.drhaupt.ca`,
                true // isAdminAlert
            );

            onRequestCreated();
        } catch (error) {
            console.error("Error requesting ride:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <Card className="w-full max-w-md mx-auto shadow-2xl border-t-4 border-t-primary/80 bg-card/90 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Request a Ride</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg border border-border">
                        {estimatedDuration && (
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Est. Time</span>
                                <span className="font-semibold">{estimatedDuration}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant={isScheduled ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsScheduled(!isScheduled)}
                            className="w-full"
                        >
                            {isScheduled ? "Schedule for Later" : "Ride Now"}
                        </Button>
                    </div>

                    {isScheduled && (
                        <AnimatePresence>
                            <motion.div
                                initial={{ height: 0, opacity: 0, y: -10 }}
                                animate={{ height: 'auto', opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: -10 }}
                                className="space-y-2 overflow-hidden"
                            >
                                <Label>Pickup Time</Label>
                                <Input
                                    type="datetime-local"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                />
                            </motion.div>
                        </AnimatePresence>
                    )}

                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                            type="tel"
                            placeholder="555-0123"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 relative">
                        <Label>Pickup Location</Label>
                        <div className="flex gap-2">
                            <Input
                                value={pickupQuery}
                                onChange={(e) => handleSearch(e.target.value, 'pickup')}
                                placeholder="Type address or tap map"
                                onFocus={() => setActiveSearch('pickup')}
                            />
                            <Button variant={pickup ? "outline" : "default"} onClick={onPickupSelect}>
                                Map
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    if (userLocation) {
                                        const loc = { lat: userLocation.lat, lng: userLocation.lng, address: "Current Location" };
                                        setPickup(loc);
                                        setPickupQuery("Current Location");
                                        // Optionally fetch address
                                        searchAddress(`${userLocation.lat},${userLocation.lng}`, undefined, undefined).then(res => {
                                            if (res && res.length > 0) {
                                                setPickup({ ...loc, address: res[0].display_name });
                                                setPickupQuery(res[0].display_name);
                                            }
                                        });
                                    } else {
                                        alert("Location not found yet. Please wait.");
                                    }
                                }}
                            >
                                📍
                            </Button>
                        </div>
                        {activeSearch === 'pickup' && pickupSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-popover text-popover-foreground border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                {pickupSuggestions.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm transition-colors"
                                        onClick={() => selectSuggestion(item, 'pickup')}
                                    >
                                        {item.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 relative">
                        <Label>Dropoff Location</Label>
                        <div className="flex gap-2">
                            <Input
                                value={dropoffQuery}
                                onChange={(e) => handleSearch(e.target.value, 'dropoff')}
                                placeholder="Type address or tap map"
                                onFocus={() => setActiveSearch('dropoff')}
                            />
                            <Button variant={dropoff ? "outline" : "default"} onClick={onDropoffSelect}>
                                Map
                            </Button>
                        </div>
                        {activeSearch === 'dropoff' && dropoffSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-popover text-popover-foreground border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                                {dropoffSuggestions.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm transition-colors"
                                        onClick={() => selectSuggestion(item, 'dropoff')}
                                    >
                                        {item.display_name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button
                        className="w-full mt-4"
                        size="lg"
                        disabled={!pickup || !dropoff || !phone || loading}
                        onClick={handleRequestRide}
                    >
                        {loading ? "Requesting..." : (isScheduled ? "Schedule Ride" : "Request Ride")}
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
}
