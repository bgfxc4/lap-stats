import sqlite3 from 'sqlite3'
import * as sqlite from 'sqlite'

export const db = sqlite.open({
    filename: './db/runners.db',
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE
}).then(async db => {
    await db.run("PRAGMA foreign_keys = ON")
    console.log("[db] opened existing db")
    return db
}).catch(async err => {
    let db = await sqlite.open({
        filename: './db/runners.db',
        driver: sqlite3.Database
    })
    console.log("[db] db has been created, setting up ...")
    await setupDB(db)
    console.log("[db] db ready")
    return db
})

async function setupDB (db: sqlite.Database<sqlite3.Database, sqlite3.Statement>) {
    await db.run("PRAGMA foreign_keys = ON")

    await db.run(`CREATE TABLE classes (
        name TEXT PRIMARY KEY
    )`)

    await db.run(`CREATE TABLE runners (
        id TEXT PRIMARY KEY, 
        idx INTEGER UNIQUE,
        name TEXT,
        best_time REAL,
        last_lap_timestamp INTEGER, 
        class_name TEXT REFERENCES classes(name) ON DELETE CASCADE
    )`)

    await db.run(`CREATE TABLE runner_sponsors (
        runner_id TEXT REFERENCES runners(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        amount REAL NOT NULL
    )`)

    await db.run(`CREATE TABLE runner_sponsors_fixed (
        runner_id TEXT REFERENCES runners(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        amount REAL NOT NULL
    )`)

    await db.run(`CREATE TABLE laps (
        runner_id TEXT REFERENCES runners(id) ON DELETE CASCADE,
        time REAL NOT NULL
    )`)

    await db.run(`CREATE TABLE race_data (
        start_time REAL
    )`)

    await db.run(`INSERT INTO race_data (start_time) VALUES (NULL)`)
}
