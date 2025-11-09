import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";

function div(val, by){
    return (val - val % by) / by;
}

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
    })

}))

const default_preset = {
    "bpm": 120,
    "sensitivity": 0,
    "undercover_color": 0x7500FF,
    "scale": 0,
    "brightness": 100,
}


export class ScalesDb extends Db {
    DB_NAME = "ScaleDB"
    STORE_NAME = "Scale_Patches"
    VERSION = 5

    constructor() {
        super(ScalesCommandsData)
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}