import { ws_send, wss } from "./ws"
import * as WebSocket from 'ws'
import { config } from "../config"
import {sha512} from "js-sha512"
import { db } from "./db"

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

const commandList: {
	[key: string]: {
		availableWhen: "raceStarted" | "always" | "setup",
		requiresConfirm: boolean,
		requiresAuth: boolean,
		handler: (ws: WebSocket, d: any) => Promise<boolean>
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

export async function handleCommand(ws: WebSocket, msg: WebSocket.RawData) {
    let race_data = await (await db).get("SELECT * FROM race_data")

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

    if (command.availableWhen == "setup" && race_data.start_time != null) {
        ws_send(ws, "error", "this command is currently not available, because the race already started")
        return
    } else if (command.availableWhen == "raceStarted" && (race_data.start_time == null || race_data.start_time > Date.now())) { // race did not start yet or is still in the countdown (data.start_time > Date.now())
        ws_send(ws, "error", "this command is currently not available, because the race did not start yet")
        return
    }

    let ret = command.handler(ws, d).catch(err => {
        console.error(err)
        ws_send(ws, "error", err)
    })

    if (command.requiresConfirm && ret)
        ws_send(ws, "confirm_action", d.header)
}

async function auth_testHandler(ws: WebSocket, d: any): Promise<boolean> {
	ws_send(ws, "auth_test", "ok")
	return true
}

async function add_runnerHandler(ws: WebSocket, d: any): Promise<boolean> {
	return await add_runner(d.data.name, d.data.sponsor_money, d.data.id, d.data.class_name).then(() => {
        wss.clients.forEach(w => {
            ws_send(w, "new_runner", {id: d.data.id, sponsor_money: d.data.sponsor_money, name: d.data.name, class_name: d.data.class_name})
        })
        return true
    })
}

async function add_classHandler(ws: WebSocket, d: any): Promise<boolean> {
	await add_class(d.data.name)
	wss.clients.forEach(w => {
		ws_send(w, "new_class", {name: d.data.name})
	})
	return true
}

async function get_dataHandler(ws: WebSocket, d: any): Promise<boolean> {
	ws_send(ws, "all_data", await get_data())
	return true
}

async function runner_lapHandler(ws: WebSocket, d: any): Promise<boolean> {
	await add_lap_to_runner(d?.data?.id, Date.now())
	wss.clients.forEach(w => {
		ws_send(w, "runner_lap", {id: d?.data?.id, timestamp: Date.now()})
	})
	return true
}

async function delete_runnerHandler(ws: WebSocket, d: any): Promise<boolean> {
	await delete_runner(d?.data?.id)
	wss.clients.forEach(w => {
		ws_send(w, "delete_runner", {id: d?.data?.id})
	})
	return true
}

async function delete_classHandler(ws: WebSocket, d: any): Promise<boolean> {
	await delete_class(d?.data?.name)
	wss.clients.forEach(w => {
		ws_send(w, "delete_class", {name: d?.data?.name})
	})
	return true
}

async function start_raceHandler(_: WebSocket, d: any): Promise<boolean> {
	let start_time = Date.now() + 1000 * config.race_time_startup_secs
    await (await db).run("UPDATE race_data SET start_time = $start_time", {$start_time: start_time})
	wss.clients.forEach(w => {
		ws_send(w, "start_race", {timestamp: start_time})
	})
	return true
}

async function add_runner(name: String, sponsor_money: Number, id: String, class_name: String) {
    await (await db).run("INSERT INTO runners (name, sponsor_money, id, best_time, last_lap_timestamp, class_name) VALUES ($name, $sponsor_money, $id, $best_time, $last_lap_timestamp, $class_name)", {
		$name: name,
        $sponsor_money: sponsor_money,
		$id: id,
		$best_time: Infinity,
		$last_lap_timestamp: null,
		$class_name: class_name 
    })
}

async function add_class(name: String) {
    await (await db).run("INSERT INTO classes (name) VALUES ($name)", {
		$name: name
    })
}

async function delete_runner(id: String) {
    await (await db).run("DELETE FROM runners WHERE id = $id", {
		$id: id
    })
}

async function delete_class(name: String) {
    await (await db).run("DELETE FROM classes WHERE name = $name", {
		$name: name
    })
}

async function add_lap_to_runner(id: String, timestamp: number) {
    let runner = await (await db).get("SELECT * FROM runners WHERE id = $id", {$id: id})
    let race_data = await (await db).get("SELECT * FROM race_data")
	let lap_time = timestamp - (runner.last_lap_timestamp || (race_data.start_time as number))
    await (await db).run("INSERT INTO laps (runner_id, time) VALUES ($runner_id, $time)", {$runner_id: id, $time: lap_time})
	if (lap_time < (runner.best_time || Infinity)) {
        await (await db).run("UPDATE runners SET best_time = $best_time, last_lap_timestamp = $timestamp WHERE id = $id", {$id: id, $best_time: lap_time, $timestamp: timestamp})
    } else {
        await (await db).run("UPDATE runners SET last_lap_timestamp = $timestamp WHERE id = $id", {$id: id, $timestamp: timestamp})
    }
}

async function get_data () {
    let race_data = await (await db).get("SELECT * FROM race_data")
    let runners = await (await db).all("SELECT *, (SELECT json_group_array ( time ) FROM laps WHERE runner_id = id) AS laps FROM runners;")
    let classes = await (await db).all("SELECT * FROM classes")

    return {
        runners,
        classes,
        start_time: race_data.start_time
    }
}
