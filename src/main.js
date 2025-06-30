import { createApp } from 'vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import App from './App.vue'
import "bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import BiotronPage from "@/components/BiotronPage/BiotronPage.vue";
import TouchMePage from "@/components/TouchMePage/TouchMePage.vue";
import ScalaPage from "@/components/ExtraPage/ScalaPage.vue";
import BiotronUpdatePage from "@/components/BiotronPage/BiotronUpdatePage.vue";
import PlaytronPage from "@/components/PlaytronPage/PlaytronPage.vue";
import BiotronPageUpdated from "@/components/BiotronPage/BiotronPageUpdated.vue";
import ScalesPage from "@/components/ScalesPage/ScalesPage.vue";



const routes = [
    { path: '/'},
    { path: '/biotron', component: BiotronPage, props: {id: "BiotronWebMidiId_2" } },
    { path: '/biotron_updated', component: BiotronPageUpdated, props: {id: "BiotronWebMidiId_2" } },
    { path: "/biotron/update", component: BiotronUpdatePage},
    { path: '/touchme', component: TouchMePage, props: {id: "TouchmeWebMidiId_2"} },
    { path: '/playtron', component: PlaytronPage, props: {id: "PlaytronWebMidiId"} },
    { path: '/scales', component: ScalesPage, props: {id: "ScalesWebMidiId_1"} },
    { path: '/scala', component: ScalaPage}
]

const router = createRouter({
    history: createWebHashHistory(),
    linkActiveClass: 'active',
    routes
})

var cors = require('cors');

createApp(App).use(router).use(cors).mount('#app')
