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
        max_value: 63500,
        min_value: 1,
        custom_fold: (arr, val) => {
            while (val > 127) {
                arr.push(val % 127);
                val = div(val,127);
            }
            arr.push(val);
        }
    }),
}))

const default_preset = {
    "bpm": 120,
    "sensitivity": 10000,
}


export class ScalesDb extends Db {
    DB_NAME = "ScaleDB"
    STORE_NAME = "Scale_Patches"
    VERSION = 2

    constructor() {
        super(ScalesCommandsData)
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}