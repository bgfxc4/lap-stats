import { createApp } from 'vue'
import jQuery from 'jquery'
import { BootstrapVue3 } from 'bootstrap-vue-3'

import { library } from "@fortawesome/fontawesome-svg-core"
import { fas } from "@fortawesome/free-solid-svg-icons"
import { far } from "@fortawesome/free-regular-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome"
library.add(fas, far)

import App from './App.vue'
import { store } from './store/store'
import { router } from "./router"

import 'bootstrap/dist/css/bootstrap.css'
//import './assets/css/bootstrap.min.css'
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css'
window.$ = jQuery

var app = createApp(App)

app.use(router)
app.use(BootstrapVue3)
app.use(store)

app.component("font-awesome-icon", FontAwesomeIcon)

app.mount('#app')