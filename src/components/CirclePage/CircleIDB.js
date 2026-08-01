import {Db} from "@/assets/js/PresetsIDB";
import {div, SysExCommand} from "@/assets/js/SysExCommand";


function synthFold(param_id) {
    return (arr, val) => {
        arr.push(param_id);
        arr.push(val);
    };
}

export let CircleCommandsData = new Map(Object.entries({
    "bpm": new SysExCommand({
        name: "bpm",
        number_command: 0,
        min_value: 1,
        max_value: 999,
        custom_fold: (arr, val) => {
            while (val > 127) {
                arr.push(val % 127);
                val = div(val, 127);
            }
            arr.push(val);
        }
    }),
    "octave": new SysExCommand({
        name: "octave",
        number_command: 1,
        min_value: 1,
        max_value: 6,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "transpose": new SysExCommand({
        name: "transpose",
        number_command: 2,
        min_value: 0,
        max_value: 8,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "note_count": new SysExCommand({
        name: "note_count",
        number_command: 3,
        min_value: 3,
        max_value: 8,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "play_mode": new SysExCommand({
        name: "play_mode",
        number_command: 4,
        min_value: 0,
        max_value: 2,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "continuous_arpeggio": new SysExCommand({
        name: "continuous_arpeggio",
        number_command: 5,
    }),
    "arp_direction": new SysExCommand({
        name: "arp_direction",
        number_command: 6,
        min_value: 0,
        max_value: 7,
        custom_fold: (arr, val) => { arr.push(val); }
    }),
    "arp_loop": new SysExCommand({
        name: "arp_loop",
        number_command: 7,
    }),
    "octave_boost_count": new SysExCommand({
        name: "octave_boost_count",
        number_command: 8,
        min_value: -12,
        max_value: 12,
        custom_fold: (arr, val) => { arr.push(val + 12); }
    }),
    "arp_rate": new SysExCommand({
        name: "arp_rate",
        number_command: 9,
        min_value: 0,
        max_value: 5,
        custom_fold: (arr, val) => { arr.push(val); }
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
    "synth_volume": new SysExCommand({
        name: "synth_volume",
        number_command: 12,
        min_value: 0,
        max_value: 100,
    }),
    "hold_mode": new SysExCommand({
        name: "hold_mode",
        number_command: 14,
    }),
}))

export const synthFactoryPresetNames = [
    "Default", "Vibrola", "Recorder", "Superlead", "Chromabits",
    "Bell", "Oboe", "Acid bass", "Lasercat", "Minitone",
]

export const synthFactoryPresets = [
    {   // 0 Default
        synth_octave_shift: 5, synth_osc_waveform: 0, synth_osc_2_coarse_pitch: 0,
        synth_osc_2_fine_pitch: 4, synth_osc_1_2_mix: 16, synth_eg_sustain_level: 0,
        synth_eg_decay_time: 40, synth_filter_cutoff: 60, synth_filter_resonance: 3,
        synth_filter_mod_amount: 60, synth_lfo_depth: 16, synth_lfo_rate: 48,
    },
    {   // 1 Vibrola
        synth_octave_shift: 5, synth_osc_waveform: 1, synth_osc_2_coarse_pitch: 4,
        synth_osc_2_fine_pitch: 8, synth_osc_1_2_mix: 8, synth_eg_sustain_level: 0,
        synth_eg_decay_time: 40, synth_filter_cutoff: 50, synth_filter_resonance: 1,
        synth_filter_mod_amount: 60, synth_lfo_depth: 16, synth_lfo_rate: 24,
    },
    {   // 2 Recorder
        synth_octave_shift: 5, synth_osc_waveform: 1, synth_osc_2_coarse_pitch: 0,
        synth_osc_2_fine_pitch: 1, synth_osc_1_2_mix: 1, synth_eg_sustain_level: 50,
        synth_eg_decay_time: 35, synth_filter_cutoff: 33, synth_filter_resonance: 4,
        synth_filter_mod_amount: 42, synth_lfo_depth: 7, synth_lfo_rate: 39,
    },
    {   // 3 Superlead (octave -2)
        synth_octave_shift: 3, synth_osc_waveform: 0, synth_osc_2_coarse_pitch: 12,
        synth_osc_2_fine_pitch: 12, synth_osc_1_2_mix: 24, synth_eg_sustain_level: 50,
        synth_eg_decay_time: 14, synth_filter_cutoff: 68, synth_filter_resonance: 4,
        synth_filter_mod_amount: 45, synth_lfo_depth: 12, synth_lfo_rate: 45,
    },
    {   // 4 Chromabits
        synth_octave_shift: 5, synth_osc_waveform: 1, synth_osc_2_coarse_pitch: 3,
        synth_osc_2_fine_pitch: 2, synth_osc_1_2_mix: 0, synth_eg_sustain_level: 46,
        synth_eg_decay_time: 20, synth_filter_cutoff: 100, synth_filter_resonance: 4,
        synth_filter_mod_amount: 60, synth_lfo_depth: 12, synth_lfo_rate: 32,
    },
    {   // 5 Bell
        synth_octave_shift: 5, synth_osc_waveform: 1, synth_osc_2_coarse_pitch: 12,
        synth_osc_2_fine_pitch: 2, synth_osc_1_2_mix: 21, synth_eg_sustain_level: 29,
        synth_eg_decay_time: 53, synth_filter_cutoff: 70, synth_filter_resonance: 5,
        synth_filter_mod_amount: 19, synth_lfo_depth: 4, synth_lfo_rate: 8,
    },
    {   // 6 Oboe (octave -2)
        synth_octave_shift: 3, synth_osc_waveform: 0, synth_osc_2_coarse_pitch: 12,
        synth_osc_2_fine_pitch: 1, synth_osc_1_2_mix: 55, synth_eg_sustain_level: 64,
        synth_eg_decay_time: 34, synth_filter_cutoff: 40, synth_filter_resonance: 5,
        synth_filter_mod_amount: 18, synth_lfo_depth: 0, synth_lfo_rate: 0,
    },
    {   // 7 Acid bass (octave -3)
        synth_octave_shift: 2, synth_osc_waveform: 0, synth_osc_2_coarse_pitch: 12,
        synth_osc_2_fine_pitch: 12, synth_osc_1_2_mix: 61, synth_eg_sustain_level: 6,
        synth_eg_decay_time: 12, synth_filter_cutoff: 97, synth_filter_resonance: 1,
        synth_filter_mod_amount: 40, synth_lfo_depth: 4, synth_lfo_rate: 45,
    },
    {   // 8 Lasercat
        synth_octave_shift: 5, synth_osc_waveform: 0, synth_osc_2_coarse_pitch: 12,
        synth_osc_2_fine_pitch: 2, synth_osc_1_2_mix: 9, synth_eg_sustain_level: 32,
        synth_eg_decay_time: 42, synth_filter_cutoff: 44, synth_filter_resonance: 3,
        synth_filter_mod_amount: 59, synth_lfo_depth: 10, synth_lfo_rate: 9,
    },
    {   // 9 Minitone
        synth_octave_shift: 5, synth_osc_waveform: 1, synth_osc_2_coarse_pitch: 0,
        synth_osc_2_fine_pitch: 0, synth_osc_1_2_mix: 59, synth_eg_sustain_level: 56,
        synth_eg_decay_time: 18, synth_filter_cutoff: 60, synth_filter_resonance: 4,
        synth_filter_mod_amount: 2, synth_lfo_depth: 8, synth_lfo_rate: 58,
    },
]

export function makeSynthPresetCommand() {
    return new SysExCommand({
        name: "synth_preset",
        number_command: 13,
        min_value: 0,
        max_value: synthFactoryPresets.length - 1,
    })
}

const default_preset = {
    "bpm": 120,
    "octave": 3,
    "transpose": 0,
    "note_count": 3,
    "play_mode": 0,
    "continuous_arpeggio": 0,
    "arp_direction": 0,
    "arp_loop": 1,
    "octave_boost_count": 0,
    "arp_rate": 0,
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
    "synth_volume": 50,
    "hold_mode": 0,
}

export class CircleDb extends Db {
    DB_NAME = "CircleDB"
    STORE_NAME = "Circle_Patches"
    VERSION = 9

    constructor() {
        super(CircleCommandsData)
        this.openDB().then((is_initial) => {
            if (is_initial) {
                this.createNoEditablePatch(default_preset, "Default")
            }
        })
    }
}
