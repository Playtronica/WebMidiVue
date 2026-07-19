import {Db} from "@/assets/js/PresetsIDB";
import {div, SysExCommand} from "@/assets/js/SysExCommand";


export let CircleCommandsData = new Map(Object.entries({
    "bpm": new SysExCommand({
        name: "bpm",
        number_command: 0,
        min_value: 1,
        max_value: 999,
        custom_fold: (arr, val) => {
            while (val > 127) {
                arr.push(val % 127);
                val = div(val, 127);
            }
            arr.push(val);
        }
    }),
    "octave": new SysExCommand({
        name: "octave",
        number_command: 1,
        min_value: 1,
        max_value: 6,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "transpose": new SysExCommand({
        name: "transpose",
        number_command: 2,
        min_value: 0,
        max_value: 8,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "note_count": new SysExCommand({
        name: "note_count",
        number_command: 3,
        min_value: 3,
        max_value: 8,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "play_mode": new SysExCommand({
        name: "play_mode",
        number_command: 4,
        min_value: 0,
        max_value: 2,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "continuous_arpeggio": new SysExCommand({
        name: "continuous_arpeggio",
        number_command: 5,
    }),
    "arp_direction": new SysExCommand({
        name: "arp_direction",
        number_command: 6,
        min_value: 0,
        max_value: 4,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "arp_one_shot": new SysExCommand({
        name: "arp_one_shot",
        number_command: 7,
    }),
    "octave_boost_count": new SysExCommand({
        name: "octave_boost_count",
        number_command: 8,
        min_value: 0,
        max_value: 8,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
}))

const default_preset = {
    "bpm": 120,
    "octave": 3,
    "transpose": 0,
    "note_count": 3,
    "play_mode": 0,
    "continuous_arpeggio": 0,
    "arp_direction": 0,
    "arp_one_shot": 0,
    "octave_boost_count": 0,
}

export class CircleDb extends Db {
    DB_NAME = "CircleDB"
    STORE_NAME = "Circle_Patches"
    VERSION = 5

    constructor() {
        super(CircleCommandsData)
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}
