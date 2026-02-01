import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";

const pads_name = [
    { "id": 0, "name": "C3", "note": 60 },
    { "id": 1, "name": "C#3", "note": 61 },
    { "id": 2, "name": "D3", "note": 62 },
    { "id": 3, "name": "D#3", "note": 63 },
    { "id": 4, "name": "E3", "note": 64 },
    { "id": 5, "name": "F3", "note": 65 },
    { "id": 6, "name": "F#3", "note": 66 },
    { "id": 7, "name": "G3", "note": 67 },
    { "id": 8, "name": "G#3", "note": 68 },
    { "id": 9, "name": "A3", "note": 69 },
    { "id": 10, "name": "A#3", "note": 70 },
    { "id": 11, "name": "B3", "note": 71 },
    { "id": 12, "name": "C4", "note": 72 },
    { "id": 13, "name": "C#4", "note": 73 },
    { "id": 14, "name": "D4", "note": 74 },
    { "id": 15, "name": "D#4", "note": 75 }
]

export let PlaytronCommandsData = new Map([...Object.entries({
    "channel": new SysExCommand({
        name: "channel",
        number_command: 127,
        max_value: 16,
        min_value: 1,
        custom_fold:  (arr, val) => {
            arr.push(val - 1);
        }
    }),
    "chord_mode": new SysExCommand({
        name: "chord_mode",
        number_command: 1.
    })
}), ...new Map(
    pads_name.map(x =>
        [
            `Note_${x.name}`,
            new SysExCommand({
                name: `Note_${x.name}`,
                number_command: [0, x.id]
            })
        ]
    )
)])


const default_preset = {...Object.fromEntries(
    pads_name.map(x =>
        [
            `Note_${x.name}`,
            x.note
        ]
    ),

), ...{
        "channel": 1,
        "chord_mode": 0,
}};


export class PlaytronDb extends Db {
    DB_NAME = "PlaytronDB"
    STORE_NAME = "Playtron_Patches"
    VERSION = 5

    constructor() {
        super(PlaytronCommandsData);
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}