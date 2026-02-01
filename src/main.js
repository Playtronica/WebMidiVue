import { createApp } from 'vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import App from './App.vue'
import "bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import ScalaPage from "@/components/ExtraPage/ScalaPage.vue";
import BiotronUpdatePage from "@/components/BiotronPage/BiotronUpdatePage.vue";

import ScalesPage from "@/components/ScalesPage/ScalesPage.vue";

import BiotronPageUpdated from "@/components/BiotronPage/BiotronPageUpdated.vue";
import TouchMePageRelease from "@/components/TouchMePage/TouchMePageRelease.vue";
import PlaytronPageRelease from "@/components/PlaytronPage/PlaytronPageRelease.vue";
import HomeComponent from "@/components/HomeComponent.vue";
import PlaytronPageTest from "@/components/PlaytronPage/PlaytronPageTest.vue";
import TouchMePageTest from "@/components/TouchMePage/TouchMePageTest.vue";



const routes = [
    { path: '/', component: HomeComponent},
    { path: '/biotron', component: BiotronPageUpdated, props: {id: "BiotronWebMidiId_2" } },

    { path: '/touchme', component: TouchMePageRelease, props: {id: "TouchmeWebMidiId_2"} },
    { path: '/touchme/test', component: TouchMePageTest, props: {id: "TouchmeWebMidiId_2"} },

    { path: '/playtron', component: PlaytronPageRelease, props: {id: "PlaytronWebMidiId"} },
    { path: '/playtron/test', component: PlaytronPageTest, props: {id: "PlaytronWebMidiId"} },

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
