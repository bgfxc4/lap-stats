<template>
	<div id="HomeView" style="width: 100%; height: 100%; padding: 2%">
        <div class="container" style="height: 100%">
            <div class="row" style="height: 100%;">
                <div class="col-7" style="height: 100%">
                    <div class="container" style="height: 100%">
                        <div class="row" style="height: 50%">
                            <div class="col-5">
                                <div class="panel" style="height: calc(100% - 1.5rem)">
                                    duration
                                </div>
                            </div>
                            <div class="col-7">
                                <div class="panel" style="height: calc(100% - 1.5rem)">
                                    total stats
                                </div>
                            </div>
                        </div>
                        <div class="row" style="height: 50%">
                            <div class="col-12 panel">
                                scans
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-5" style="height: 100%">
                    <div style="height: calc(70% - 1.5rem)" class="panel">
                        runners
                        <transition-group name="flip-list" tag="ol">
                        	<li v-for="runner in showRunners" :key="runner.id">
                        		{{ runner.name }} {{ runner.id }} - {{ runner.laps.length }}
                        	</li>
                        </transition-group>
                    </div>
                    <div style="height: 30%; margin-top: 1.5rem" class="panel">
                        classes
                    </div>
                </div>
            </div>
        </div>
		
		<start-counter :raceRunningTime="Math.round(raceRunningTime)"></start-counter>
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
			connection: null,
			connection_password: null,
			errorText: null,
			openModal: null, // stores name of open modal to close it when confirm_action gets send
			raceRunningTime: NaN,
		}
	},
	methods: {
		compute_msg (data) {
			switch (data.header) {
				case "all_data":
					this.runner_data = data.data
					this.runner_data.runners = data.data.runners.map(el => {el.laps = JSON.parse(el.laps); return el})
					this.runnerDataToShowRunners()
					if (this.runner_data.start_time != null)
						this.startRaceTimeCounter()
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
				case "runner_lap":
					this.addLapToRunner(data.data.id, data.data.timestamp)
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
		addLapToRunner(id, timestamp) {
			let rIdx = this.runner_data.runners.findIndex(el => el.id == id)
			let lapTime = timestamp - (this.runner_data.runners[rIdx].last_lap_timestamp || this.runner_data.start_time)
			this.runner_data.runners[rIdx].laps.push(lapTime)
			this.runner_data.runners[rIdx].last_lap_timestamp = timestamp
			if (lapTime < this.runner_data.runners[rIdx].best_time) this.runner_data.runners[rIdx].best_time = lapTime
		},
		runnerDataToShowRunners() {
			this.showRunners = this.runner_data.runners.sort((a, b) => b.laps.length - a.laps.length)
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
			this.ws_send("runner_lap", {id: data.id})
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
