/**
 * AnyDrop - Universal Cross-Platform File Transfer Server
 * Zero-dependency Node.js server: HTTP static files + WebSocket signaling & relay
 * Works across PC, iOS, and Android on ANY network (5G, LTE, Wi-Fi, Internet).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Track public tunnel URL if running in "Any Network" mode
let publicTunnelUrl = process.env.PUBLIC_URL || null;

// MIME types for static assets
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

// -------------------------------------------------------------
// Helper: Get local network IPv4 addresses
// -------------------------------------------------------------
function getLocalIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({ name, address: iface.address });
            }
        }
    }
    return ips;
}

// -------------------------------------------------------------
// Helper: Start OpenSSH Public Tunnel for "Any Network" Mode
// -------------------------------------------------------------
function startPublicTunnel() {
    console.log('\n[Anywhere Engine] Initiating secure public HTTPS tunnel...');
    console.log('[Anywhere Engine] Connecting via OpenSSH to public gateway...');

    const ssh = spawn('ssh', [
        '-p', '443',
        '-R0:localhost:' + PORT,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ServerAliveInterval=30',
        'a.pinggy.io'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });

    let detected = false;

    ssh.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        // Look for Pinggy public HTTPS URL
        const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.(?:a\.)?pinggy\.(?:link|online|io)/i);
        if (match && !detected) {
            detected = true;
            publicTunnelUrl = match[0];
            console.log('\n================================================================');
            console.log('   🌍 ANYDROP PUBLIC ACCESS IS LIVE (WORKS ON ANY NETWORK!)     ');
            console.log('================================================================');
            console.log(`\n• Global Public HTTPS URL:`);
            console.log(`  👉  ${publicTunnelUrl}  👈\n`);
            console.log('• Use this URL on iPhone (Safari), Android (Chrome), or any PC');
            console.log('• Works across Cellular 5G/4G, LTE, Different Wi-Fi, Anywhere!');
            console.log('================================================================\n');
        }
    });

    ssh.stderr.on('data', () => {});

    ssh.on('error', (err) => {
        console.log('[Anywhere Engine] Notice: Automatic SSH tunnel process not started:', err.message);
        console.log('[Anywhere Engine] Local Wi-Fi and direct network modes are still active.');
    });

    ssh.on('close', () => {
        if (detected) {
            console.log('[Anywhere Engine] Tunnel closed. Reconnecting in 5 seconds...');
            setTimeout(startPublicTunnel, 5000);
        }
    });
}

// -------------------------------------------------------------
// HTTP Request Handler
// -------------------------------------------------------------
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // API endpoint to get server info, network IPs, and Public Tunnel URL
    if (req.url === '/api/info') {
        // Detect if behind a proxy / cloud host (Render, Railway, Cloudflare, etc.)
        let proxyPublicUrl = null;
        if (req.headers['x-forwarded-host']) {
            const proto = req.headers['x-forwarded-proto'] || 'https';
            proxyPublicUrl = `${proto}://${req.headers['x-forwarded-host']}`;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status: 'online',
            port: PORT,
            ips: getLocalIPs(),
            publicUrl: publicTunnelUrl || proxyPublicUrl,
            timestamp: Date.now()
        }));
    }

    // Normalize URL and serve static files
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') safeUrl = '/index.html';
    const filePath = path.join(PUBLIC_DIR, safeUrl);

    // Prevent directory traversal
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            const indexPath = path.join(PUBLIC_DIR, 'index.html');
            fs.readFile(indexPath, (err2, content) => {
                if (err2) {
                    res.writeHead(404);
                    return res.end('File Not Found');
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(content);
            });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

// -------------------------------------------------------------
// RFC 6455 WebSocket Implementation with Fallback Relay
// -------------------------------------------------------------
const rooms = new Map(); // roomId -> Set of clients
const clients = new Map(); // socket -> clientInfo { id, roomId, role, socket }

function generateClientId() {
    return 'client_' + Math.random().toString(36).substring(2, 9);
}

function sendWsFrame(socket, data, isBinary = false) {
    if (socket.destroyed || !socket.writable) return;
    const payload = isBinary ? Buffer.from(data) : Buffer.from(typeof data === 'string' ? data : JSON.stringify(data));
    const length = payload.length;

    let header;
    const opcode = isBinary ? 0x82 : 0x81;

    if (length < 126) {
        header = Buffer.alloc(2);
        header[0] = opcode;
        header[1] = length;
    } else if (length <= 65535) {
        header = Buffer.alloc(4);
        header[0] = opcode;
        header[1] = 126;
        header.writeUInt16BE(length, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = opcode;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(length), 2);
    }

    try {
        socket.write(Buffer.concat([header, payload]));
    } catch (e) {
        // Socket write error handled in disconnect
    }
}

server.on('upgrade', (req, socket, head) => {
    const key = req.headers['sec-websocket-key'];
    if (!key) {
        socket.destroy();
        return;
    }

    const digest = crypto.createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

    const headers = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${digest}`,
        '\r\n'
    ];

    socket.write(headers.join('\r\n'));

    const client = {
        id: generateClientId(),
        roomId: null,
        role: null,
        socket: socket
    };
    clients.set(socket, client);

    sendWsFrame(socket, { type: 'welcome', clientId: client.id });

    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        while (buffer.length >= 2) {
            const firstByte = buffer[0];
            const secondByte = buffer[1];
            const opcode = firstByte & 0x0f;
            const isMasked = (secondByte & 0x80) === 0x80;
            let payloadLen = secondByte & 0x7f;
            let offset = 2;

            if (payloadLen === 126) {
                if (buffer.length < 4) break;
                payloadLen = buffer.readUInt16BE(2);
                offset = 4;
            } else if (payloadLen === 127) {
                if (buffer.length < 10) break;
                payloadLen = Number(buffer.readBigUInt64BE(2));
                offset = 10;
            }

            const maskLen = isMasked ? 4 : 0;
            const totalFrameLen = offset + maskLen + payloadLen;

            if (buffer.length < totalFrameLen) {
                break;
            }

            let mask = null;
            if (isMasked) {
                mask = buffer.slice(offset, offset + 4);
                offset += 4;
            }

            const payload = buffer.slice(offset, offset + payloadLen);

            if (isMasked) {
                for (let i = 0; i < payload.length; i++) {
                    payload[i] ^= mask[i % 4];
                }
            }

            buffer = buffer.slice(totalFrameLen);

            if (opcode === 0x08) {
                socket.end();
                return;
            } else if (opcode === 0x09) {
                socket.write(Buffer.from([0x8A, 0x00]));
            } else if (opcode === 0x01 || opcode === 0x02) {
                handleClientMessage(client, payload, opcode === 0x02);
            }
        }
    });

    socket.on('close', () => handleClientDisconnect(client));
    socket.on('error', () => handleClientDisconnect(client));
});

function handleClientMessage(client, payload, isBinary) {
    if (isBinary) {
        // Direct binary chunk relay across any network
        if (!client.roomId) return;
        const roomPeers = rooms.get(client.roomId);
        if (!roomPeers) return;
        for (const peer of roomPeers) {
            if (peer.id !== client.id) {
                sendWsFrame(peer.socket, payload, true);
            }
        }
        return;
    }

    let message;
    try {
        message = JSON.parse(payload.toString('utf-8'));
    } catch (e) {
        return;
    }

    switch (message.type) {
        case 'join': {
            const { roomId, role } = message;
            if (!roomId) return;

            if (client.roomId && rooms.has(client.roomId)) {
                rooms.get(client.roomId).delete(client);
            }

            client.roomId = roomId.toUpperCase().trim();
            client.role = role || 'peer';

            if (!rooms.has(client.roomId)) {
                rooms.set(client.roomId, new Set());
            }

            const room = rooms.get(client.roomId);
            room.add(client);

            const peersInRoom = Array.from(room)
                .filter(c => c.id !== client.id)
                .map(c => ({ id: c.id, role: c.role }));

            sendWsFrame(client.socket, {
                type: 'joined',
                roomId: client.roomId,
                role: client.role,
                peers: peersInRoom
            });

            for (const peer of room) {
                if (peer.id !== client.id) {
                    sendWsFrame(peer.socket, {
                        type: 'peer-joined',
                        peerId: client.id,
                        role: client.role
                    });
                }
            }
            break;
        }

        case 'signal': {
            const { targetPeerId, signalData } = message;
            if (!client.roomId) return;
            const room = rooms.get(client.roomId);
            if (!room) return;

            for (const peer of room) {
                if (peer.id === targetPeerId) {
                    sendWsFrame(peer.socket, {
                        type: 'signal',
                        fromPeerId: client.id,
                        signalData: signalData
                    });
                    break;
                }
            }
            break;
        }

        case 'file-meta':
        case 'transfer-accept':
        case 'transfer-decline':
        case 'transfer-cancel':
        case 'start-file':
        case 'end-file':
        case 'transfer-complete': {
            if (!client.roomId) return;
            const room = rooms.get(client.roomId);
            if (!room) return;

            for (const peer of room) {
                if (peer.id !== client.id) {
                    sendWsFrame(peer.socket, {
                        ...message,
                        fromPeerId: client.id
                    });
                }
            }
            break;
        }
    }
}

function handleClientDisconnect(client) {
    if (client.roomId && rooms.has(client.roomId)) {
        const room = rooms.get(client.roomId);
        room.delete(client);

        for (const peer of room) {
            sendWsFrame(peer.socket, {
                type: 'peer-left',
                peerId: client.id,
                role: client.role
            });
        }

        if (room.size === 0) {
            rooms.delete(client.roomId);
        }
    }
    clients.delete(client.socket);
}

// -------------------------------------------------------------
// Start Server
// -------------------------------------------------------------
server.listen(PORT, '0.0.0.0', () => {
    const ips = getLocalIPs();
    const isAnywhereMode = process.argv.includes('--anywhere') || process.argv.includes('--tunnel') || process.env.ANYWHERE === '1';

    console.log('\n======================================================');
    console.log('   🚀 AnyDrop - Universal File Transfer Engine        ');
    console.log('======================================================');
    console.log(`\n• Local Access (this PC):`);
    console.log(`  http://localhost:${PORT}`);
    
    console.log(`\n• Same Wi-Fi Network Access:`);
    if (ips.length > 0) {
        ips.forEach(ip => {
            console.log(`  http://${ip.address}:${PORT}  (${ip.name})`);
        });
    } else {
        console.log(`  http://<your-ip>:${PORT}`);
    }

    console.log('\n• WebRTC Direct P2P: ENABLED (Multi-STUN + OpenRelay TURN)');
    console.log('• WebSocket Relay Fallback: ENABLED (Guaranteed on ANY network)');

    if (isAnywhereMode) {
        startPublicTunnel();
    } else {
        console.log('\n[Tip] To enable Any-Network Global Mode (5G / LTE / anywhere on Earth):');
        console.log('      Double-click "start-anywhere.bat" or run: node server.js --anywhere\n');
    }
});
