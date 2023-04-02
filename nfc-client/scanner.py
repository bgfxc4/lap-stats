from pn532pi import Pn532I2c, Pn532, pn532
import binascii
import websocket
import asyncio
import rel
	
i2c = Pn532I2c(1)
nfc = Pn532(i2c)

ws = None

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

def on_open():
    print("websocket open")

def on_error():
    print("websocket error")

def on_close():
    print("websocket closed")

def on_message():
    print("websocket message")

def main():
    ws = websocket.WebSocketApp("wss://api.gemini.com/v1/marketdata/BTCUSD",
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever(dispatcher=rel, reconnect=5)
    get_nfc_update()
    #async with websockets.serve(handler, "0.0.0.0", 6666):
    #    await asyncio.Future()

async def get_nfc_update():
    while True:
        await loop()

async def loop():
    # Wait for an ISO14443A type cards (Mifare, etc.).  When one is found
    # 'uid' will be populated with the UID, and uidLength will indicate
    # if the uid is 4 bytes (Mifare Classic) or 7 bytes (Mifare Ultralight)
    success, uid = nfc.readPassiveTargetID(pn532.PN532_MIFARE_ISO14443A_106KBPS)

    if (success):
        print("Found a card!")
        print("UID Length: {:d}".format(len(uid)))
        print("UID Value: {}".format(binascii.hexlify(uid)))

        # websockets.broadcast(CLIENTS, binascii.hexlify(uid))
        ws.send(binascii.hexlify(uid))

        # Wait 1 second before continuing
        await asyncio.sleep(1)
        return True
    else:
        # pn532 probably timed out waiting for a card
        print("Timed out waiting for a card")
        return False

if __name__ == '__main__':
    setup_nfc()
    main()
