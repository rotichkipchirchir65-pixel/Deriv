# websocket_client.py

import websocket
import json
from config import DERIV_WS_URL

class DerivWebSocket:
    def __init__(self, on_tick_callback, symbol):
        self.symbol = symbol
        self.ws = websocket.WebSocketApp(
            DERIV_WS_URL,
            on_open=self.on_open,
            on_message=lambda ws, msg: self.on_message(msg, on_tick_callback)
        )

    def on_open(self, ws):
        payload = {
            "ticks": self.symbol,
            "subscribe": 1
        }
        ws.send(json.dumps(payload))

    def on_message(self, message, callback):
        data = json.loads(message)
        if 'tick' in data:
            price = float(data['tick']['quote'])
            callback(price)

    def run(self):
        self.ws.run_forever()
