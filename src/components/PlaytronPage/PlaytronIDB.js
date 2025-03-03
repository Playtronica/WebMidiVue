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



const notes_command = Object.fromEntries(
    pads_name.map(x =>
        [
            `Note_${x.name}`,
            new SysExCommand({
                name: `Note_${x.name}`,
                default_value: x.note,
                number_command: [0, x.id]
            })
        ]
    )
);


export let PlaytronCommandsData = notes_command


export class PlaytronDb extends Db {
    DB_NAME = "PlaytronDB"
    STORE_NAME = "Playtron_Patches"
    VERSION = 3

    constructor() {
        super(new Map(Object.entries(PlaytronCommandsData)));
    }
}