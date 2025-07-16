import base64
import asyncio
import cv2
import numpy as np
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncWebsocketConsumer
import logging

logger = logging.getLogger(__name__)

class MJPEGConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        params = parse_qs(query_string)
        self.rtsp_url = params.get('url', [None])[0]
        logger.info("Reading frame from: %s", self.rtsp_url)

        if not self.rtsp_url:
            await self.close()
            return

        await self.accept()
        self.running = True
        self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        asyncio.create_task(self.stream_video())  # spawn background task

    async def disconnect(self, close_code):
        self.running = False
        if hasattr(self, 'cap'):
            self.cap.release()

    async def stream_video(self):
        while self.running:
            ret, frame = await asyncio.to_thread(self.cap.read)
            if not ret:
                await asyncio.sleep(0.1)
                continue

            # JPEG encode off main loop
            _, jpeg = await asyncio.to_thread(cv2.imencode, '.jpg', frame)
            b64frame = base64.b64encode(jpeg.tobytes()).decode('utf-8')

            try:
                await self.send(text_data=b64frame)
            except Exception as e:
                logger.error("WebSocket send failed: %s", e)
                break

            await asyncio.sleep(0.01)  # ≈30 FPS (tune this if needed)
