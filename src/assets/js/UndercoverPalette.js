// Colors of the picker: shown color -> color sent to the device at full brightness
export const UNDERCOVER_PALETTE = {
    "#E6E6E6": "#FFE9AD",
    '#FF0000': "#FF0000",
    "#FFA500": "#FF4000",
    "#FFFF00": "#FF6E00",
    "#90FF00": "#90FF00",
    '#00FFFF': '#00FFFF',
    "#0040FF": '#0080FF',
    "#AE00FF": "#AE00FF",
}

// Same scaling as the picker does: every channel * brightness / 100
export function applyBrightness(rgb, brightness) {
    const scale = (channel) => Math.min(255, Math.round(channel * brightness / 100))
    return (scale((rgb >> 16) & 0xFF) << 16) | (scale((rgb >> 8) & 0xFF) << 8) | scale(rgb & 0xFF)
}

// Picker color and brightness that give the device color, null if it can't be picked
export function matchUndercoverColor(rgb) {
    for (let brightness = 100; brightness >= 0; brightness--) {
        for (const [shown, sent] of Object.entries(UNDERCOVER_PALETTE)) {
            if (applyBrightness(parseInt(sent.substring(1), 16), brightness) === rgb) {
                return {color: parseInt(shown.substring(1), 16), brightness}
            }
        }
    }
    return null
}
