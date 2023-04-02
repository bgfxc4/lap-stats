import { ws_send, wss } from "./ws"
import * as WebSocket from 'ws'
import { config } from "../config"
import {sha512} from "js-sha512"

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
	start_time: number | null,
} = {
	runners: [],
	classes: [],
	start_time: null
}

const commandList: {
	[key: string]: {
		availableWhen: "raceStarted" | "always" | "setup",
		requiresConfirm: boolean,
		requiresAuth: boolean,
		handler: (ws: WebSocket, d: any) => boolean
	}
} = {
	"auth_test": {availableWhen: "always", requiresConfirm: false, requiresAuth: true, handler: auth_testHandler},
	"get_data": {availableWhen: "always", requiresConfirm: false, requiresAuth: true, handler: get_dataHandler},

	"add_runner": {availableWhen: "setup", requiresConfirm: true, requiresAuth: true, handler: add_runnerHandler},
	"add_class": {availableWhen: "setup", requiresConfirm: true, requiresAuth: true, handler: add_classHandler},
	"delete_runner": {availableWhen: "setup", requiresConfirm: true, requiresAuth: true, handler: delete_runnerHandler},
	"delete_class": {availableWhen: "setup", requiresConfirm: true, requiresAuth: true, handler: delete_classHandler},
	"start_race": {availableWhen: "setup", requiresConfirm: true, requiresAuth: true, handler: start_raceHandler},

	"runner_lap": {availableWhen: "raceStarted", requiresConfirm: true, requiresAuth: true, handler: runner_lapHandler},
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

    if (command.availableWhen == "setup" && data.start_time != null) {
        ws_send(ws, "error", "this command is currently not available, because the race already started")
        return
    } else if (command.availableWhen == "raceStarted" && (data.start_time == null || data.start_time > Date.now())) { // race did not start yet or is still in the countdown (data.start_time > Date.now())
        ws_send(ws, "error", "this command is currently not available, because the race did not start yet")
        return
    }

    let ret = command.handler(ws, d)

    if (command.requiresConfirm && ret)
        ws_send(ws, "confirm_action", d.header)
}

function auth_testHandler(ws: WebSocket, d: any): boolean {
	ws_send(ws, "auth_test", "ok")
	return true
}

function add_runnerHandler(ws: WebSocket, d: any): boolean {
	if (data.runners.findIndex(el => el.id == d.data.id) != -1) {
		ws_send(ws, "error", "a user with this id exists already")
		return false
	}
	if (data.classes.findIndex(el => el.name == d.data.class_name) == -1) {
		ws_send(ws, "error", "the class you provided does not exist")
		return false
	}
	add_runner(d.data.name, d.data.id, d.data.class_name)
	wss.clients.forEach(w => {
		ws_send(w, "new_runner", {id: d.data.id, name: d.data.name, class_name: d.data.class_name})
	})
	return true
}

function add_classHandler(ws: WebSocket, d: any): boolean {
	if (data.classes.findIndex(el => el.name == d.data.name) != -1) {
		ws_send(ws, "error", "a class with this name exists already")
		return false
	}
	add_class(d.data.name)
	wss.clients.forEach(w => {
		ws_send(w, "new_class", {name: d.data.name})
	})
	return true
}

function get_dataHandler(ws: WebSocket, d: any): boolean {
	ws_send(ws, "all_data", data)
	return true
}

function runner_lapHandler(ws: WebSocket, d: any): boolean {
	if (data.runners.findIndex(el => el.id == d.data.id) == -1) {
		ws_send(ws, "error", "a user with this id does not exist")
		return false
	}
	add_lap_to_runner(d?.data?.id, Date.now())
	wss.clients.forEach(w => {
		ws_send(w, "runner_lap", {id: d?.data?.id, timestamp: Date.now()})
	})
	return true
}

function delete_runnerHandler(ws: WebSocket, d: any): boolean {
	if (data.runners.findIndex(el => el.id == d.data.id) == -1) {
		ws_send(ws, "error", "a user with this id does not exist")
		return false
	}
	delete_runner(d?.data?.id)
	wss.clients.forEach(w => {
		ws_send(w, "delete_runner", {id: d?.data?.id})
	})
	return true
}

function delete_classHandler(ws: WebSocket, d: any): boolean {
	if (data.classes.findIndex(el => el.name == d.data.name) == -1) {
		ws_send(ws, "error", "a class with this name does not exist")
		return false
	}
	delete_class(d?.data?.name)
	wss.clients.forEach(w => {
		ws_send(w, "delete_class", {name: d?.data?.name})
	})
	return true
}

function start_raceHandler(_: WebSocket, d: any): boolean {
	data.start_time = Date.now() + 1000 * config.race_time_startup_secs
	wss.clients.forEach(w => {
		ws_send(w, "start_race", {timestamp: data.start_time})
	})
	return true
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
	let lap_time = timestamp - (data.runners[r_idx].last_lap_timestamp || (data.start_time as number))
	data.runners[r_idx].laps.push(lap_time)
	data.runners[r_idx].last_lap_timestamp = timestamp
	if (lap_time < data.runners[r_idx].best_time) data.runners[r_idx].best_time = lap_time
}
