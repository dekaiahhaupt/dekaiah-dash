export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        console.log(`Geocoding: ${lat}, ${lng}`);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'DekaiahDash/1.0', // Nominatim requires a User-Agent
                },
            }
        );
        const data = await response.json();
        console.log("Geocoding response:", data);

        if (data.error) {
            return "Unknown Location";
        }

        // Construct a readable address
        const { road, house_number, suburb, city, town, village } = data.address;
        const street = road ? `${house_number ? house_number + ' ' : ''}${road}` : '';
        const area = suburb || city || town || village || '';

        const result = (street && area) ? `${street}, ${area}` : (street || area || data.display_name.split(',')[0]);
        console.log("Formatted address:", result);
        return result;
    } catch (error) {
        console.error("Geocoding error:", error);
        return "Location selected";
    }
}
export async function searchAddress(query: string, centerLat?: number, centerLng?: number): Promise<Array<{ lat: number; lng: number; display_name: string }>> {
    try {
        if (query.length < 3) return [];

        // Default to Calgary if no location provided
        const targetLat = centerLat || 51.0447;
        const targetLng = centerLng || -114.0719;

        // Construct viewbox (approx 50km box)
        const viewbox = `${targetLng - 0.5},${targetLat + 0.5},${targetLng + 0.5},${targetLat - 0.5}`;

        // Add countrycodes=ca to restrict to Canada
        // Use 'q' for general query which covers addresses and POIs (businesses)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&countrycodes=ca&viewbox=${viewbox}&bounded=0`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'DekaiahDash/1.0',
            },
        });
        const data = await response.json();

        let results = data.map((item: any) => ({
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            display_name: item.display_name
        }));

        // Client-side sort by distance
        results.sort((a: any, b: any) => {
            const distA = Math.sqrt(Math.pow(a.lat - targetLat, 2) + Math.pow(a.lng - targetLng, 2));
            const distB = Math.sqrt(Math.pow(b.lat - targetLat, 2) + Math.pow(b.lng - targetLng, 2));
            return distA - distB;
        });

        return results.slice(0, 5); // Return top 5 after sorting
    } catch (error) {
        console.error("Search error:", error);
        return [];
    }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}
