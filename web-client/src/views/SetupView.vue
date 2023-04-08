<template>
	<div id="SetupView">
		<div id="show-existing" style="height: 100vh">
			<div id="classes">
                <div style="display: inline-block">
                    <b-button style="height: 4%; margin-bottom: 1%; margin-top: 4%; margin-left: 5px; float: right" btn variant="primary" v-b-modal.createClassModal>Create new class</b-button>
                </div>
				<ul class="list-group" style="height: 93%; overflow-y: auto">
					<class :soloClassName="soloClassName" @isolate="name => soloClassName == name ? soloClassName = null : soloClassName = name" @delete="name => deleteClassName = name" 
						v-for="c in runner_data.classes" :key="c?.name" :name="c.name" :runnerCount="runner_data.runners.filter(el => el.class_name == c.name).length"/>
				</ul>
			</div>
			<div id="runners">
                <div style="display: inline-block; ">
                    <b-button v-if="runner_data.start_time == null" style="height: 4%; margin-bottom: 1%; margin-top: 1%; margin-left: 5px; float: right" btn variant="success" v-b-modal.startRaceModal>Start race</b-button>
                    <p v-else style="display: inline-block; float: right">{{ Math.round(raceRunningTime) }}</p>
                    <b-button v-if="$store.state.isDebug" @click="debugCreateSchool()" style="height: 4%; margin-bottom: 1%; margin-top: 1%; float: right" btn variant="info">debug sim school</b-button>
                    <b-button v-if="$store.state.isDebug" @click="debugCreateGroup()" style="height: 4%; margin-bottom: 1%; margin-top: 1%; float: right" btn variant="info">debug group</b-button>
                </div>
				<ul class="list-group" style="height: 93%; overflow-y: auto">
					<runner @debugLap="sendDebugLap" @delete="id => deleteRunnerID = id" :soloClassName="soloClassName" v-for="r in runner_data.runners" :key="r?.id" :runner="r"/>
				</ul>
			</div>
		</div>

		<b-modal size="lg" id="createRunnerModal" ref="createRunnerModal" class="text-secondary" centered hide-footer hide-header-close title="Create runner" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p class="text-danger">{{errorText}}</p>
				<p class="my-0">Enter a name for the new runner:</p>
				<input v-model="newRunnerName" class="mb-4" placeholder="Enter a name..."/><br>

				<!-- <p class="my-0">Enter an id for the new runner:</p> -->
				<!-- <input v-model="newRunnerID" class="mb-4" placeholder="Enter an id..."/><br> -->
                ID: {{newRunnerID}}

				<select v-model="newRunnerClass" class="form-select mb-4" style="width: auto; margin-left: 50%; transform: translateX(-50%); text-align: center;" aria-label="Select runner class">
					<option selected>Select the class for the runner</option>
					<option v-for="c in runner_data.classes" :key="c.name" :value="c.name">{{c.name}}</option>
				</select>

				<b-button id="createRunnerModalButton" class="btn btn-secondary mx-2" v-b-modal.createRunnerModal>Cancel</b-button>
				<button class="btn btn-outline-info" @click="createRunner">Create</button>
			</div>
		</b-modal>

		<b-modal size="lg" id="createClassModal" class="text-secondary" centered hide-footer hide-header-close title="Create class" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p class="text-danger">{{errorText}}</p>
				<p>Enter a name for the new class:</p>
				<input v-model="newClassName" class="mb-4" placeholder="Enter a name..."/><br>
				<b-button id="createClassModalButton" class="btn btn-secondary mx-2" v-b-modal.createClassModal>Cancel</b-button>
				<button class="btn btn-outline-info" @click="createClass">Create</button>
			</div>
		</b-modal>

		<b-modal size="lg" id="deleteClassModal" class="text-secondary" centered hide-footer hide-header-close title="Delete class" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p class="text-danger">{{errorText}}</p>
				<p>Do you really want to delete the class? All of its members will be deleted with it.</p>
				<b-button id="deleteClassModalButton" class="btn btn-secondary mx-2" v-b-modal.deleteClassModal>Cancel</b-button>
				<button class="btn btn-outline-danger" @click="deleteClass">Delete</button>
			</div>
		</b-modal>

		<b-modal size="lg" id="deleteRunnerModal" class="text-secondary" centered hide-footer hide-header-close title="Delete runner" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p class="text-danger">{{errorText}}</p>
				<p>Do you really want to delete the runner?</p>
				<b-button id="deleteRunnerModalButton" class="btn btn-secondary mx-2" v-b-modal.deleteRunnerModal>Cancel</b-button>
				<button class="btn btn-outline-danger" @click="deleteRunner">Delete</button>
			</div>
		</b-modal>

		<b-modal size="lg" id="startRaceModal" class="text-secondary" centered hide-footer hide-header-close title="Start race" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p class="text-danger">{{errorText}}</p>
				<p>Do you really want to start the race?</p>
				<b-button id="startRaceModalButton" class="btn btn-secondary mx-2" v-b-modal.startRaceModal>Cancel</b-button>
				<button class="btn btn-success" @click="startRace">Start race</button>
			</div>
		</b-modal>

		<auth-modal @auth="authFinished"/>
        <nfc-ws ref="nfcHandler" @detected="nfcDetected"/>
        <div style="position: absolute; left: 0; bottom: 0">
            Instance: <template v-if="$store.state.instanceName">{{$store.state.instanceName}} </template><template v-else><p style="color: red; display: inline">none</p></template>
        </div>
	</div>
