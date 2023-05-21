from pn532pi import Pn532I2c, Pn532, pn532
import binascii
import websocket
import asyncio
import rel
import math
import time
import json
	
i2c = Pn532I2c(1)
nfc = Pn532(i2c)

CLIENTS = set()

def setup_nfc():
    nfc.begin()
    versiondata = nfc.getFirmwareVersion()
    if not versiondata:
        print("Didn't find PN53x board")
        raise RuntimeError("Didn't find PN53x board")  # halt

    # Got ok data, print it out!
    print("Found chip PN5 {:#x} Firmware ver. {:d}.{:d}".format((versiondata >> 24) & 0xFF, (versiondata >> 16) & 0xFF,
                                                                (versiondata >> 8) & 0xFF))

    # Set the max number of retry attempts to read from a card
    # This prevents us from waiting forever for a card, which is
    # the default behaviour of the pn532.
    nfc.setPassiveActivationRetries(0xFF)
    nfc.SAMConfig()

def on_open(ws):
    print("websocket open") 
    data = {
        "header": "register_scanner",
        "data": {
            "name": "screen1_scanner1",
            "screen_name": "screen1",
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
    ws = websocket.WebSocketApp("ws://192.168.178.70:8999/scanners",
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever(dispatcher=rel, reconnect=5)
    await get_nfc_update(ws)

async def get_nfc_update(ws):
    while True:
        await loop(ws)

async def loop(ws):
    # Wait for an ISO14443A type cards (Mifare, etc.).  When one is found
    # 'uid' will be populated with the UID, and uidLength will indicate
    # if the uid is 4 bytes (Mifare Classic) or 7 bytes (Mifare Ultralight)
    success, uid = nfc.readPassiveTargetID(pn532.PN532_MIFARE_ISO14443A_106KBPS)

    if (success):
        print("Found a card!")
        print("UID Length: {:d}".format(len(uid)))
        print("UID Value: {}".format(binascii.hexlify(uid)))

        # websockets.broadcast(CLIENTS, binascii.hexlify(uid))

        data = {
            "header": "tag_scanned",
            "data": {
                "timestamp": math.floor(time.time()*1000),
                "id": binascii.hexlify(uid).decode("utf-8"),
                "screen_name": "screen1",
            }
        }

        ws.send(json.dumps(data))
        print(json.dumps(data))

        # Wait 1 second before continuing
        await asyncio.sleep(1)
        return True
    else:
        # pn532 probably timed out waiting for a card
        print("Timed out waiting for a card")
        return False

if __name__ == '__main__':
    setup_nfc()
    asyncio.run(main())
