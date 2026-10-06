// Owns the bounded Biotron settings read and the delayed saved-copy check.
export function createSettingsConnectionMethods({settingsVectorFromCommands,
  settingsVectorsEqual, savedSettingsMessage}) {
  return {
    markPresetPending() {
      if (!this.betaBuild) return
      this.clearLiveVerification()
      this.lastChangedSetting = "preset"
      this.presetPending = true
      this.settingsState = "changed"
      this.settingsMessage = "Preset loaded in browser. Apply preset to Biotron to hear and save it."
    },
    async readPersistedSettingsWithRetry(device, attempts = 3) {
      let lastError
      for (let attempt = 0; attempt < attempts; attempt++) {
        if (this.device !== device) throw new Error("Biotron changed.")
        try {
          return await this.requestPersistedSettingsWithin(3500)
        } catch (error) {
          lastError = error
          if (error?.name === "AbortError") throw error
          if (attempt + 1 < attempts) await new Promise(resolve => setTimeout(resolve, 450))
        }
      }
      throw lastError
    },
    async requestPersistedSettingsWithin(timeoutMs) {
      let timeout
      try {
        return await Promise.race([
          this.$refs.deviceSelector.requestPersistedSettings(),
          new Promise((resolve, reject) => {
            timeout = setTimeout(() => reject(new Error("Saved settings check timed out.")), timeoutMs)
          })
        ])
      } finally {
        clearTimeout(timeout)
      }
    },
    scheduleLiveVerification(device) {
      this.clearLiveVerification()
      const verifyId = this.liveVerifyId
      this.liveVerifyTimer = setTimeout(async () => {
        this.liveVerifyTimer = null
        if (this.device !== device || verifyId !== this.liveVerifyId) return
        try {
          const expected = settingsVectorFromCommands(this.commands_data)
          const snapshot = await this.readPersistedSettingsWithRetry(device, 2)
          if (this.device !== device || verifyId !== this.liveVerifyId) return
          if (snapshot.dirty || !settingsVectorsEqual(snapshot.values, expected)) {
            throw new Error("Saved settings did not match the controls.")
          }
          this.settingsState = "saved"
          this.settingsMessage = savedSettingsMessage(this.lastChangedSetting)
        } catch (error) {
          if (this.device !== device || verifyId !== this.liveVerifyId) return
          this.settingsState = "error"
          this.settingsMessage = "Changed live. Saved copy could not be confirmed — try Check saved settings."
        }
      }, 1500)
    },
  }
}
