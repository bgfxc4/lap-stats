<template>
	<div id="HomeView" style="width: 100%; height: 100%; padding: 2%; transition: background-color 0.2s">
        <div class="container" style="height: 100%">
            <div class="row" style="height: 100%;">
                <div class="col-7" style="height: 100%">
                    <div class="container" style="height: 100%">
                        <div class="row" style="height: 50%">
                            <div class="col-5">
                                <div class="panel text-center" style="height: calc(100% - 1.5rem); font-size: 5svw; font-weight: bold;">
                                    <p class="h3 lead text-start mx-3">Time since start</p>
                                    {{raceRunningTime ? formatMillis(raceRunningTime) : "Not started yet"}}
                                </div>
                            </div>
                            <div class="col-7">
                                <div class="panel" style="height: calc(100% - 1.5rem)">
                                    <p class="h3 lead text-start mx-3">Total stats</p>
                                    <p class="mx-4 lead fw-bold">
                                        Laps: {{totalLaps}}<br>
                                        Distance: {{Math.round(totalLaps * 8) / 10}}km<br>
                                        Money: {{totalMoney}}€
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div class="row" style="height: 50%">
                            <div class="col-12 panel" style="height: 100%;">
                                <p class="h3 lead text-start mx-3">Last scans</p>
                                <transition-group name="flip-list" v-if="scans.length">
                                    <div v-for="(sc, idx) in scans.slice().reverse()" :key="idx" class="mx-3 my-2 p-1" style="background-color: var(--bs-dark); border-radius: 7px;">
                                        <p style="font-weight: bold; margin: 0; display: inline">{{ sc.name }}</p> {{ sc.id }} <br>
                                        <p style="display: inline; font-weight: bold; margin: 0; margin-left: 2ex">{{ sc.lapTime }}</p> {{sc.timeStamp}}
                                    </div>
                                </transition-group>
                                <p v-else class="text-center mt-5 h5">None</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-5" style="height: 100%">
                    <div style="height: calc(70% - 1.5rem)" class="panel">
                        <p class="h3 lead text-start mx-3">Student leaderboard</p>
                        <transition-group name="flip-list">
                            <div v-for="(runner, idx) in showRunners" :key="runner.id" class="mx-3 my-2 p-1" style="background-color: var(--bs-dark); border-radius: 7px;">
                                {{idx+1}}. <p style="font-weight: bold; margin: 0; display: inline">{{ runner.name }}</p> <p style="font-weight: lighter; margin: 0; display: inline">{{ runner.id }}</p><br>
                                <p style="display: inline; font-weight: bold; margin: 0; margin-left: 2ex">{{ runner.laps.length }}</p> laps
                            </div>
                        </transition-group>
                    </div>
                    <div style="height: 30%; margin-top: 1.5rem" class="panel">
                        <p class="h3 lead text-start mx-3">Class leaderboard</p>
                        <transition-group name="flip-list">
                            <div v-for="(cl, idx) in showClasses" :key="cl.name" class="mx-3 my-2 p-1" style="background-color: var(--bs-dark); border-radius: 7px;">
                                {{idx+1}}. <p style="font-weight: bold; margin: 0; display: inline">{{ cl.name }}</p><br>
                                <p style="display: inline; font-weight: bold; margin: 0; margin-left: 2ex">{{ cl.laps }}</p> laps
                            </div>
                        </transition-group>
                    </div>
                </div>
            </div>
        </div>
		
		<start-counter :raceRunningTime="Math.round(raceRunningTime)"></start-counter>
        <font-awesome-icon id="runnerLapCheck" icon="check" size="10x" style="position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 40vh; display: none" class="text-success"/>
        <nfc-ws ref="nfcHandler" @detected="nfcDetected"/>
		<auth-modal @auth="authFinished"/>
	</div>
</template>

<script>
import AuthModal from '../components/AuthModal.vue'
import NfcWs from '../components/NfcWs.vue'
import StartCounter from '../components/home/StartCounter.vue'

