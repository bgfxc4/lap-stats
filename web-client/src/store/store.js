import { createStore } from 'vuex'

export const store = createStore({
	state: {
		isLoading: false,
		serverWsURL: "ws://localhost:8999"
	}
})