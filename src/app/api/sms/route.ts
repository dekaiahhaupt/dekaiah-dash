import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const adminNumber = process.env.ADMIN_PHONE_NUMBER; // The user's number

export async function POST(request: Request) {
    if (!accountSid || !authToken || !fromNumber) {
        return NextResponse.json({ error: 'Twilio not configured' }, { status: 500 });
    }

    try {
        const { to, message, isAdminAlert } = await request.json();

        const targetNumber = isAdminAlert ? adminNumber : to;

        if (!targetNumber) {
            return NextResponse.json({ error: 'No recipient number provided' }, { status: 400 });
        }

        await client.messages.create({
            body: message,
            from: fromNumber,
            to: targetNumber,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('SMS Error:', error);
        return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
    }
}
