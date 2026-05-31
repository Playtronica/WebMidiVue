import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";


function synthFold(param_id) {
    return (arr, val) => {
        arr.push(param_id);
        arr.push(val);
    };
}

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
    }),
    "synth_octave_shift": new SysExCommand({
        name: "synth_octave_shift",
        number_command: 10,
        max_value: 9,
        custom_fold: synthFold(0),
    }),
    "synth_osc_waveform": new SysExCommand({
        name: "synth_osc_waveform",
        number_command: 10,
        max_value: 1,
        custom_fold: synthFold(1),
    }),
    "synth_osc_2_coarse_pitch": new SysExCommand({
        name: "synth_osc_2_coarse_pitch",
        number_command: 10,
        max_value: 24,
        custom_fold: synthFold(2),
    }),
    "synth_osc_2_fine_pitch": new SysExCommand({
        name: "synth_osc_2_fine_pitch",
        number_command: 10,
        max_value: 32,
        custom_fold: synthFold(3),
    }),
    "synth_osc_1_2_mix": new SysExCommand({
        name: "synth_osc_1_2_mix",
        number_command: 10,
        max_value: 64,
        custom_fold: synthFold(4),
    }),
    "synth_eg_sustain_level": new SysExCommand({
        name: "synth_eg_sustain_level",
        number_command: 10,
        max_value: 64,
        custom_fold: synthFold(5),
    }),
    "synth_eg_decay_time": new SysExCommand({
        name: "synth_eg_decay_time",
        number_command: 10,
        max_value: 64,
        custom_fold: synthFold(6),
    }),
    "synth_filter_cutoff": new SysExCommand({
        name: "synth_filter_cutoff",
        number_command: 10,
        max_value: 120,
        custom_fold: synthFold(7),
    }),
    "synth_filter_resonance": new SysExCommand({
        name: "synth_filter_resonance",
        number_command: 10,
        max_value: 5,
        custom_fold: synthFold(8),
    }),
    "synth_filter_mod_amount": new SysExCommand({
        name: "synth_filter_mod_amount",
        number_command: 10,
        max_value: 60,
        custom_fold: synthFold(9),
    }),
    "synth_lfo_depth": new SysExCommand({
        name: "synth_lfo_depth",
        number_command: 10,
        max_value: 64,
        custom_fold: synthFold(10),
    }),
    "synth_lfo_rate": new SysExCommand({
        name: "synth_lfo_rate",
        number_command: 10,
        max_value: 64,
        custom_fold: synthFold(11),
    }),
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
    "synth_octave_shift": 0,
    "synth_osc_waveform": 1,
    "synth_osc_2_coarse_pitch": 0,
    "synth_osc_2_fine_pitch": 0,
    "synth_osc_1_2_mix": 59,
    "synth_eg_sustain_level": 56,
    "synth_eg_decay_time": 18,
    "synth_filter_cutoff": 60,
    "synth_filter_resonance": 4,
    "synth_filter_mod_amount": 2,
    "synth_lfo_depth": 8,
    "synth_lfo_rate": 58,
}

export class TouchMeDb extends Db {
    DB_NAME = "TouchMeDB"
    STORE_NAME = "TouchMe_Patches"
    VERSION = 9

    constructor() {
        super(TouchMeCommandsData);
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}