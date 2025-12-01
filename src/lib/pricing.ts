export const BASE_FARE = 2.50;
export const COST_PER_KM = 1.25;
export const COST_PER_MINUTE = 0.25;

/**
 * Calculates the estimated cost of a ride.
 * @param distanceInMeters Distance in meters
 * @param durationInSeconds Duration in seconds
 * @returns Estimated cost in dollars (formatted string)
 */
export function calculateRideCost(distanceInMeters: number, durationInSeconds: number): string {
    const distanceKm = distanceInMeters / 1000;
    const durationMin = durationInSeconds / 60;

    const cost = BASE_FARE + (distanceKm * COST_PER_KM) + (durationMin * COST_PER_MINUTE);
    return cost.toFixed(2);
}

/**
 * Calculates the estimated duration of a ride.
 * Simple estimation: assuming average speed of 30km/h in city.
 * @param distanceInMeters Distance in meters
 * @returns Estimated duration in minutes (rounded)
 */
export function estimateDuration(distanceInMeters: number): number {
    // Average speed 30 km/h = 500 m/min
    const speedMetersPerMinute = 500;
    return Math.ceil(distanceInMeters / speedMetersPerMinute);
}
