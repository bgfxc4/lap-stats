<template>
	<div id="SetupView">
		<div id="show-existing">
			<div id="classes">
				<ul class="list-group">
					<class v-for="c in runner_data.classes" :key="c?.name" :name="c.name" :runner_count="runner_data.runners.filter(el => el.class_name == c.name).length"/>
				</ul>
			</div>
			<div id="runners">
				<ul class="list-group">
					<runner v-for="r in runner_data.runners" :key="r?.id" :runner="r"/>
				</ul>
			</div>
		</div>
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
			connection: null
		}
	},
	methods: {
		compute_msg (data) {
			switch (data.header) {
				case "all_data":
					this.runner_data = data.data
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