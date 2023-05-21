import { createRouter, createWebHistory } from "vue-router"

import HomeView from "./views/HomeView.vue"
import SetupView from "./views/SetupView.vue"
import AdminView from "./views/AdminView.vue"

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
    {
		path: "/admin",
		name: "AdminView",
		component: AdminView
	},
]

export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes
})
