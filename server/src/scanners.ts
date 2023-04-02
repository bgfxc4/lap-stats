import { ws_send, wss } from "./ws"
import * as WebSocket from 'ws'

let registered: {[key: string]: WebSocket} = {}

const commandList: {
	[key: string]: {
		requiresConfirm: boolean,
		handler: (ws: WebSocket, d: any) => boolean
	}
} = {
	"register_screen": {requiresConfirm: false, handler: register_screenHandler},
	"tag_scanned": {requiresConfirm: false, handler: tag_scannedHandler},
}

export function handleCommand(ws: WebSocket, msg: WebSocket.RawData) {
    try {
		var d = JSON.parse(msg.toString())
    } catch (err) {
        console.error(err)
        return ws_send(ws, "error", err)
    }

    //TODO: type checking (ie with ZOD)
    let command = commandList[d.header]
    if (!command) {
        ws_send(ws, "error", "You have to set a valid header!")
        return 
    }

    let ret = command.handler(ws, d)

    if (command.requiresConfirm && ret)
        ws_send(ws, "confirm_action", d.header)
}

function register_screenHandler(ws: WebSocket, d: any): boolean {
    if (d.data.name in registered) {
        ws_send(ws, "error", "Instance name does already exists!")
        return false
    }
    registered[d.data.name] = ws
    ws.on("close", () => {
        delete registered[d.data.screen_name]
    })
	return true
}

function tag_scannedHandler(_ws: WebSocket, d: any): boolean {
    if (!(d.data.screen_name in registered))
        return false
    else if (!registered[d.data.screen_name].OPEN) {
        delete registered[d.data.screen_name]
        return false
    }
    ws_send(registered[d.data.screen_name], "tag_scanned", { id: d.data.id, timestamp: d.data.timestamp })
    return true
}
