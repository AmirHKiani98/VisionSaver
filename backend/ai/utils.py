import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def test_websocket_progress(record_id, divide_time, version, progress=50.0):
    """
    Helper function to test WebSocket progress updates.
    Call this function to send a test progress update.
    """
    # Format divide_time to match the WebSocket group name format
    if isinstance(divide_time, (int, float)):
        divide_time_str = f"{float(divide_time):.6g}"
    else:
        divide_time_str = divide_time
        
    # Get the group name for the WebSocket
    group = f"detection_progress_{record_id}_{divide_time_str}_{version}"
    
    # Get the channel layer
    channel_layer = get_channel_layer()
    if not channel_layer:
        print("Channel layer not available. Check if Channels is configured correctly.")
        return False
        
    try:
        # Send a test progress update
        payload = {"type": "send_progress", "progress": float(progress)}
        async_to_sync(channel_layer.group_send)(group, payload)
        print(f"Test progress update sent: {progress}% to group: {group}")
        print(f"Payload: {json.dumps(payload)}")
        return True
    except Exception as e:
        print(f"Error sending test progress update: {e}")
        return False
