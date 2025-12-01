'use client';

import DynamicMap from "@/components/dynamic-map";
import RideRequestForm from "@/components/ride-request-form";
import DriverView from "@/components/driver-view";
import ActiveRideCard from "@/components/active-ride-card";
import ActiveDriveCard from "@/components/active-drive-card";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { reverseGeocode } from "@/lib/geocoding";
import { getRoute } from "@/lib/routing";

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface Ride {
  id: string;
  passengerName: string;
  driverName?: string;
  pickupLocation: Location;
  dropoffLocation: Location;
  driverLocation?: Location;
  status: string;
}

import { ModeToggle } from "@/components/mode-toggle";
import Navbar from "@/components/navbar";
import WelcomeScreen from "@/components/welcome-screen";

export default function Home() {
  const { user, loading, role, toggleRole, logout } = useAuth();
  const router = useRouter();

  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [selectingMode, setSelectingMode] = useState<'pickup' | 'dropoff' | null>(null);

  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);

  // Fetch route when pickup and dropoff are set (for passenger preview)
  useEffect(() => {
    if (pickup && dropoff) {
      getRoute(pickup, dropoff).then(setRouteCoordinates);
    } else {
      setRouteCoordinates([]);
    }
  }, [pickup, dropoff]);

  // Fetch route for active ride
  useEffect(() => {
    if (activeRide) {
      getRoute(activeRide.pickupLocation, activeRide.dropoffLocation).then(setRouteCoordinates);
    }
  }, [activeRide]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Driver Tracking Logic
  useEffect(() => {
    if (role === 'driver' && activeRide && ['accepted', 'en_route', 'in_progress'].includes(activeRide.status)) {
      if (!navigator.geolocation) return;

      const lastUpdateRef = { current: 0 };

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Throttle updates to every 30 seconds
          const now = Date.now();
          if (now - lastUpdateRef.current < 30000) return;

          // Update Firestore
          try {
            await updateDoc(doc(db, 'rides', activeRide.id), {
              driverLocation: { lat: latitude, lng: longitude }
            });
            lastUpdateRef.current = now;
          } catch (error) {
            console.error("Error updating driver location:", error);
          }
        },
        (error) => console.error("Location error:", error),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [role, activeRide]);

  // Sync driver location from active ride for Passenger
  useEffect(() => {
    if (activeRide?.driverLocation) {
      setDriverLocation(activeRide.driverLocation);
    } else {
      setDriverLocation(null);
    }
  }, [activeRide]);

  // Listen for active ride (Passenger or Driver)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'rides'),
      where(role === 'passenger' ? 'passengerId' : 'driverId', '==', user.uid),
      where('status', 'in', ['requested', 'accepted', 'en_route', 'arrived', 'in_progress']),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const ride = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Ride;
        setActiveRide(ride);
      } else {
        setActiveRide(null);
      }
    });

    return () => unsubscribe();
  }, [user, role]);

  // Listen for available rides (Driver only)
  useEffect(() => {
    if (role === 'driver' && !activeRide) {
      const q = query(
        collection(db, 'rides'),
        where('status', '==', 'requested'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const rides = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Ride[];
        setAvailableRides(rides);
      });

      return () => unsubscribe();
    } else {
      setAvailableRides([]);
    }
  }, [role, activeRide]);

  const handleMapClick = async (lat: number, lng: number) => {
    console.log("Map clicked:", lat, lng);
    if (role === 'passenger' && !activeRide) {
      // Optimistic update with coords first
      const location = { lat, lng, address: "Loading address..." };

      if (selectingMode === 'pickup') {
        setPickup(location);
        setSelectingMode(null);
        // Fetch address
        const address = await reverseGeocode(lat, lng);
        console.log("Pickup address fetched:", address);
        setPickup(prev => prev ? { ...prev, address } : null);
      } else if (selectingMode === 'dropoff') {
        setDropoff(location);
        setSelectingMode(null);
        // Fetch address
        const address = await reverseGeocode(lat, lng);
        console.log("Dropoff address fetched:", address);
        setDropoff(prev => prev ? { ...prev, address } : null);
      }
    }
  };

  const handleRequestCreated = () => {
    setPickup(null);
    setDropoff(null);
  };

  if (loading) return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  let markers: Array<{ position: [number, number], title: string }> = [];

  if (activeRide) {
    markers = [
      { position: [activeRide.pickupLocation.lat, activeRide.pickupLocation.lng], title: "Pickup" },
      { position: [activeRide.dropoffLocation.lat, activeRide.dropoffLocation.lng], title: "Dropoff" }
    ];
  } else if (role === 'passenger') {
    markers = [
      ...(pickup ? [{ position: [pickup.lat, pickup.lng] as [number, number], title: "Pickup" }] : []),
      ...(dropoff ? [{ position: [dropoff.lat, dropoff.lng] as [number, number], title: "Dropoff" }] : [])
    ];
  } else {
    markers = availableRides.map(ride => ({
      position: [ride.pickupLocation.lat, ride.pickupLocation.lng] as [number, number],
      title: `Pickup: ${ride.passengerName}`
    }));
  }

  return (
    <main className="fixed inset-0 w-full h-dvh flex flex-col relative bg-background text-foreground overflow-hidden">
      <WelcomeScreen />
      <Navbar />

      <div className="flex-1 relative z-0 h-full">
        <DynamicMap
          onLocationSelect={handleMapClick}
          markers={markers}
          driverLocation={driverLocation || undefined}
          routeCoordinates={routeCoordinates}
        />
      </div>

      {/* Bottom Sheet / Form */}
      <div className="absolute bottom-0 left-0 right-0 z-[500] p-4 bg-transparent pointer-events-none">
        <div className="pointer-events-auto animate-in slide-in-from-bottom duration-500 fade-in">
          {activeRide ? (
            role === 'passenger' ? (
              <ActiveRideCard ride={activeRide} />
            ) : (
              <ActiveDriveCard ride={activeRide} />
            )
          ) : (
            role === 'passenger' ? (
              <RideRequestForm
                pickup={pickup}
                dropoff={dropoff}
                onPickupSelect={() => setSelectingMode('pickup')}
                onDropoffSelect={() => setSelectingMode('dropoff')}
                onRequestCreated={handleRequestCreated}
                setPickup={setPickup}
                setDropoff={setDropoff}
              />
            ) : (
              <DriverView rides={availableRides} />
            )
          )}
        </div>
      </div>

      {
        selectingMode && role === 'passenger' && !activeRide && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-black/75 text-white px-4 py-2 rounded-full animate-bounce">
            Tap map to select {selectingMode}
          </div>
        )
      }
    </main >
  );
}
