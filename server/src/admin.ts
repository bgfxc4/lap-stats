import { ws_send } from "./ws"
import * as WebSocket from 'ws'
import { structure } from "./scanners"
import { config } from "../config"
import {sha512} from "js-sha512"

const commandList: {
	[key: string]: {
		requiresConfirm: boolean,
        requiresAuth: boolean,
		handler: (ws: WebSocket, d: any) => Promise<boolean>
	}
} = {
	"auth_test": {requiresConfirm: false, requiresAuth: true, handler: auth_testHandler},
	"get_structure_status": {requiresConfirm: false, requiresAuth: true, handler: get_structure_statusHandler},
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

    if (command.requiresAuth && sha512(d.login_hash || "") != config.login_hash) {
        ws_send(ws, "error", "auth failed, wrong login hash")
        return
    }

    let ret = command.handler(ws, d)

    if (command.requiresConfirm && ret)
        ws_send(ws, "confirm_action", d.header)
}

async function auth_testHandler(ws: WebSocket, d: any): Promise<boolean> {
	ws_send(ws, "auth_test", "ok")
	return true
}

async function get_structure_statusHandler(ws: WebSocket, d: any): Promise<boolean> {
    let ret: {[key: string]: {
        online: boolean,
        scanners: {[key: string]: {
            online: boolean
        }}
    }} = {}
    for (let i in structure) {
        ret[i] = {
            online: structure[i].ws != null,
            scanners: {}
        }

        for (let j in structure[i].scanners) {
            ret[i].scanners[j] = { online: structure[i].scanners[j] != null }
        }
    }
    ws_send(ws, "structure_status", ret)
    return true
}
