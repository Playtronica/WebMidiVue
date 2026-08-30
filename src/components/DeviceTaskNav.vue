<template>
  <div class="device-task-nav">
    <strong class="device-task-nav__device">{{ deviceName }}</strong>
    <nav :aria-label="`${deviceName} tasks`">
      <router-link
        v-for="task in tasks"
        :key="task.id"
        :to="task.route"
        class="device-task-nav__link"
        :class="{'device-task-nav__link--active': task.id === activeTask}"
        :aria-current="task.id === activeTask ? 'page' : null"
      >{{ task.label }}</router-link>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'DeviceTaskNav',
  props: {
    deviceName: {type: String, required: true},
    activeTask: {type: String, required: true},
    playRoute: {type: String, required: true},
    settingsRoute: {type: String, required: true}
  },
  computed: {
    tasks() {
      return [
        {id: 'play', label: 'Play', route: this.playRoute},
        {id: 'settings', label: 'Settings', route: this.settingsRoute}
      ]
    }
  }
}
</script>

<style scoped>
.device-task-nav {
  display: flex;
  width: min(760px, 100%);
  min-height: 48px;
  margin: 0 auto 1.5rem;
  padding: .3rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid #ded9d1;
  border-radius: 999px;
  background: #fbfaf7;
  text-align: left;
}

.device-task-nav__device {
  padding-left: 1rem;
  color: #17171a;
}

.device-task-nav nav {
  display: flex;
  gap: .2rem;
}

.device-task-nav__link {
  display: inline-grid;
  min-height: 40px;
  padding: 0 1rem;
  place-items: center;
  border-radius: 999px;
  color: #4f4a45;
  text-decoration: none;
}

.device-task-nav__link:hover,
.device-task-nav__link:focus-visible {
  color: #17171a;
  background: #eeeae2;
}

.device-task-nav__link--active {
  color: #fff;
  background: #2f6fed;
  font-weight: 700;
  pointer-events: none;
}

@media (max-width: 420px) {
  .device-task-nav { gap: .25rem; }
  .device-task-nav__device { padding-left: .65rem; }
  .device-task-nav__link { padding: 0 .75rem; }
}
</style>
