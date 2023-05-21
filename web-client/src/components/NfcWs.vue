<template>
</template>

<script>

export default {
	name: "NfcWs",
	emits: ["detected"],
	data() {
		return {
            socket: null
		}
	},
	methods: {
		compute_msg (msg) {
            switch (msg.header) {
                case "tag_scanned":
                    console.log("scanned: " + JSON.stringify(msg.data))
                    this.$emit("detected", msg.data)
                    break
                case "error":
                    if (msg.data == "Instance name does already exist!")
                        this.$store.commit("setInstanceName", undefined)
                    console.error(msg.data)
                    this.$store.commit("setInstanceName", undefined)
                    break
            }
		},
		ws_send (header, d) {
			this.socket?.send(JSON.stringify({header, data: d}))
		},
        simulate_tag_scanned (id) {
            if (!this.$store.state.instanceName)
                return
            // this.ws_send("tag_scanned", {screen_name: this.$store.state.instanceName, timestamp: Date.now(), id: id})
            this.ws_send("tag_scanned", {screen_name: "screen2", timestamp: Date.now(), id: id})
        },
        openConnection () {
            this.socket = new WebSocket(this.$store.state.scannerWsURL)
            this.socket.addEventListener("open", _e => {
                console.log("opened connection")
                this.ws_send("register_screen", { name: this.$store.state.instanceName})
            })
            this.socket.addEventListener("message", e => {
                this.compute_msg(JSON.parse(e.data))
            })
            this.socket.addEventListener("error", e => {
                console.log(e)
            })
        }
	},
}
</script>

<style>

</style>
