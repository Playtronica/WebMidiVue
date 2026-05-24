import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";


export let TouchMeCommandsData = new Map(Object.entries({
    "PlayMode": new SysExCommand( {
        name: "PlayMode",
        number_command: 0,
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
    "channel": new SysExCommand({
        name: "channel",
        number_command: 127,
        max_value: 16,
        min_value: 1,
        custom_fold:  (arr, val) => {
            arr.push(val - 1);
        }
    }),
    "sens_mode": new SysExCommand({
        name: "sens_mode",
        number_command: 9,
        min_value: -10,
        max_value: 10,
        custom_fold:  (arr, val) => {
            arr.push(val + 10);
        }
    }),
    "play_mode_page": new SysExCommand({
        name: "play_mode_page",
        number_command: 10,
    })
}))


const default_preset = {
    "PlayMode": 0,
    "play_mode_page": 0,
    "Key": 8,
    "maxVelocity": 70,
    "minVelocity": 50,
    "highestNote": 84,
    "lowestNote": 48,
    "customRange": 0,
    "humanize": 0,
    "mute": 0,
    "channel": 1,
    "sens_mode": 0,
}

function synthParam(name, param_id, max_value, default_value = 0) {
    let cmd = new SysExCommand({
        name,
        number_command: param_id,
        min_value: 0,
        max_value,
    });
    cmd.flag_device = [20, 13, 10];
    cmd.set_value(default_value);
    return cmd;
}

export let TouchMeSynthCommandsData = new Map(Object.entries({
    "synth_octave_shift": synthParam("synth_octave_shift", 0, 9, 0),
    "synth_osc_waveform": synthParam("synth_osc_waveform", 1, 1, 1),
    "synth_osc_2_coarse_pitch": synthParam("synth_osc_2_coarse_pitch", 2, 24, 0),
    "synth_osc_2_fine_pitch": synthParam("synth_osc_2_fine_pitch", 3, 32, 0),
    "synth_osc_1_2_mix": synthParam("synth_osc_1_2_mix", 4, 64, 59),
    "synth_eg_sustain_level": synthParam("synth_eg_sustain_level", 5, 64, 56),
    "synth_eg_decay_time": synthParam("synth_eg_decay_time", 6, 64, 18),
    "synth_filter_cutoff": synthParam("synth_filter_cutoff", 7, 120, 60),
    "synth_filter_resonance": synthParam("synth_filter_resonance", 8, 5, 4),
    "synth_filter_mod_amount": synthParam("synth_filter_mod_amount", 9, 60, 2),
    "synth_lfo_depth": synthParam("synth_lfo_depth", 10, 64, 8),
    "synth_lfo_rate": synthParam("synth_lfo_rate", 11, 64, 58),
}))


export class TouchMeDb extends Db {
    DB_NAME = "TouchMeDB"
    STORE_NAME = "TouchMe_Patches"
    VERSION = 8

    constructor() {
        super(TouchMeCommandsData);
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}