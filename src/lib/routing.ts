export async function getRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
): Promise<[number, number][]> {
    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates;
            // OSRM returns [lng, lat], Leaflet needs [lat, lng]
            return coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        }
        return [];
    } catch (error) {
        console.error("Error fetching route:", error);
        return [];
    }
}
