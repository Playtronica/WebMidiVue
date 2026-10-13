<template>
  <section
    class="compatibility-notice"
    :class="{'compatibility-notice--advisory': advisory}"
    :role="advisory ? 'status' : 'alert'"
    :aria-labelledby="headingId"
  >
    <div class="compatibility-notice__mark" aria-hidden="true">!</div>
    <div class="compatibility-notice__content">
      <small>{{ advisory ? 'Limited mode' : 'Compatibility check' }}</small>
      <component :is="advisory ? 'h2' : 'h1'" :id="headingId">{{ issue.title }}</component>
      <p>{{ issue.summary }}</p>
      <ol v-if="issue.steps.length">
        <li v-for="step in issue.steps" :key="step">{{ step }}</li>
      </ol>
      <button v-if="issue.copyLink" type="button" class="btn btn-dark" @click="copyPageLink">
        {{ copied ? 'Link copied' : 'Copy this page link' }}
      </button>
      <span v-if="copyStatus" class="compatibility-notice__copy-status" role="status">{{ copyStatus }}</span>
    </div>
  </section>
</template>

<script>
export default {
  name: 'CompatibilityNotice',
  props: {
    issue: {type: Object, required: true},
    advisory: {type: Boolean, default: false}
  },
  data() {
    return {copied: false, copyStatus: ''}
  },
  computed: {
    headingId() {
      return `compatibility-${this.issue.kind}`
    }
  },
  methods: {
    async copyPageLink() {
      try {
        await navigator.clipboard.writeText(window.location.href)
        this.copied = true
        this.copyStatus = 'Page link copied.'
      } catch (error) {
        this.copyStatus = 'Could not copy the link. Copy it from the address bar.'
      }
    }
  }
}
</script>

<style scoped>
.compatibility-notice {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  width: min(720px, 100%);
  margin: clamp(1.5rem, 6vw, 4rem) auto;
  padding: clamp(1.25rem, 4vw, 2.25rem);
  gap: 1.1rem;
  border: 1px solid #e3b8ad;
  border-radius: 1.5rem;
  background: #fff8f5;
  color: #241a17;
  text-align: left;
}

.compatibility-notice--advisory {
  margin: 0 0 1.5rem;
  border-color: #c9c1ee;
  background: #f7f5ff;
}

.compatibility-notice__mark {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #b6472d;
  font-size: 1.5rem;
  font-weight: 800;
}

.compatibility-notice--advisory .compatibility-notice__mark {
  color: #372d67;
  background: #dfd9ff;
}

.compatibility-notice small {
  color: #7a4e43;
  font-size: .78rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.compatibility-notice--advisory small { color: #5d518f; }
.compatibility-notice h1,
.compatibility-notice h2 { margin: .25rem 0 .45rem; letter-spacing: -.025em; }
.compatibility-notice h1 { font-size: clamp(1.8rem, 5vw, 2.7rem); }
.compatibility-notice h2 { font-size: 1.25rem; }
.compatibility-notice p { margin: 0; color: #66534d; line-height: 1.55; }
.compatibility-notice ol { margin: 1rem 0 1.25rem; padding-left: 1.25rem; }
.compatibility-notice li + li { margin-top: .4rem; }
.compatibility-notice__copy-status { display: block; margin-top: .6rem; color: #66534d; font-size: .9rem; }

@media (max-width: 520px) {
  .compatibility-notice { grid-template-columns: 1fr; }
  .compatibility-notice__mark { width: 46px; height: 46px; }
}
</style>
