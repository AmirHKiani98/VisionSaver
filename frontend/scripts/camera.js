class Camera {
    constructor(protocol, ip, channel, streamUrl) {
        this.protocol = protocol; // e.g., 'rtsp', 'http'
        this.ip = ip; // IP address of the camera
        this.channel = channel || 'quad'; // Default channel if not provided
        this.streamUrl = streamUrl; // URL to access the camera stream
        
        if (!this.ip) {
            throw new Error('IP address is required');
        }
        if (!this.protocol) {
            throw new Error('Protocol is required');
        }
        if (!this.streamUrl) {
            this.streamUrl = `${this.protocol}://${this.ip}/${this.channel}`; // Default stream URL
        }
        // Generate a unique ID for the camera
        this.id = `camera-${this.protocol}-${this.ip}-${this.channel}`;
    }
}