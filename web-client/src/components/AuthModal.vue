<template>
	<b-modal size="lg" id="authModal" class="text-secondary" centered hide-footer hide-header-close title="Authentification" header="test" header-class="justify-content-center">
		<div class="modal-body text-center">
			<p class="text-danger">{{errorText}}</p>
			<p>Enter the password to continue:</p>
			<input v-model="password" type="password" placeholder="Enter the password ..."/>
			<b-button id="authModalButton" class="d-none" v-b-modal.authModal /><br>
			<button class="btn btn-primary mt-3" @click="auth">Enter</button>
		</div>
	</b-modal>
</template>

<script>
import {sha512} from "js-sha512"

export default {
	name: "AuthModal",
	emits: ["auth"],
	data() {
		return {
			password: "",
			connection: null,
			errorText: ""
		}
	},
	methods: {
		auth () {
			this.ws_send("auth_test")
		},
		ws_send (header, d) {
			this.connection?.send(JSON.stringify({header, data: d, login_hash: sha512(this.password)}))
		},
		compute_msg (msg) {
			console.log(msg)
			switch(msg.header) {
				case "auth_test":
					if (msg.data == "ok") {
						$("#authModalButton").click()
						this.$emit("auth", this.connection, sha512(this.password))
					} else {
						this.password = ""
						this.errorText = "Wrong password. Try again."
					}
				break
			}
		}
	},
	mounted() {
		$("#authModalButton").click()

		console.log("Starting connection to WebSocket Server")
		this.connection = new WebSocket(this.$store.state.serverWsURL)
		
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