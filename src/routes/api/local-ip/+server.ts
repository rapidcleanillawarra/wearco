
import { json } from '@sveltejs/kit';
import { networkInterfaces } from 'os';

export function GET() {
    const nets = networkInterfaces();
    let localIp = 'localhost';

    for (const name of Object.keys(nets)) {
        for (const net of nets[name] ?? []) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
                // Break after finding the first suitable IP
                break;
            }
        }
        if (localIp !== 'localhost') break;
    }

    return json({ ip: localIp });
}
