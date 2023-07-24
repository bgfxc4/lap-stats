import { createStore } from 'vuex'

export const store = createStore({
	state: {
		isLoading: false,
		serverWsURL: "ws://172.20.26.20:8999",
		scannerWsURL: "ws://172.20.26.20:8999/scanners",
		instanceName: "screen1",
		isDebug: true
	},
    mutations: {
        setInstanceName (state, name) {
            state.instanceName = name
        }
    }
})
