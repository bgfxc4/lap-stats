<template>
	<div id="AdminView">
        <ul>
            <li v-for="(screen, n1) in structure" :key="n1" :class="{'text-success': screen.online, 'text-danger': !screen.online}">
                {{n1}}
                <ul>
                    <li v-for="(scanner, n2) in screen.scanners" :key="n2" :class="{'text-success': scanner.online, 'text-danger': !scanner.online}">{{n2}}</li>
                </ul>
            </li>
        </ul>
		<auth-modal @auth="authFinished" :endpoint="'/admin'"/>
	</div>
</template>

<script>
import AuthModal from '../components/AuthModal.vue'

export default {
	components: { AuthModal, },
	name: "AdminView",
	data () {
		return {
            structure: {},

			connection: null,
			connection_password: null,
			errorText: null,
		}
	},
	methods: {
		compute_msg (data) {
			switch (data.header) {
				case "structure_status":
                    this.structure = data.data
                    break
				case "confirm_action":
                    this[this.openModal+"Modal"] = false
					this.errorText = null
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
			this.ws_send("get_structure_status", null)
		},
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
