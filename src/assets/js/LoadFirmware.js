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
    const releasePrefix = `https://github.com/${repo_link}/releases/download/`
    const firmwareAssets = (data.assets || []).filter((asset) =>
        typeof asset.name === 'string' && asset.name.toLowerCase().endsWith('.uf2') &&
        typeof asset.browser_download_url === 'string' && asset.browser_download_url.startsWith(releasePrefix)
    )
    if (firmwareAssets.length !== 1) {
        throw new Error('The latest release must contain exactly one verified .uf2 firmware file.')
    }
    const firmwareUrl = firmwareAssets[0].browser_download_url

    // Enter BOOT mode only after the online firmware file has been resolved.
    bootDevice(device)
    window.location.assign(firmwareUrl)
}
