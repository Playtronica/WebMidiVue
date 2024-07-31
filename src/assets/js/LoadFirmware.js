import {bootDevice} from "@/assets/js/SysExCommand";


export function LoadFirmware(repo_link, device) {
    fetch(`https://api.github.com/repos/${repo_link}/releases/latest`, {headers: {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }})
        .then(response => response.json())
        .then(data => {
            console.log(data)
            window.location.replace(data.assets[0]["browser_download_url"])
        })
    bootDevice(device)
}

