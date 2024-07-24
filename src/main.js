import { createApp } from 'vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import App from './App.vue'
import "bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import BiotronPage from "@/components/BiotronPage.vue";
import TouchMePage from "@/components/TouchMePage.vue";
import ScalaPage from "@/components/ScalaPage.vue";



const routes = [
    { path: '/'},
    { path: '/biotron', component: BiotronPage, props: {id: "BiotronWebMidiId_1"} },
    { path: '/touchme', component: TouchMePage, props: {id: "TouchmeWebMidiId_1"} },
    { path: '/scala', component: ScalaPage}
]

const router = createRouter({
    history: createWebHashHistory(),
    linkActiveClass: 'active',
    routes
})

createApp(App).use(router).mount('#app')
