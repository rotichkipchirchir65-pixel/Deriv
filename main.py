# main.py

from websocket_client import DerivWebSocket
from signal_logic import calculate_signals
from config import SYMBOLS, FAST_MA, SLOW_MA

buffers = {name: [] for name in SYMBOLS}

def create_callback(name):
    def handle_tick(price):
        buffer = buffers[name]
        buffer.append(price)
        if len(buffer) > SLOW_MA:
            signal = calculate_signals(buffer[-SLOW_MA:], FAST_MA, SLOW_MA)
            print(f"[{name}] Price: {price:.2f} | Signal: {signal}")
    return handle_tick

if __name__ == "__main__":
    print("Starting Deriv Crossover Bot for all Volatility (1s) markets...")
    for name, symbol in SYMBOLS.items():
        ws = DerivWebSocket(create_callback(name), symbol)
        ws.run()
