import {bootDevice} from "@/assets/js/SysExCommand";


export async function LoadFirmware(repo_link, device) {
    if (!navigator.onLine) {
        throw new Error('Firmware updates require an internet connection.')
    }

    const response = await fetch(`https://api.github.com/repos/${repo_link}/releases/latest`, {headers: {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }})

    if (!response.ok) {
        throw new Error(`Could not load the firmware release (${response.status}).`)
    }

    const data = await response.json()
    const firmwareUrl = data.assets?.[0]?.browser_download_url
    if (!firmwareUrl) {
        throw new Error('The latest release does not contain a firmware file.')
    }

    // Enter BOOT mode only after the online firmware file has been resolved.
    bootDevice(device)
    window.location.assign(firmwareUrl)
}
