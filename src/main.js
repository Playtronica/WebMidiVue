import { createApp } from 'vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import App from './App.vue'
import "bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import ScalaPage from "@/components/ExtraPage/ScalaPage.vue";
import BiotronUpdatePage from "@/components/BiotronPage/BiotronUpdatePage.vue";

import ScalesPage from "@/components/ScalesPage/ScalesPage.vue";

import BiotronPageUpdated from "@/components/BiotronPage/BiotronPageUpdated.vue";
import TouchMePageUpdated from "@/components/TouchMePage/TouchMePageUpdated.vue";
import PlaytronPageUpdated from "@/components/PlaytronPage/PlaytronPageUpdated.vue";
import HomeComponent from "@/components/HomeComponent.vue";



const routes = [
    { path: '/', component: HomeComponent},
    { path: '/biotron', component: BiotronPageUpdated, props: {id: "BiotronWebMidiId_2" } },
    { path: '/touchme', component: TouchMePageUpdated, props: {id: "TouchmeWebMidiId_2"} },
    { path: '/playtron', component: PlaytronPageUpdated, props: {id: "PlaytronWebMidiId"} },

    { path: "/biotron/update", component: BiotronUpdatePage},
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
