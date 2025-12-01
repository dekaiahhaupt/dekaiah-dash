import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.dekaiahdash.app',
    appName: 'Dekaiah Dash',
    webDir: 'out',
    server: {
        // IMPORTANT: When testing on a real device, you must use a live URL or your computer's IP.
        // localhost will not work on the phone.
        // url: 'http://192.168.1.X:3000', 
        // For production, this should be your Vercel URL:
        // url: 'https://your-app.vercel.app',
        androidScheme: 'https'
    }
};

export default config;
