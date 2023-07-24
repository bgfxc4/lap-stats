from pynfc import Nfc, Desfire, TimeoutException
import sys
import websocket
import rel
import binascii
import asyncio
import math
import time
import json

n = Nfc("pn532_i2c:/dev/i2c-" + sys.argv[1])

CLIENTS = set()

DESFIRE_DEFAULT_KEY = b'\x00' * 8
MIFARE_BLANK_TOKEN = b'\xFF' * 1024 * 4

def setup_nfc():
    pass

def on_open(ws):
    print("websocket open") 
    data = {
        "header": "register_scanner",
        "data": {
            "name": sys.argv[3],
            "screen_name": sys.argv[2],
        }
    }
    ws.send(json.dumps(data))


def on_error(a, b):
    print("websocket error", a, b)

def on_close():
    print("websocket closed")

def on_message():
    print("websocket message")

async def main():
    ws = websocket.WebSocketApp("ws://172.20.26.20:8999/scanners", on_open=on_open, on_message=on_message, on_error=on_error, on_close=on_close)
    ws.run_forever(dispatcher=rel, reconnect=5)
    await get_nfc_update(ws)

async def get_nfc_update(ws):
    while True:
        await loop(ws)

async def loop(ws):
    for target in n.poll():
        try:
            #websockets.broadcast(CLIENTS, binascii.hexlify(uid))
            data = {
                "header": "tag_scanned",
                "data": {
                    "timestamp": math.floor(time.time()*1000),
                    "id": binascii.hexlify(target.uid).decode("utf-8"),
                    "screen_name": sys.argv[2],
                }
            }

            ws.send(json.dumps(data))
            print(json.dumps(data))

            # Wait 1 second before continuing
            await asyncio.sleep(1)
        except TimeoutException:
            pass

if __name__ == '__main__':
    setup_nfc()
    asyncio.run(main())
