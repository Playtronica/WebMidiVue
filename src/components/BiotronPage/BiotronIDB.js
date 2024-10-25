import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";

export let BiotronCommandsData = new Map(Object.entries({
    "plantBpm": new SysExCommand( {
        name: "plantBpm",
        number_command: 0,
        default_value: 60,
        max_value: 1000,
        sendable: true,
        custom_fold: (arr, val) => {
            for (let i = 0; i < Math.floor(val / 127); i++) {
                arr.push(127)
            }

            arr.push(val % 127)
        }
    }),
    "lightBpm": new SysExCommand( {
        name: "lightBpm",
        number_command: 9,
        default_value: 4,
        max_value: 30
    }),
    "noteOffPercent": new SysExCommand({
        name: "noteOffPercent",
        number_command: 12,
        default_value: 100,
        max_value: 100
    }),
    "noteDistance": new SysExCommand({
        name: "noteDistance",
        number_command: 1,
        default_value: 50,
        max_value: 100
    }),
    "firstValue": new SysExCommand({
        name: "firstValue",
        number_command: 2,
        default_value: 10,
        max_value: 100
    }),
    "smoothness": new SysExCommand({
        name: "smoothness",
        number_command: 3,
        max_value: 99
    }),
    "scale": new SysExCommand( {
        name: "scale",
        number_command: 4,
        default_value: 0
    }),
    "minPlantVelocity": new SysExCommand({
        name: "minPlantVelocity",
        number_command: 15,
        default_value: 74,
        max_value: 127
    }),
    "maxPlantVelocity": new SysExCommand({
        name: "maxPlantVelocity",
        number_command: 5,
        default_value: 75,
        max_value: 127
    }),
    "minLightVelocity": new SysExCommand({
        name: "minLightVelocity",
        number_command: 17,
        default_value: 74,
        max_value: 127
    }),
    "maxLightVelocity": new SysExCommand({
        name: "maxLightVelocity",
        number_command: 6,
        default_value: 75,
        max_value: 127
    }),
    "randomness": new SysExCommand({
        name: "randomness",
        number_command: 10,
        default_value: 0
    }),
    "same_note_plant": new SysExCommand({
        name: "same_note_plant",
        number_command: 11,
        default_value: 0,
        max_value: 10
    }),
    "same_note_light": new SysExCommand({
        name: "same_note_light",
        number_command: 24,
        default_value: 0,
        max_value: 10
    }),
    "range_light_note": new SysExCommand({
        name: "range_light_note",
        number_command: 13,
        default_value: 12,
        max_value: 36
    }),
    "light_pitch_mode": new SysExCommand({
        name: "light_pitch_mode",
        number_command: 19,
        default_value: 0,
        sendable: true,
    }),
    "plant_no_velocity": new SysExCommand({
        name: "plant_no_velocity",
        default_value: 0,
        number_command: 22,
    }),
    "light_no_velocity": new SysExCommand({
        name: "light_no_velocity",
        default_value: 0,
        number_command: 23,
    }),
    "randomPlantVelocity": new SysExCommand({
        name: "randomPlantVelocity",
        default_value: 0,
        number_command: 16,
    }),
    "randomLightVelocity": new SysExCommand({
        name: "randomLightVelocity",
        default_value: 0,
        number_command: 18,
    }),
    "performance": new SysExCommand({
        name: "performance",
        number_command: 21,
        default_value: 0
    }),
}))


export class BiotronDb extends Db {
    DB_NAME = "BiotronDB"
    STORE_NAME = "Biotron_Patches"
    VERSION = 2

    constructor() {
        super(BiotronCommandsData);
    }
}