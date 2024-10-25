import {Db} from "@/assets/js/PresetsIDB";
import {SysExCommand} from "@/assets/js/SysExCommand";

let double_sys_ex = (arr, val) => {
    for (let i = 0; i < 8; i++) {
        val *= 10
        arr.push(Math.trunc(val))
        val -= Math.trunc(val)
    }
}


export let PlaytronCommandsData = new Map(Object.entries({
    filter_filtered_last_dep: new SysExCommand({
        name: "filter_filtered_last_dep",
        number_command: 0,
        default_value: 0.9126977,
        max_value: 1,
        step: 0.00000001,
        custom_fold: double_sys_ex
    }),
    filter_no_filtered_current_dep: new SysExCommand({
        name: "filter_no_filtered_current_dep",
        number_command: 1,
        default_value: 0.05365115,
        max_value: 1,
        step: 0.00000001,
        custom_fold: double_sys_ex
    }),
    filter_no_filtered_last_dep: new SysExCommand({
        name: "filter_no_filtered_last_dep",
        number_command: 2,
        default_value: 0.03365115,
        max_value: 1,
        step: 0.00000001,
        custom_fold: double_sys_ex
    }),
    start_adc_val: new SysExCommand({
        name: "start_adc_val",
        number_command: 3,
        default_value: 400,
        max_value: 4096,
        custom_fold: (arr, val) => {
            for (let dig of val.toString().split("").map(Number)) {
                arr.push(dig);
            }
        }
    })
}))


export class PlaytronDb extends Db {
    DB_NAME = "PlaytronDB"
    STORE_NAME = "Playtron_Patches"
    VERSION = 2

    constructor() {
        super(PlaytronCommandsData);
    }
}