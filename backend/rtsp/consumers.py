import base64
import cv2
import numpy as np
from urllib.parse import unquote
from channels.generic.websocket import AsyncWebsocketConsumer

class MJPEGConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.url = unquote(self.scope['url_route']['kwargs']['url'])
        await self.accept()
        self.running = True
        await self.stream_video()

    async def disconnect(self, close_code):
        self.running = False

    async def stream_video(self):
        cap = cv2.VideoCapture(self.url)
        while self.running:
            ret, frame = cap.read()
            if not ret:
                continue
            _, jpeg = cv2.imencode('.jpg', frame)
            b64frame = base64.b64encode(jpeg.tobytes()).decode('utf-8')
            await self.send(text_data=b64frame)
        cap.release()