import * as express from 'express'
import * as http from 'http'
import * as WebSocket from 'ws'
import { AddressInfo } from 'net'
import * as runners from "./runners"
import * as scanners from "./scanners"

const app = express.application

const server = http.createServer(app)
export const wss = new WebSocket.Server({ server })

wss.on('connection', (ws: WebSocket, req) => {
	console.log(`[ws] new connection [${req.url}]`)
	ws.on("message", msg => {
	    if (req.url == "/runners") {
            runners.handleCommand(ws, msg)
        } else if (req.url == "/scanners") {
            scanners.handleCommand(ws, msg)
        }
	})
})

export function ws_send(ws: WebSocket.WebSocket, header: String, d: any) {
	ws.send(JSON.stringify({header, data: d}))
}

server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`)
})
