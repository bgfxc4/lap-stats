import * as express from 'express'
import * as http from 'http'
import * as WebSocket from 'ws'
import { AddressInfo } from 'net'
import * as fs from "fs"
import {sha512} from "js-sha512"

const config = JSON.parse(fs.readFileSync("./config.json", "utf-8"))

const app = express.application

const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

type Class = {
	name: String
}

type Runner = {
	id: String,
	name: String,
	laps: number[],
	best_time: number,
	last_lap_timestamp: number | null,
	class_name: String
}
let data: {
	runners: Runner[],
	classes: Class[],
	start_time: number,
} = {
	runners: [],
	classes: [],
	start_time: Date.now()
}

wss.on('connection', (ws: WebSocket) => {
	console.log("[ws] new connection")
	ws.on("message", msg => {
		try {
			var d = JSON.parse(msg.toString())
		} catch (err) {
			console.error(err)
			return ws_send(ws, "error", err)
		}

		if (sha512(d.login_hash || "") != config.login_hash) {
			ws_send(ws, "error", "auth failed, wrong login hash")
			return
		}

		switch(d.header) {
			case "auth_test":
				ws_send(ws, "auth_test", "ok")
				break
			case "add_runner":
				add_runner(d.data.name, d.data.id, d.data.class_name)
				wss.clients.forEach(w => {
					ws_send(w, "new_runner", {id: d.data.id, name: d.data.name, class_name: d.data.class_name})
				})
				break
			case "add_class":
				add_class(d.data.name)
				wss.clients.forEach(w => {
					ws_send(w, "new_class", {name: d.data.name})
				})
				break
			case "get_data":
				ws_send(ws, "all_data", data)
				break
			case "runner_lap":
				add_lap_to_runner(d?.data?.id, Date.now())
				wss.clients.forEach(w => {
					ws_send(w, "runner_lap", {id: d?.data?.id, timestamp: Date.now()})
				})
				break
			case "delete_runner":
				delete_runner(d?.data?.id)
				wss.clients.forEach(w => {
					ws_send(w, "delete_runner", {id: d?.data?.id})
				})
				break
			case "delete_class":
				delete_class(d?.data?.name)
				wss.clients.forEach(w => {
					ws_send(w, "delete_class", {name: d?.data?.name})
				})
				break
			default:
				ws_send(ws, "error", "You have to set a valid header!")
				break
		}
	})
})

function ws_send(ws: WebSocket.WebSocket, header: String, d: any) {
	ws.send(JSON.stringify({header, data: d}))
}

function add_runner(name: String, id: String, class_name: String) {
	data.runners.push({
		name,
		id,
		laps: [],
		best_time: Infinity,
		last_lap_timestamp: null,
		class_name: class_name 
	})
}

function add_class(name: String) {
	data.classes.push({
		name
	})
}

function delete_runner(id: String) {
	data.runners.splice(data.runners.findIndex(el => el.id == id), 1)
}

function delete_class(name: String) {
	data.classes.splice(data.classes.findIndex(el => el.name == name), 1)
	data.runners = data.runners.filter(el => el.class_name != name)
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