</template>

<script>
import Class from '../components/setup/Class.vue'
import Runner from '../components/setup/Runner.vue'
import AuthModal from '../components/AuthModal.vue'
import NfcWs from '../components/NfcWs.vue'

export default {
	components: { Class, Runner, AuthModal, NfcWs },
	name: "SetupView",
	data () {
		return {
			runner_data: {},
			connection: null,
			connection_password: null,
			showCreateUser: false,
			soloClassName: null,
			errorText: null,
			openModal: null, // stores name of open modal to close it when confirm_action gets send
			raceRunningTime: null,

			newRunnerName: "",
			newRunnerID: "",
			newRunnerClass: "",
			newClassName: "",
            newRunnerModalOpen: false,

			deleteRunnerID: "",
			deleteClassName: ""
		}
	},
	methods: {
		compute_msg (data) {
			switch (data.header) {
				case "all_data":
					this.runner_data = data.data
					if (this.runner_data.start_time != null)
						this.startRaceTimeCounter()
					break
				case "new_runner":
					this.runner_data.runners.push(data.data)
					break
				case "new_class":
					this.runner_data.classes.push(data.data)
					break
				case "delete_runner":
					this.runner_data.runners.splice(this.runner_data.runners.findIndex(el => el.id == data.data.id), 1)
					break
				case "delete_class":
					this.runner_data.classes.splice(this.runner_data.classes.findIndex(el => el.name == data.data.name), 1)
					this.runner_data.runners = this.runner_data.runners.filter(el => el.class_name != data.data.name)
					break
				case "start_race":
					this.runner_data.start_time = data.data.timestamp
					this.startRaceTimeCounter()
					break
				case "confirm_action":
					$(`#${this.openModal}ModalButton`).click()
					this.errorText = null
                    if (this.openModal == "createRunner")
                        this.newRunnerModalOpen = false
					break
				case "error":
					console.error(data.data)
					this.errorText = data.data
					break
			}
		},
		ws_send (header, d) {
			this.connection?.send(JSON.stringify({header, data: d, login_hash: this.connection_password}))
		},
		createRunner() {
			this.ws_send("add_runner", {name: this.newRunnerName, id: this.newRunnerID, class_name: this.newRunnerClass})
			this.newRunnerClass = ""
			this.newRunnerID = ""
			this.newRunnerName = ""
			this.openModal = "createRunner"
		},
		createClass() {
			this.ws_send("add_class", {name: this.newClassName})
			this.newClassName  = ""
			this.openModal = "createClass"
		},
		deleteRunner() {
			this.ws_send("delete_runner", {id: this.deleteRunnerID})
			this.deleteRunnerID = ""
			this.openModal = "deleteRunner"
		},
		deleteClass() {
			this.ws_send("delete_class", {name: this.deleteClassName})
			this.deleteClassName = ""
			this.openModal = "deleteClass"
		},
		startRace() {
			this.ws_send("start_race", {})
			this.openModal = "startRace"
		},
		startRaceTimeCounter() {
			setInterval(() => {
				this.raceRunningTime = (Date.now() - this.runner_data.start_time) / 1000 
			}, 100)
		},
		async debugCreateSchool() {
			for (let i = 5; i <= 12; i++) {
				for (let j = 0; j < 4; j++) {
					this.newClassName = i + " " + ["a", "b", "c", "d"][j]
					this.createClass()
                    await new Promise(r => setTimeout(r, 200))

					for (let h = 0; h < 30; h++) {
						this.newRunnerClass = i + " " + ["a", "b", "c", "d"][j]
						this.newRunnerID = i + "" + j + "" + h
						this.newRunnerName = i + "" + ["a", "b", "c", "d"][j] + " - " + h
						this.createRunner()
					}
				}
			}
		},
		async debugCreateGroup() {
			for (let i = 5; i <= 6; i++) {
				for (let j = 0; j < 2; j++) {
					this.newClassName = i + " " + ["a", "b"][j]
					this.createClass()
                    await new Promise(r => setTimeout(r, 200))

					for (let h = 0; h < 5; h++) {
						this.newRunnerClass = i + " " + ["a", "b", "c", "d"][j]
						this.newRunnerID = i + "" + j + "" + h
						this.newRunnerName = i + "" + ["a", "b", "c", "d"][j] + " - " + h
						this.createRunner()
					}
				}
			}
		},
		sendDebugLap(runnerID) {
			this.openModal = null
			// this.ws_send("runner_lap", {id: runnerID})
            this.$refs.nfcHandler.simulate_tag_scanned(runnerID)
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
        nfcDetected(id) {
            this.newRunnerID = id.id
            if (this.newRunnerModalOpen)
                return
            $("#createRunnerModalButton").click()
            this.newRunnerModalOpen = true
            console.log("nfc: " + id.id)
        }
	}
}
</script>

<style scoped>
#show-existing {
	position: relative,
}

#classes {
	position: absolute;
	height: 100%;
	left: 2%;
	width: 23%;
}

#runners {
	position: absolute;
	height: 100%;
	right: 0;
	width: 73%;
}
</style>
