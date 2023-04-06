import { createStore } from 'vuex'

export const store = createStore({
	state: {
		isLoading: false,
		serverWsURL: "ws://localhost:8999/runners",
		scannerWsURL: "ws://localhost:8999/scanners",
		instanceName: "screen1",
		isDebug: true
	},
    mutations: {
        setInstanceName (state, name) {
            state.instanceName = name
        }
    }
})
