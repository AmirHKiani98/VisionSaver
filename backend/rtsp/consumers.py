import base64
import cv2
import numpy as np
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer

class MJPEGConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        params = parse_qs(query_string)
        self.rtsp_url = params.get('url', [None])[0]

        if not self.rtsp_url:
            await self.close()
            return

        await self.accept()
        self.running = True
        await self.stream_video()

    async def disconnect(self, close_code):
        self.running = False

    async def stream_video(self):
        cap = cv2.VideoCapture(self.rtsp_url)  # ✅ Fixed this line
        while self.running:
            ret, frame = cap.read()
            if not ret:
                continue
            _, jpeg = cv2.imencode('.jpg', frame)
            b64frame = base64.b64encode(jpeg.tobytes()).decode('utf-8')
            await self.send(text_data=b64frame)
        cap.release()
