export const INSTALL_PROMPT_AVAILABLE_EVENT = 'playtronica-install-prompt-available'

let installPrompt = null

const captureInstallPrompt = event => {
  event.preventDefault()
  installPrompt = event
  window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_AVAILABLE_EVENT))
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', captureInstallPrompt)
}

export const getInstallPrompt = () => installPrompt

export const takeInstallPrompt = () => {
  const prompt = installPrompt
  installPrompt = null
  return prompt
}

export const clearInstallPrompt = () => {
  installPrompt = null
}
