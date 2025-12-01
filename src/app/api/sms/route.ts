import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const adminNumber = process.env.ADMIN_PHONE_NUMBER; // The user's number

export async function OPTIONS() {
    return NextResponse.json({}, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function POST(request: Request) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (!accountSid || !authToken || !fromNumber) {
        return NextResponse.json({ error: 'Twilio not configured' }, { status: 500, headers });
    }

    try {
        const { to, message, isAdminAlert } = await request.json();

        const targetNumber = isAdminAlert ? adminNumber : to;

        if (!targetNumber) {
            return NextResponse.json({ error: 'No recipient number provided' }, { status: 400, headers });
        }

        await client.messages.create({
            body: message,
            from: fromNumber,
            to: targetNumber,
        });

        return NextResponse.json({ success: true }, { headers });
    } catch (error) {
        console.error('SMS Error:', error);
        return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500, headers });
    }
}
