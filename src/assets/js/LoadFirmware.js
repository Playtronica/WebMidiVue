import {bootDevice} from "@/assets/js/SysExCommand";

export function compareFirmwareVersions(left = '', right = '') {
    const parse = value => String(value).replace(/^v/, '').split('.').map(part => Number(part) || 0)
    const a = parse(left)
    const b = parse(right)
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
        const difference = (a[index] || 0) - (b[index] || 0)
        if (difference) return Math.sign(difference)
    }
    return 0
}

export async function GetLatestFirmware(repo_link) {
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
    return {
        version: String(data.tag_name || data.name || '').replace(/^v/i, ''),
        name: firmwareAssets[0].name,
        url: firmwareAssets[0].browser_download_url
    }
}

export async function LoadFirmware(repo_link, device) {
    const firmware = await GetLatestFirmware(repo_link)

    // Enter BOOT mode only after the online firmware file has been resolved.
    await bootDevice(device)
    window.location.assign(firmware.url)
}
