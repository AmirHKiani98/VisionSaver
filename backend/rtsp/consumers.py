import base64
import asyncio
import cv2
import numpy as np
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
class MJPEGConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        params = parse_qs(query_string)
        self.rtsp_url = params.get('url', [None])[0]
        print(f"Connecting to RTSP URL: {self.rtsp_url}")
        if not self.rtsp_url:
            await self.close()
            return

        await self.accept()
        self.running = True
        await asyncio.to_thread(self.stream_video)

    async def disconnect(self, close_code):
        self.running = False

    def stream_video(self):
        cap = cv2.VideoCapture(self.rtsp_url)
        while self.running:
            ret, frame = cap.read()
            if not ret:
                continue
            _, jpeg = cv2.imencode('.jpg', frame)
            b64frame = base64.b64encode(jpeg.tobytes()).decode('utf-8')
            # send frame back to client
            asyncio.run_coroutine_threadsafe(self.send_safe(b64frame),
                                             self.channel_layer.loop) # type: ignore
        cap.release()

    @database_sync_to_async
    def send_safe(self, frame):
        return self.send(text_data=frame)