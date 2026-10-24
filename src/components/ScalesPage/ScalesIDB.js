import {Db} from "@/assets/js/PresetsIDB";
import {div, SysExCommand} from "@/assets/js/SysExCommand";



export let ScalesCommandsData = new Map(Object.entries({
    "bpm": new SysExCommand( {
        name: "bpm",
        number_command: 0,
        max_value: 1000,
        min_value: 1,
        custom_fold: (arr, val) => {
            while (val > 127) {
                arr.push(val % 127);
                val = div(val,127);
            }
            arr.push(val);
        }
    }),
    "sensitivity": new SysExCommand( {
        name: "sensitivity",
        number_command: 1,
    }),
    "undercover_color": new SysExCommand( {
        name: "undercover_color",
        number_command: 2,
        max_value: 0xffffff,
        min_value: 0,
        custom_fold: (arr, val) => {
            arr.push(parseInt(((val >> 16) & 0xFF) / 2));
            arr.push(parseInt(((val >> 8) & 0xFF) / 2));
            arr.push(parseInt((val & 0xFF) / 2));
        }
    }),
    "scale": new SysExCommand( {
        name: "scale",
        number_command: 4,
    }),
    "color": new SysExCommand({
        name: "color",
        sendable: false,
        max_value: 0xffffff,
        min_value: 0,
    }),
    "brightness": new SysExCommand({
        name: "brightness",
        sendable: false,
        min_value: 0,
        max_value: 100,
    }),
    "performance": new SysExCommand({
        name: "performance",
        number_command: 5,
    }),
    "one_channel_mode": new SysExCommand({
        name: "one_channel_mode",
        number_command: 6,
    }),
    "beginning_mode": new SysExCommand({
        name: "beginning_mode",
        number_command: 7,
    }),
    "music_cc_num": new SysExCommand({
        name: "music_cc_num",
        number_command: 8,
        min_value: 0,
        max_value: 127,
        custom_fold: (arr, val) => {
            arr.push(val);
        }
    }),
    "arp_plus": new SysExCommand({
        name: "arp_plus",
        number_command: 9,
    }),
    "sensor_mute": new SysExCommand({
        name: "sensor_mute",
        number_command: 10,
    }),
    "arp_rate": new SysExCommand({
        name: "arp_rate",
        number_command: 14,
        min_value: 0,
        max_value: 5,
    }),
}))

const US_PER_MINUTE = 60000000

// Settings by id of the new protocol: page value <-> elements stored in Settings_t of the device
export const ScalesSettings = {
    "bpm": {
        id: 0,
        groups: 4,
        toDevice: (bpm) => [Math.round(US_PER_MINUTE / bpm)],
        fromDevice: ([us]) => Math.min(1000, Math.max(1, Math.round(US_PER_MINUTE / us))),
    },
    "sensitivity": {id: 1, groups: 1},
    "undercover_color": {
        id: 2,
        groups: 2,
        toDevice: (rgb) => [(rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF],
        fromDevice: ([r, g, b]) => (r << 16) | (g << 8) | b,
    },
    "scale": {id: 4, groups: 1},
    "performance": {id: 5, groups: 1},
    "one_channel_mode": {id: 6, groups: 1},
    "beginning_mode": {id: 7, groups: 1},
    "music_cc_num": {id: 8, groups: 1},
    "arp_plus": {id: 9, groups: 1},
    "sensor_mute": {id: 10, groups: 1},
    "arp_rate": {id: 14, groups: 1},
}

const default_preset = {
    "bpm": 120,
    "sensitivity": 0,
    "undercover_color": 0x0080FF,
    "color": 0x0040FF,
    "scale": 0,
    "brightness": 100,
    "performance": 0,
    "beginning_mode": 0,
    "music_cc_num": 90,
    "arp_plus": 0,
    "sensor_mute": 0,
    "arp_rate": 3,
}


export class ScalesDb extends Db {
    DB_NAME = "ScaleDB"
    STORE_NAME = "Scale_Patches"
    VERSION = 16

    constructor() {
        super(ScalesCommandsData)
        this.ready = this.openDB().then(async (is_initial) => {
            if (is_initial) {
                await this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}