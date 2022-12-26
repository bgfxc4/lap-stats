<template>
	<div id="SetupView">
		<div id="show-existing" style="height: 100vh">
			<div id="classes">
				<b-button style="height: 4%; margin-bottom: 1%; margin-top: 1%" btn variant="primary" v-b-modal.createClassModal>Create new class</b-button>
				<ul class="list-group" style="height: 94%; overflow-y: auto">
					<class :soloClassName="soloClassName" @isolate="name => soloClassName == name ? soloClassName = null : soloClassName = name" @delete="name => deleteClassName = name" 
						v-for="c in runner_data.classes" :key="c?.name" :name="c.name" :runnerCount="runner_data.runners.filter(el => el.class_name == c.name).length"/>
				</ul>
			</div>
			<div id="runners">
				<b-button style="height: 4%; margin-bottom: 1%; margin-top: 1%" btn variant="primary" v-b-modal.createRunnerModal>Create new runner</b-button>
				<b-button @click="debugCreateSchool()" style="height: 4%; margin-bottom: 1%; margin-top: 1%; float: right" btn variant="danger">debug sim school</b-button>
				<ul class="list-group" style="height: 93%; overflow-y: auto">
					<runner @delete="id => deleteRunnerID = id" :soloClassName="soloClassName" v-for="r in runner_data.runners" :key="r?.id" :runner="r"/>
				</ul>
			</div>
		</div>

		<b-modal size="lg" id="createRunnerModal" class="text-secondary" centered hide-footer hide-header-close title="Create runner" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p class="my-0">Enter a name for the new runner:</p>
				<input v-model="newRunnerName" class="mb-4" placeholder="Enter a name..."/><br>

				<p class="my-0">Enter an id for the new runner:</p>
				<input v-model="newRunnerID" class="mb-4" placeholder="Enter an id..."/><br>

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
				<p>Enter a name for the new class:</p>
				<input v-model="newClassName" class="mb-4" placeholder="Enter a name..."/><br>
				<b-button id="createClassModalButton" class="btn btn-secondary mx-2" v-b-modal.createClassModal>Cancel</b-button>
				<button class="btn btn-outline-info" @click="createClass">Create</button>
			</div>
		</b-modal>

		<b-modal size="lg" id="deleteClassModal" class="text-secondary" centered hide-footer hide-header-close title="Delete class" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p>Do you really want to delete the class? All of its members will be deleted with it.</p>
				<b-button id="deleteClassModalButton" class="btn btn-secondary mx-2" v-b-modal.deleteClassModal>Cancel</b-button>
				<button class="btn btn-outline-danger" @click="deleteClass">Delete</button>
			</div>
		</b-modal>

		<b-modal size="lg" id="deleteRunnerModal" class="text-secondary" centered hide-footer hide-header-close title="Delete runner" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p>Do you really want to delete the runner?</p>
				<b-button id="deleteRunnerModalButton" class="btn btn-secondary mx-2" v-b-modal.deleteRunnerModal>Cancel</b-button>
				<button class="btn btn-outline-danger" @click="deleteRunner">Delete</button>
			</div>
		</b-modal>

		<auth-modal @auth="authFinished"/>
	</div>
</template>

<script>
import Class from '../components/setup/Class.vue'
import Runner from '../components/setup/Runner.vue'
import AuthModal from '../components/AuthModal.vue'

export default {
	components: { Class, Runner, AuthModal },
	name: "SetupView",
	data () {
		return {
			runner_data: {},
			connection: null,
			connection_password: null,
			showCreateUser: false,
			soloClassName: null,

			newRunnerName: "",
			newRunnerID: "",
			newRunnerClass: "",
			newClassName: "",

			deleteRunnerID: "",
			deleteClassName: ""
		}
	},
	methods: {
		compute_msg (data) {
			switch (data.header) {
				case "all_data":
					this.runner_data = data.data
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
			$("#createRunnerModalButton").click()
		},
		createClass() {
			this.ws_send("add_class", {name: this.newClassName})
			this.newClassName  = ""
			$("#createClassModalButton").click()
		},
		deleteRunner() {
			this.ws_send("delete_runner", {id: this.deleteRunnerID})
			this.deleteRunnerID = ""
			$("#deleteRunnerModalButton").click()
		},
		deleteClass() {
			this.ws_send("delete_class", {name: this.deleteClassName})
			this.deleteClassName = ""
			$("#deleteClassModalButton").click()
		},
		debugCreateSchool() {
			for (let i = 5; i <= 12; i++) {
				for (let j = 0; j < 4; j++) {
					this.newClassName = i + " " + ["a", "b", "c", "d"][j]
					this.createClass()

					for (let h = 0; h < 30; h++) {
						this.newRunnerClass = i + " " + ["a", "b", "c", "d"][j]
						this.newRunnerID = i + "" + j + "" + h
						this.newRunnerName = i + "" + ["a", "b", "c", "d"][j] + " - " + h
						this.createRunner()
					}
				}
			}
		},
		authFinished (ws, pass) {
			this.connection = ws
			this.connection_password = pass
			
			this.connection.onmessage = event => {
				console.log("new msg event")
				console.log(JSON.parse(event.data))
				this.compute_msg(JSON.parse(event.data))
			}

			this.ws_send("get_data", null)
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
	width: 20%;
}

#runners {
	position: absolute;
	height: 100%;
	right: 2%;
	width: 70%;
}
</style>