import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import "bootstrap"
import "bootstrap/dist/css/bootstrap.min.css"
import BiotronPage from "@/components/BiotronPage.vue";
import TouchMePage from "@/components/TouchMePage.vue";


const routes = [
    { path: '/', },
    { path: '/biotron', component: BiotronPage, props: {id: "BiotronWebMidiId"} },
    { path: '/touchme', component: TouchMePage, props: {id: "TouchmeWebMidiId"} },
]

const router = createRouter({
    history: createWebHistory(),
    linkActiveClass: 'active',
    routes
})

createApp(App).use(router).mount('#app')
