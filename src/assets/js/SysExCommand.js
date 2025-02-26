export class SysExCommand {
    flag_device = [11]

    name
    number_command;
    value;
    default_value;
    min_value;
    max_value;
    step;
    sendable;
    fold_function;

    set_value(value) {
        this.value = value
    }


    constructor({
                    name = null,
                    number_command = 0,
                    value = null,
                    min_value = 0,
                    max_value = 127,
                    step = 1,
                    default_value = 0,
                    sendable = true,
                    custom_fold = null,
                }
    ) {
        if (number_command === null) throw "Number Command is null";

        this.name = name === null ? `Command number ${number_command}` : name

        this.number_command = number_command
        this.value = value === null ? default_value : value
        this.min_value = min_value;
        this.max_value = max_value;
        this.step = step;
        this.default_value = default_value
        this.sendable = sendable

        if (custom_fold === null) {
            this.fold_function = (arr, val) => {arr.push(val % 127)}
        }
        else {
            this.fold_function = custom_fold
        }


    }

    toString() {
        return `{"name": "${this.name}", "value": ${this.value}, "params": {
            "number_command": ${this.number_command},
            "min_value": ${this.min_value},
            "max_value": ${this.max_value},
            "step": ${this.step},
            "default_value": ${this.default_value}
        }}`
    }

    toShortDict() {
        return {
            name: this.name,
            value: this.value
        }
    }

    check_params() {
        if (this.min_value > this.max_value) {
            return false;
        }
        if (this.value < this.min_value) {
            return false;
        }
        return this.value <= this.max_value;

    }

    sendToMidi(device, flag=this.flag_device) {
        if (!this.sendable) return;

        let sys_ex_message = [0xF0]

        if (!this.check_params()) return;

        sys_ex_message = sys_ex_message.concat(flag).concat(this.number_command)

        this.fold_function(sys_ex_message, this.value)

        sys_ex_message.push(0xF7);

        console.log(sys_ex_message);

        device.send(sys_ex_message)
    }

}

export function bootDevice(device) {
    if (!device) return;
    device.send([240, 11, 127, 247])
    sleep(100)
    device.send([240, 11, 20, 13, 127, 247])
}


export function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}
