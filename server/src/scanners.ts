import { ws_send, wss } from "./ws"
import * as WebSocket from 'ws'
import { config } from "../config"

// let registered_screens: {[key: string]: WebSocket} = {}
// let registered_scanners: {[key: string]: WebSocket} = {}

export let structure: {[key: string]: {ws: WebSocket|null, scanners: {[key: string]: WebSocket|null}}} = {}

const commandList: {
	[key: string]: {
		requiresConfirm: boolean,
		handler: (ws: WebSocket, d: any) => boolean
	}
} = {
	"register_screen": {requiresConfirm: false, handler: register_screenHandler},
	"register_scanner": {requiresConfirm: false, handler: register_scannerHandler},
	"tag_scanned": {requiresConfirm: false, handler: tag_scannedHandler},
}

function init_structure() {
    console.log("[scanners] init scanner structure from config")
    for (let scr in config.structure) {
        structure[scr] = {
            ws: null,
            scanners: {}
        }
        for (let sca of config.structure?.[scr]) {
            structure[scr].scanners[sca] = null
        }
    }
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
    console.log("register screen")
    if (!structure[d.data.name]) {
        ws_send(ws, "error", "Screen Instance is not defined!")
        return false
    }
    if (structure[d.data.name].ws != null) {
        ws_send(ws, "error", "Instance name does already exist!")
        return false
    }

    structure[d.data.name].ws = ws
    ws.on("close", () => {
        console.log("closing " + d.data.name)
        structure[d.data.name].ws = null
    })
	return true
}

function register_scannerHandler(ws: WebSocket, d: any): boolean {
    if (!structure[d.data.screen_name]) {
        ws_send(ws, "error", "Screen Instance is not defined!")
        return false
    }
    if (structure[d.data.screen_name].scanners[d.data.name] != null) {
        ws_send(ws, "error", "Instance name does already exist!")
        return false
    }
    structure[d.data.screen_name].scanners[d.data.name] = ws
    ws.on("close", () => {
        console.log("closing " + d.data.name)
        structure[d.data.screen_name].scanners[d.data.name] = null
    })
	return true
}

function tag_scannedHandler(_ws: WebSocket, d: any): boolean {
    if (structure[d.data.screen_name].ws == null)
        return false
    else if (!structure[d.data.screen_name].ws?.OPEN) {
        structure[d.data.screen_name].ws = null
        return false
    }
    ws_send(structure[d.data.screen_name].ws as WebSocket, "tag_scanned", { id: d.data.id, timestamp: d.data.timestamp })
    return true
}

init_structure()
