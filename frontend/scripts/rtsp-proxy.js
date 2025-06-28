const Stream = require('node-rtsp-stream');

// Get the RTSP URL from command line arguments
const streamUrl = process.argv[2];
const wsPort = process.argv[3] ? parseInt(process.argv[3], 10) : 9999;

if (!streamUrl) {
  console.error('Usage: node rtsp-proxy.js <rtsp-url> [ws-port]');
  process.exit(1);
}

const stream = new Stream({
  name: 'camera',
  streamUrl: streamUrl,
  wsPort: wsPort,
  ffmpegOptions: {
    '-stats': '',
    '-r': 30
  }
});

console.log(`Proxy started for ${streamUrl} on ws://localhost:${wsPort}`);