// In a real mobile app, this should point to your production URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function sendSMS(to: string, message: string, isAdminAlert: boolean = false) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/sms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, message, isAdminAlert }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to send SMS:", error);
    }
}