export default {
	name: "HomeView",
	components: { AuthModal, StartCounter, NfcWs },
	data () {
		return {
			runner_data: {},
			showRunners: [],
            showClasses: [],
			connection: null,
			connection_password: null,
			errorText: null,
			openModal: null, // stores name of open modal to close it when confirm_action gets send
			raceRunningTime: NaN,
            totalLaps: 0,
            totalMoney: 0,
            scans: [],
		}
	},
	methods: {
		compute_msg (data) {
			switch (data.header) {
				case "all_data":
					this.runner_data = data.data
					// this.runner_data.runners = data.data.runners.map(el => {el.laps = JSON.parse(el.laps); return el})
					this.runnerDataToShowRunners()
					if (this.runner_data.start_time != null)
						this.startRaceTimeCounter()
                    this.totalLaps = 0
                    this.totalMoney = 0
                    data.data.runners.forEach(el => {
                        this.totalLaps += el.laps.length
                        this.totalMoney += el.sponsors.reduce((a, b) => a + b.amount, 0) * el.laps.length
                        console.log(el.sponsors, el.sponsors.reduce((a, b) => a + b.amount), 0)
                        this.totalMoney += el.sponsors_fixed.reduce((a, b) => a + b.amount, 0)
                    })
					break
				case "confirm_action":
					$(`#${this.openModal}ModalButton`).click()
					this.errorText = null
					break
				case "new_runner":
					this.runner_data.runners.push({...data.data, laps: []})
					this.runnerDataToShowRunners()
					break
				case "new_class":
					this.runner_data.classes.push(data.data)
					this.runnerDataToShowRunners()
					break
				case "delete_runner":
					this.runner_data.runners.splice(this.runner_data.runners.findIndex(el => el.id == data.data.id), 1)
					this.runnerDataToShowRunners()
					break
				case "delete_class":
					this.runner_data.classes.splice(this.runner_data.classes.findIndex(el => el.name == data.data.name), 1)
					this.runner_data.runners = this.runner_data.runners.filter(el => el.class_name != data.data.name)
					this.runnerDataToShowRunners()
					break
                case "edit_runner":
                    let idx = this.runner_data.runners.findIndex(el => el.id == data.data.id)
                    this.runner_data.runners[idx] = data.data
                    break
				case "runner_lap":
					this.addLapToRunner(data.data.id, data.data.timestamp, data.data.screen_name)
					this.runnerDataToShowRunners()
					break
				case "start_race":
			        this.ws_send("get_data", null)
					this.runner_data.start_time = data.data.timestamp
					this.startRaceTimeCounter()
					break
				case "error":
					console.error(data.data)
					this.errorText = data.data
					break
			}
		},
		addLapToRunner(id, timestamp, screen_name) {
			let rIdx = this.runner_data.runners.findIndex(el => el.id == id)
            this.totalLaps += 1
            this.totalMoney += this.runner_data.runners[rIdx].sponsors.reduce((a, b) => a + b.amount, 0)
			let lapTime = timestamp - (this.runner_data.runners[rIdx].last_lap_timestamp || this.runner_data.start_time)
			this.runner_data.runners[rIdx].laps.push(lapTime)
			this.runner_data.runners[rIdx].last_lap_timestamp = timestamp
			if (lapTime < (this.runner_data.runners[rIdx].best_time || Infinity)) this.runner_data.runners[rIdx].best_time = lapTime

            if (screen_name == this.$store.state.instanceName) {
                this.scans.push({
                    id,
                    timestamp,
                    lapTime,
                    name: this.runner_data.runners[rIdx].name,
                })
                $("#HomeView").addClass("bg-success")
                $("#runnerLapCheck").show("slow")
                setTimeout(() => {
                    $("#HomeView").removeClass("bg-success")
                    $("#runnerLapCheck").hide("slow")
                }, 200)
                
            }
		},
		runnerDataToShowRunners() {
			this.showRunners = this.runner_data.runners.sort((a, b) => b.laps.length - a.laps.length)
            
            this.showClasses = this.runner_data.classes.map(el => {return {name: el.name, laps: 0}})
            for (let c in this.showClasses) {
                this.showClasses[c].laps = this.showRunners.filter(el => el.class_name == this.showClasses[c].name).map(el => el.laps.length).reduce((a, b) => a+b, 0)
            }
            this.showClasses = this.showClasses.sort((a, b) => b.laps - a.laps)
		},
		ws_send (header, d) {
			this.connection?.send(JSON.stringify({header, data: d, login_hash: this.connection_password}))
		},
		startRaceTimeCounter() {
			setInterval(() => {
				this.raceRunningTime = (Date.now() - this.runner_data.start_time) / 1000 
			}, 100)
		},
		authFinished (ws, pass) {
			this.connection = ws
			this.connection_password = pass
			
			this.connection.onmessage = event => {
				this.compute_msg(JSON.parse(event.data))
			}
			this.ws_send("get_data", null)
            this.$refs.nfcHandler.openConnection()
		},
        nfcDetected(data) {
            console.log("nfc: " + data.id)
			this.ws_send("runner_lap", {id: data.id, screen_name: this.$store.state.instanceName})
        },
        formatMillis (ms) {
            if (ms < 0) ms = -ms;
            const time = {
                h: Math.floor(ms / 3600),
                mins: Math.floor(ms / 60) % 60,
                s: Math.floor(ms) % 60,
            };
            return Object.entries(time)
                .map(val => val[1] + (val[1] !== 1 ? val[0] : val[0]))
                .join(' ');
        },
	}
}
</script>

<style>
.flip-list-move {
	transition: transform 1s;
}

.panel {
    background-color: var(--bs-gray-dark);
    border-radius: 20px;
    overflow: hidden;
}

#app {
    height: 100svh;
    padding: 0;
    margin: 0;
    border: none;
}

#HomeView div.container {
    margin-left: 0;
    margin-right: 0;
    max-width: 100%;
}
</style>
