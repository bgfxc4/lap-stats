import * as express from 'express'
import * as http from 'http'
import * as WebSocket from 'ws'
import { AddressInfo } from 'net'

const app = express.application

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

interface Runner {
	id: String,
	name: String,
	laps: number[],
	best_time: number,
	last_lap_timestamp: number | null
}
let data: {
	runners: Runner[],
	start_time: number,
} = {
	runners: [
		{
			id: "1",
			name: "Marc1",
			laps: [],
			best_time: Infinity,
			last_lap_timestamp: null
		},
		{
			id: "2",
			name: "Marc2",
			laps: [],
			best_time: Infinity,
			last_lap_timestamp: null
		},
		{
			id: "3",
			name: "Marc3",
			laps: [],
			best_time: Infinity,
			last_lap_timestamp: null
		}
	],
	start_time: Date.now()
}

wss.on('connection', (ws: WebSocket) => {
	console.log("[ws] new connection")
	ws.on("message", msg => {
		console.log(msg)
		try {
			var d = JSON.parse(msg.toString())
		} catch (err) {
			console.error(err)
			return ws_send(ws, "error", err)
		}

		switch(d.header) {
			case "add_runner":
				add_runner(d.data.name, d.data.id)
				wss.clients.forEach(w => {
					ws_send(w, "new_runner", {id: d.data.id, name: d.data.name})
				})
				break
			case "get_data":
				ws_send(ws, "all_data", JSON.stringify(data))
				break
			case "runner_lap":
				add_lap_to_runner(d?.data?.id, Date.now())
				wss.clients.forEach(w => {
					ws_send(w, "runner_lap", {id: d?.data?.id, timestamp: Date.now()})
				})
				break
			default:
				ws_send(ws, "error", "You have to set a valid header!")
				break
		}
	})
})

function ws_send(ws: WebSocket.WebSocket, header: String, d: any) {
	ws.send({header, data: d})
}

function add_runner(name: String, id: String) {
	data.runners.push({
		name,
		id,
		laps: [],
		best_time: Infinity,
		last_lap_timestamp: null
	})
}

function add_lap_to_runner(id: String, timestamp: number) {
	let r_idx = data.runners.findIndex(el => el.id == id)
	let lap_time = timestamp - (data.runners[r_idx].last_lap_timestamp || data.start_time)
	data.runners[r_idx].laps.push(lap_time)
	data.runners[r_idx].last_lap_timestamp = timestamp
	if (lap_time < data.runners[r_idx].best_time) data.runners[r_idx].best_time = lap_time
}

server.listen(process.env.PORT || 8999, () => {
    console.log(`Server started on port ${(server.address() as AddressInfo).port} :)`)
})