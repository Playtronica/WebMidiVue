import { createApp } from 'vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import App from './App.vue'
import "bootstrap/js/dist/collapse"
import "bootstrap/js/dist/modal"
import "bootstrap/dist/css/bootstrap.min.css"
import HomeComponent from "@/components/HomeComponent.vue";
import '@pwa-entry'

const betaBuild = process.env.VUE_APP_BIOTRON_PWA_BETA === 'true'
const ScalaPage = () => import(/* webpackChunkName: "scala" */ '@/components/ExtraPage/ScalaPage.vue')
const BiotronUpdatePage = () => import(/* webpackChunkName: "biotron" */ '@/components/BiotronPage/BiotronUpdatePage.vue')
const ScalesPage = () => import(/* webpackChunkName: "scales" */ '@/components/ScalesPage/ScalesPage.vue')
const BiotronPageUpdated = () => import(/* webpackChunkName: "biotron" */ '@/components/BiotronPage/BiotronPageUpdated.vue')
const TouchMePageRelease = () => import(/* webpackChunkName: "touchme" */ '@/components/TouchMePage/TouchMePageRelease.vue')
const TouchMePageStandalone = () => import(/* webpackChunkName: "touchme" */ '@/components/TouchMePage/TouchMePageStandalone.vue')
const PlaytronPageRelease = () => import(/* webpackChunkName: "playtron" */ '@/components/PlaytronPage/PlaytronPageRelease.vue')
const PlaytronPageTest = () => import(/* webpackChunkName: "playtron" */ '@/components/PlaytronPage/PlaytronPageTest.vue')
const TouchMePageTest = () => import(/* webpackChunkName: "touchme" */ '@/components/TouchMePage/TouchMePageTest.vue')
const ScalesPageTest = () => import(/* webpackChunkName: "scales" */ '@/components/ScalesPage/ScalesPageTest.vue')
const CirclePage = () => import(/* webpackChunkName: "circle" */ '@/components/CirclePage/CirclePage.vue')
const SoundLab = () => import(/* webpackChunkName: "sound-lab" */ '@sound-lab')
const DeviceFirstPlay = () => import(/* webpackChunkName: "sound-lab" */ '@/components/SoundLab/DeviceFirstPlay.vue')
const deviceMeta = productName => ({
    requiresMidi: true,
    requiresDesktop: true,
    requiresChromium: true,
    productName
})
const playMeta = productName => ({...deviceMeta(productName), requiresAudio: true})

const knownDirectRoutes = new Set([
    '/biotron', '/biotron/play', '/biotron/update', '/touchme', '/touchme/test',
    '/touchme/standalone', '/playtron', '/playtron/test', '/scales',
    '/scales/test', '/scala', '/circle', '/sound'
])

// A cached navigation such as /biotron is served the app shell by Workbox.
// Normalize it to the hash URL used by this application before the router starts.
if (!window.location.hash && knownDirectRoutes.has(window.location.pathname)) {
    window.history.replaceState(null, '', `/#${window.location.pathname}${window.location.search}`)
}

const routes = [
    { path: '/', component: HomeComponent},
    { path: '/biotron', component: BiotronPageUpdated, props: {id: "BiotronWebMidiId_2" }, meta: deviceMeta('Biotron') },

    { path: '/touchme', component: TouchMePageRelease, props: {id: "TouchmeWebMidiId_2"}, meta: deviceMeta('TouchMe') },
    { path: '/touchme/test', component: TouchMePageTest, props: {id: "TouchmeWebMidiId_2"}, meta: deviceMeta('TouchMe') },
    { path: '/touchme/standalone', component: TouchMePageStandalone, props: {id: "TouchmeWebMidiId_standalone"}, meta: deviceMeta('TouchMe') },

    { path: '/playtron', component: PlaytronPageRelease, props: {id: "PlaytronWebMidiId"}, meta: deviceMeta('Playtron') },
    { path: '/playtron/test', component: PlaytronPageTest, props: {id: "PlaytronWebMidiId"}, meta: deviceMeta('Playtron') },

    { path: '/scales', component: ScalesPage, props: {id: "ScalesWebMidiId_1"}, meta: deviceMeta('Scales') },
    { path: '/scales/test', component: ScalesPageTest, props: {id: "ScalesWebMidiId_1"}, meta: deviceMeta('Scales') },

    { path: "/biotron/update", component: BiotronUpdatePage, meta: deviceMeta('Biotron')},

    { path: '/scala', component: ScalaPage, meta: deviceMeta('Playtronica device')},

    { path: '/circle', component: CirclePage, props: {id: "CircleWebMidiId"}, meta: deviceMeta('Circle') }
]

if (betaBuild) {
    routes.push({
        path: '/biotron/play',
        component: DeviceFirstPlay,
        props: {profileId: 'biotron'},
        meta: {...playMeta('Biotron'), firstPlay: true}
    })
    routes.push({path: '/sound', component: SoundLab, meta: {requiresAudio: true, productName: 'Playtronica Sound'}})
}

const router = createRouter({
    history: createWebHashHistory(),
    linkActiveClass: 'active',
    routes
})

createApp(App).use(router).mount('#app')
