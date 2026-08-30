<template>
  <SoundLab ref="sound" mode="reveal" device-pattern="Biotron" />
</template>

<script>
import SoundLab from '@sound-lab'

export default {
  name: 'BiotronFirstPlay',
  components: {SoundLab},
  async beforeRouteLeave(to, from, next) {
    void to
    void from
    const sound = this.$refs.sound
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
