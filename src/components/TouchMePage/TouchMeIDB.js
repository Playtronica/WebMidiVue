import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";

export let TouchMeCommandsData = new Map(Object.entries({
    "Scale": new SysExCommand( {
        name: "Scale",
        number_command: 0,
        max_value: 11
    }),
    "Key": new SysExCommand( {
        name: "Key",
        number_command: 1,
        min_value: 1,
        max_value: 12
    }),
    "maxVelocity": new SysExCommand( {
        name: "maxVelocity",
        number_command: 2,
        max_value: 127
    }),
    "minVelocity": new SysExCommand( {
        name: "minVelocity",
        number_command: 3,
        max_value: 127
    }),
    "highestNote": new SysExCommand( {
        name: "highestNote",
        number_command: 8,
        max_value: 127
    }),
    "lowestNote": new SysExCommand( {
        name: "lowestNote",
        number_command: 7,
        max_value: 127
    }),
    "customRange": new SysExCommand({
        name: "customRange",
        number_command: 6,
    }),
    "humanize": new SysExCommand({
        name: "humanize",
        number_command: 4,
    }),
    "mute": new SysExCommand({
        name: "mute",
        number_command: 5,
        default_value: 0,
        value: 0
    }),
}))


const default_preset = {
    "Scale": 0,
    "Key": 8,
    "maxVelocity": 70,
    "minVelocity": 50,
    "highestNote": 84,
    "lowestNote": 48,
    "customRange": 0,
    "humanize": 0,
    "mute": 0,
}

export class TouchMeDb extends Db {
    DB_NAME = "TouchMeDB"
    STORE_NAME = "TouchMe_Patches"
    VERSION = 2

    constructor() {
        super(TouchMeCommandsData);
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}