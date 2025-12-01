'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from 'next-themes';

// Fix for default marker icons in Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});

interface MapProps {
    center?: [number, number];
    zoom?: number;
    markers?: Array<{
        position: [number, number];
        title?: string;
    }>;
    driverLocation?: { lat: number; lng: number };
    routeCoordinates?: [number, number][];
    onLocationSelect?: (lat: number, lng: number) => void;
}

const pickupIcon = L.divIcon({
    className: 'custom-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const dropoffIcon = L.divIcon({
    className: 'custom-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`,
    iconSize: [32, 32],
    iconAnchor: [4, 32],
    popupAnchor: [0, -32]
});

const carIcon = L.divIcon({
    className: 'custom-icon',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#f59e0b" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h2v-6h10v6h2"/></svg>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

function LocationMarker({ onSelect }: { onSelect?: (lat: number, lng: number) => void }) {
    const map = useMap();

    useMapEvents({
        click(e) {
            if (onSelect) {
                onSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });

    useEffect(() => {
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, map.getZoom());
        });
    }, [map]);

    return null;
}



export default function Map({ center = [51.505, -0.09], zoom = 13, markers = [], driverLocation, routeCoordinates, onLocationSelect }: MapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setUserPosition([position.coords.latitude, position.coords.longitude]);
            },
            (error) => console.error("Error watching position:", error),
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    if (!isMounted) {
        return <div className="h-full w-full bg-gray-100 dark:bg-slate-900 animate-pulse flex items-center justify-center text-gray-500">Loading Map...</div>;
    }

    const isDark = resolvedTheme === 'dark';

    const userIcon = L.divIcon({
        className: 'user-location-dot-container',
        html: '<div class="user-location-dot"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });

    return (
        <div className={`h-full w-full ${isDark ? 'dark-map-tiles' : ''}`}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', background: isDark ? '#242424' : '#ddd' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {markers.map((marker, idx) => {
                    let icon: any = defaultIcon;
                    if (marker.title?.toLowerCase().includes('pickup')) icon = pickupIcon;
                    if (marker.title?.toLowerCase().includes('dropoff')) icon = dropoffIcon;

                    return (
                        <Marker key={idx} position={marker.position} icon={icon}>
                            {marker.title && <Popup>{marker.title}</Popup>}
                        </Marker>
                    );
                })}
                {routeCoordinates && routeCoordinates.length > 0 && (
                    <Polyline
                        positions={routeCoordinates}
                        pathOptions={{ color: 'blue', weight: 4, opacity: 0.7 }}
                    />
                )}
                {driverLocation && (
                    <Marker position={[driverLocation.lat, driverLocation.lng]} icon={carIcon as any} zIndexOffset={1000}>
                        <Popup>Driver</Popup>
                    </Marker>
                )}
                {userPosition && (
                    <Marker position={userPosition} icon={userIcon as any} zIndexOffset={900}>
                        <Popup>You are here</Popup>
                    </Marker>
                )}
                <LocationMarker onSelect={onLocationSelect} />
            </MapContainer>
        </div>
    );
}
