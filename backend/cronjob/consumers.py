from channels.generic.websocket import AsyncWebsocketConsumer
import json

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
        self.group_name = f"counter_progress_{self.record_id}"
        
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