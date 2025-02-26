import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";

const pads_name = [
    { "id": 0, "name": "C3", "note": 36 },
    { "id": 1, "name": "C#3", "note": 37 },
    { "id": 2, "name": "D3", "note": 38 },
    { "id": 3, "name": "D#3", "note": 39 },
    { "id": 4, "name": "E3", "note": 40 },
    { "id": 5, "name": "F3", "note": 41 },
    { "id": 6, "name": "F#3", "note": 42 },
    { "id": 7, "name": "G3", "note": 43 },
    { "id": 8, "name": "G#3", "note": 44 },
    { "id": 9, "name": "A3", "note": 45 },
    { "id": 10, "name": "A#3", "note": 46 },
    { "id": 11, "name": "B3", "note": 47 },
    { "id": 12, "name": "C4", "note": 48 },
    { "id": 13, "name": "C#4", "note": 49 },
    { "id": 14, "name": "D4", "note": 50 },
    { "id": 15, "name": "D#4", "note": 51 }
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