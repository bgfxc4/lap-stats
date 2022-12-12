import { createRouter, createWebHistory } from "vue-router"

import HomeView from "./views/HomeView.vue"
import SetupView from "./views/SetupView.vue"

const routes = [
    {
		path: "/",
		name: "HomeView",
		component: HomeView
	},
    {
		path: "/setup",
		name: "SetupView",
		component: SetupView
	},
]

export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes
})