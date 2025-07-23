import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";

export let BiotronCommandsData = new Map(Object.entries({
    "plantBpm": new SysExCommand( {
        name: "plantBpm",
        number_command: 0,
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
        max_value: 30
    }),
    "noteOffPercent": new SysExCommand({
        name: "noteOffPercent",
        number_command: 12,
        max_value: 100
    }),
    "noteDistance": new SysExCommand({
        name: "noteDistance",
        number_command: 1,
        max_value: 100
    }),
    "firstValue": new SysExCommand({
        name: "firstValue",
        number_command: 2,
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
    }),
    "minPlantVelocity": new SysExCommand({
        name: "minPlantVelocity",
        number_command: 15,
    }),
    "maxPlantVelocity": new SysExCommand({
        name: "maxPlantVelocity",
        number_command: 5,
    }),
    "minLightVelocity": new SysExCommand({
        name: "minLightVelocity",
        number_command: 17,
    }),
    "maxLightVelocity": new SysExCommand({
        name: "maxLightVelocity",
        number_command: 6,
    }),
    "randomness": new SysExCommand({
        name: "randomness",
        number_command: 10,
    }),
    "same_note_plant": new SysExCommand({
        name: "same_note_plant",
        number_command: 11,
        max_value: 10
    }),
    "same_note_light": new SysExCommand({
        name: "same_note_light",
        number_command: 24,
        max_value: 10
    }),
    "range_light_note": new SysExCommand({
        name: "range_light_note",
        number_command: 13,
        max_value: 36
    }),
    "light_pitch_mode": new SysExCommand({
        name: "light_pitch_mode",
        number_command: 19,
        sendable: true,
    }),
    "plant_no_velocity": new SysExCommand({
        name: "plant_no_velocity",
        number_command: 22,
    }),
    "light_no_velocity": new SysExCommand({
        name: "light_no_velocity",
        number_command: 23,
    }),
    "randomPlantVelocity": new SysExCommand({
        name: "randomPlantVelocity",
        number_command: 16,
    }),
    "randomLightVelocity": new SysExCommand({
        name: "randomLightVelocity",
        number_command: 18,
    }),
    "performance": new SysExCommand({
        name: "performance",
        number_command: 21,
    }),
    "middle_plant_note": new SysExCommand({
        name: "middle_plant_note",
        number_command: 25,
        min_value: 60,
        max_value: 72,
    }),
    "plant_midi_channel": new SysExCommand({
        name: "plant_midi_channel",
        number_command: [127, 0],
        max_value: 16,
        min_value: 1,
        custom_fold:  (arr, val) => {
            arr.push(val - 1);
        }
    }),
    "light_midi_channel": new SysExCommand({
        name: "light_midi_channel",
        number_command: [127, 1],
        max_value: 16,
        min_value: 1,
        custom_fold: (arr, val) => {
            arr.push(val - 1);
        }
    })
}))


const fast_role_preset = {
    "plantBpm": 404,
    "lightBpm": 8,
    "noteOffPercent": 1,
    "noteDistance": 50,
    "firstValue": 10,
    "smoothness": 0,
    "scale": 3,
    "minPlantVelocity": 0,
    "maxPlantVelocity": 97,
    "minLightVelocity": 0,
    "maxLightVelocity": 68,
    "randomness": true,
    "same_note_plant": 0,
    "same_note_light": 0,
    "range_light_note": 12,
    "light_pitch_mode": 0,
    "plant_no_velocity": 0,
    "light_no_velocity": 0,
    "randomPlantVelocity": true,
    "randomLightVelocity": true,
    "performance": 0,
    "middle_plant_note": 60,
    "plant_midi_channel": 1,
    "light_midi_channel": 2,
}

const the_performer_mode = {
    "plantBpm": 404,
    "lightBpm": 2,
    "noteOffPercent": 2,
    "noteDistance": 50,
    "firstValue": 10,
    "smoothness": 0,
    "scale": 6,
    "minPlantVelocity": 8,
    "maxPlantVelocity": 97,
    "minLightVelocity": 0,
    "maxLightVelocity": 54,
    "randomness": false,
    "same_note_plant": 1,
    "same_note_light": 0,
    "range_light_note": 18,
    "light_pitch_mode": false,
    "plant_no_velocity": 0,
    "light_no_velocity": true,
    "randomPlantVelocity": true,
    "randomLightVelocity": true,
    "performance": true,
    "middle_plant_note": 60,
    "plant_midi_channel": 1,
    "light_midi_channel": 2,
}

const in_discussion = {
    "plantBpm": 404,
    "lightBpm": 2,
    "noteOffPercent": 1,
    "noteDistance": 50,
    "firstValue": 10,
    "smoothness": 0,
    "scale": 5,
    "minPlantVelocity": 44,
    "maxPlantVelocity": 97,
    "minLightVelocity": 0,
    "maxLightVelocity": 54,
    "randomness": false,
    "same_note_plant": 0,
    "same_note_light": 0,
    "range_light_note": 18,
    "light_pitch_mode": false,
    "plant_no_velocity": 0,
    "light_no_velocity": 0,
    "randomPlantVelocity": true,
    "randomLightVelocity": true,
    "performance": true,
    "middle_plant_note": 60,
    "plant_midi_channel": 1,
    "light_midi_channel": 2,
}

const mixolyd = {
    "plantBpm": 462,
    "lightBpm": 4,
    "noteOffPercent": 4,
    "noteDistance": 50,
    "firstValue": 10,
    "smoothness": 0,
    "scale": 4,
    "minPlantVelocity": 8,
    "maxPlantVelocity": 98,
    "minLightVelocity": 74,
    "maxLightVelocity": 75,
    "randomness": 0,
    "same_note_plant": 1,
    "same_note_light": 0,
    "range_light_note": 12,
    "light_pitch_mode": 0,
    "plant_no_velocity": 0,
    "light_no_velocity": true,
    "randomPlantVelocity": true,
    "randomLightVelocity": 0,
    "performance": true,
    "middle_plant_note": 60,
    "plant_midi_channel": 1,
    "light_midi_channel": 2,
}


export class BiotronDb extends Db {
    DB_NAME = "BiotronDB"
    STORE_NAME = "Biotron_Patches"
    VERSION = 8

    constructor() {
        super(BiotronCommandsData)
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(mixolyd, "Mixolyd (Default)")
                this.createNoEditablePatch(fast_role_preset, "Fast role")
                this.createNoEditablePatch(the_performer_mode, "The Performer mode")
                this.createNoEditablePatch(in_discussion, "In Discussion")
            }
        })
    }
}