<template>
	<div id="TestScannersView">
        <div v-if="selected_runner">
        Name: {{selected_runner?.name}} <br>
        Tag Number: {{selected_runner?.index}} <br>
        ID: {{selected_runner?.id}} <br>
        Class: {{selected_runner?.class_name}} <br>
        Sponsors:
        <p v-for="s in selected_runner?.sponsors || []" class="mx-5" :key="s.name">{{s.name}} {{s.amount}}</P><br>
        Sponsors Fixed:
        <p v-for="s in selected_runner?.sponsors_fixed || []" class="mx-5" :key="s.name">{{s.name}} {{s.amount}}</P>

        </div>
        <div v-else class="text-danger">
            tag not in db: {{counter}}
        </div>
	</div>
    <auth-modal @auth="authFinished"/>
    <nfc-ws ref="nfcHandler" @detected="nfcDetected"/>
    <div style="position: absolute; left: 0; bottom: 0">
        Instance: <template v-if="$store.state.instanceName">{{$store.state.instanceName}} </template><template v-else><p style="color: red; display: inline">none</p></template>
    </div>
</template>

<script>
import AuthModal from '../components/AuthModal.vue'
import NfcWs from '../components/NfcWs.vue'

export default {
	components: { AuthModal, NfcWs },
	name: "TestScannersView",
	data () {
		return {
			runner_data: {},
			connection: null,
			connection_password: null,
			errorText: null,
            selected_runner: undefined,
            counter: 0
		}
	},
	methods: {
		compute_msg (data) {
			switch (data.header) {
				case "all_data":
					this.runner_data = data.data
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
            console.log("nfc: " + id.id)
            this.counter ++;
            this.selected_runner = JSON.parse(JSON.stringify(this.runner_data.runners.find(el => el.id == id.id)))
			// this.ws_send("runner_lap", {id: data.id, screen_name: this.$store.state.instanceName})
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
