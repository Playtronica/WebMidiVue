<template>
  <SoundLab ref="sound" mode="reveal" :profile-id="profileId" />
</template>

<script>
import SoundLab from '@sound-lab'

export default {
  name: 'DeviceFirstPlay',
  components: {SoundLab},
  props: {
    profileId: {type: String, required: true}
  },
  async beforeRouteLeave(to, from, next) {
    void from
    const sound = this.$refs.sound
    if (to.path === '/biotron') {
      sound?.releaseHeldKeyboard()
      next()
      return
    }
    if (!sound?.engine && !sound?.midi) {
      next()
      return
    }
    await sound.stop()
    if (sound.releaseBlocked) next(false)
    else next()
  }
}
</script>
