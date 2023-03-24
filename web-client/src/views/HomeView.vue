<template>
	<div id="HomeView">
		<transition-group name="flip-list" tag="ol">
			<li v-for="runner in showRunners" :key="runner.id">
				{{ runner.name }} {{ runner.id }} - {{ runner.laps.length }}
			</li>
		</transition-group>
		
		<start-counter :raceRunningTime="Math.round(raceRunningTime)"></start-counter>
		<auth-modal @auth="authFinished"/>
	</div>
</template>

<script>
import AuthModal from '../components/AuthModal.vue'
import StartCounter from '../components/home/StartCounter.vue'

export default {
	name: "HomeView",
	components: { AuthModal, StartCounter },
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
	    	console.log(data)
			switch (data.header) {
				case "all_data":
					this.runner_data = data.data
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
		}
	}
}
</script>

<style>
.flip-list-move {
	transition: transform 1s;
}
</style>
