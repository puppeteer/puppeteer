import asyncio
import json
import os
import websockets

port = os.getenv('PORT', 8080)

async def test_launch(uri):
    async with websockets.connect(uri) as websocket:
        command = {}
        await websocket.send(json.dumps(command))
        resp = await websocket.recv()
        assert isinstance(resp, str)
        resp = json.loads(resp)
        assert isinstance(resp, dict)

asyncio.get_event_loop().run_until_complete(
    test_launch(f'ws://localhost:{port}'))
