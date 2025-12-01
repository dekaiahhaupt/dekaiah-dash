'use client';

import dynamic from 'next/dynamic';

interface DynamicMapProps {
    onLocationSelect?: (lat: number, lng: number) => void;
    markers?: Array<{ position: [number, number], title: string }>;
    driverLocation?: { lat: number; lng: number };
    routeCoordinates?: [number, number][];
}

const Map = dynamic(() => import('./map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">Loading Map...</div>
});

export default function DynamicMap({ onLocationSelect, markers, driverLocation, routeCoordinates }: DynamicMapProps) {
    return <Map onLocationSelect={onLocationSelect} markers={markers} driverLocation={driverLocation} routeCoordinates={routeCoordinates} />;
}
