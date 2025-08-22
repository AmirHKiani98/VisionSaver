from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings

logger = settings.APP_LOGGER
class ProgressConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.record_id = self.scope['url_route']['kwargs']['record_id']
        self.group_name = f"recording_progress_{self.record_id}"
        
        if self.channel_layer is not None:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.channel_layer is not None:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_progress(self, event):
        await self.send(text_data=json.dumps({
            "progress": event["progress"],
            "converting": event["converting"],
            "recording": event["recording"]
        }))

class CounterProgressConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.record_id = self.scope['url_route']['kwargs']['record_id']
        self.divide_time = self.scope['url_route']['kwargs']['divide_time']
        logger.info(f"Received record_id: {self.record_id}")
        logger.info(f"Received divide_time: {self.divide_time}")
        try:
            dt = float(self.divide_time)
            self.divide_time = f"{dt:.6g}"
        except Exception:
            logger.error(f"Invalid divide_time format: {self.divide_time}")
        self.version = self.scope['url_route']['kwargs']['version']
        self.group_name = f"detection_progress_{self.record_id}_{self.divide_time}_{self.version}"

        if self.channel_layer is not None:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.channel_layer is not None:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_progress(self, event):
        await self.send(text_data=json.dumps({
            "progress": event["progress"]
        }))

    
class CounterModifiedProgressConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.record_id = self.scope['url_route']['kwargs']['record_id']
        self.divide_time = self.scope['url_route']['kwargs']['divide_time']
        self.version = self.scope['url_route']['kwargs']['version']
        self.group_name = f"detection_loading_progress_{self.record_id}_{self.divide_time}_{self.version}"
        
        if self.channel_layer is not None:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.channel_layer is not None:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_progress(self, event):
        await self.send(text_data=json.dumps({
            "progress": event["progress"],
            "message": event.get("message", "")
        }))