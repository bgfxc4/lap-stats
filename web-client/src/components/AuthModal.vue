<template>
	<b-modal v-model="authModal" size="lg" id="authModal" class="text-secondary" centered hide-footer hide-header-close title="Authentification" header="test" header-class="justify-content-center">
		<div class="modal-body text-center">
			<p class="text-danger">{{errorText}}</p>
            <template v-if="$props.endpoint!='/admin'">
                <label>(Optional) Enter a new instance name:</label><br/>
                <input v-model="instanceName" type="text" placeholder="Enter an instance name..."/><br/>
            </template>
			<label class="mt-3">Enter the password to continue:</label><br/>
			<input v-model="password" type="password" placeholder="Enter the password ..." @keyup.enter="auth"/><br/>
			<button class="btn btn-primary mt-3" @click="auth">Enter</button>
		</div>
	</b-modal>
</template>

<script>
import {sha512} from "js-sha512"

export default {
	name: "AuthModal",
    props: {
        "endpoint": {
            default: "/runners",
            type: String
        }
    },
	emits: ["auth"],
	data() {
		return {
			password: "",
            instanceName: this.$store.state.instanceName,
			connection: null,
			errorText: "",
            authModal: true,
		}
	},
	methods: {
		auth () {
            this.$store.commit("setInstanceName", this.instanceName)
			this.ws_send("auth_test")
		},
		ws_send (header, d) {
			this.connection?.send(JSON.stringify({header, data: d, login_hash: sha512(this.password+":lap-stats")}))
		},
		compute_msg (msg) {
			console.log(msg)
			switch(msg.header) {
				case "auth_test":
					if (msg.data == "ok") {
                        this.authModal = false
						this.$emit("auth", this.connection, sha512(this.password+":lap-stats"))
					} else {
						this.password = ""
						this.errorText = "Wrong password. Try again."
					}
				case "error": {
					if (msg.data == "auth failed, wrong login hash") {
						this.password = ""
						this.errorText = "Wrong password. Try again."
					}
				}
				break
			}
		}
	},
	mounted() {
		console.log("Starting connection to WebSocket Server")
		this.connection = new WebSocket(this.$store.state.serverWsURL + this.$props.endpoint)
		
		this.connection.onmessage = event => {
			this.compute_msg(JSON.parse(event.data))
		}

		this.connection.onopen = event => {
			console.log("Successfully connected to the echo websocket server")
		}
	}
}
</script>

<style>

</style>
