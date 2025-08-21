# Simple utility for fixing WebSocket communication in the detection pipeline

def fix_ws_send_progress(old_method):
    """
    Wrap the _send_ws_progress method to use the correct type.
    This is a decorator that will fix the 'type' field in the payload.
    """
    def wrapper(self, group, progress, message=None):
        # Original method code with fixed type
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        import logging
        logger = logging.getLogger("django")
        
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
                
            # Fixed type: "send_progress" instead of "send.progress"
            payload = {"type": "send_progress", "progress": float(progress)}
            if message is not None:
                payload["message"] = message
                
            logger.info(f"[WebSocket] Sending progress {progress}% to group {group}")
            async_to_sync(channel_layer.group_send)(group, payload)
        except Exception as e:
            logger.error(f"[WebSocket] Error sending progress: {e}")
    
    return wrapper
