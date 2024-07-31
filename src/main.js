import { createApp } from 'vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import App from './App.vue'
import "bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import BiotronPage from "@/components/BiotronPage/BiotronPage.vue";
import TouchMePage from "@/components/TouchMePage/TouchMePage.vue";
import ScalaPage from "@/components/ExtraPage/ScalaPage.vue";
import BiotronUpdatePage from "@/components/BiotronPage/BiotronUpdatePage.vue";



const routes = [
    { path: '/'},
    { path: '/biotron', component: BiotronPage, props: {id: "BiotronWebMidiId_1" } },
    { path: "/biotron/update", component: BiotronUpdatePage},
    { path: '/touchme', component: TouchMePage, props: {id: "TouchmeWebMidiId_1"} },
    { path: '/scala', component: ScalaPage}
]

const router = createRouter({
    history: createWebHashHistory(),
    linkActiveClass: 'active',
    routes
})

var cors = require('cors');

createApp(App).use(router).use(cors).mount('#app')
