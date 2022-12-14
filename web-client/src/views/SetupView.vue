<template>
	<div id="SetupView">
		<div id="show-existing">
			<div id="classes">
				<ul class="list-group">
				<b-button btn variant="primary" class="mb-2 mt-1" v-b-modal.createClassModal>Create new class</b-button>
					<class v-for="c in runner_data.classes" :key="c?.name" :name="c.name" :runner_count="runner_data.runners.filter(el => el.class_name == c.name).length"/>
				</ul>
			</div>
			<div id="runners">
				<b-button btn variant="primary" class="mb-2 mt-1" v-b-modal.createRunnerModal>Create new runner</b-button>
				<ul class="list-group">
					<runner v-for="r in runner_data.runners" :key="r?.id" :runner="r"/>
				</ul>
			</div>
		</div>

		<b-modal size="lg" id="createRunnerModal" class="text-secondary" centered hide-footer hide-header-close title="Create runner" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p class="my-0">Enter a name for the new runner:</p>
				<input class="mb-4" placeholder="Enter a name..."/><br>

				<p class="my-0">Enter an id for the new runner:</p>
				<input class="mb-4" placeholder="Enter an id..."/><br>

				<select class="form-select mb-4" style="width: auto; margin-left: 50%; transform: translateX(-50%); text-align: center;" aria-label="Select runner class">
					<option selected>Select the class for the runner</option>
					<option v-for="c in runner_data.classes" :key="c.name" :value="c.name">{{c.name}}</option>
				</select>

				<b-button id="closeModalButton" class="btn btn-secondary mx-2" v-b-modal.createRunnerModal>Cancel</b-button>
				<button class="btn btn-outline-info" @click="deleteAppmnt">Create</button>
			</div>
		</b-modal>

		<b-modal size="lg" id="createClassModal" class="text-secondary" centered hide-footer hide-header-close title="Create class" header="test" header-class="justify-content-center">
			<div class="modal-body text-center">
				<p>Enter a name for the new class:</p>
				<input class="mb-4" placeholder="Enter a name..."/><br>
				<b-button id="closeModalButton" class="btn btn-secondary mx-2" v-b-modal.createClassModal>Cancel</b-button>
				<button class="btn btn-outline-info" @click="deleteAppmnt">Create</button>
			</div>
		</b-modal>
	</div>
</template>

<script>
import Class from '../components/setup/Class.vue'
import Runner from '../components/setup/Runner.vue'

export default {
	components: { Class, Runner },
	name: "SetupView",
	data () {
		return {
			runner_data: {},
			connection: null,
			showCreateUser: false
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
			}
		}
	},
	created () {
		console.log("Starting connection to WebSocket Server")
		this.connection = new WebSocket(this.$store.state.serverWsURL)
		
		this.connection.onmessage = event => {
			console.log(event)
			this.compute_msg(JSON.parse(event.data))
		}

		this.connection.onopen = event => {
			this.connection.send(JSON.stringify({header: "get_data"}))
			console.log("Successfully connected to the echo websocket server...")
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