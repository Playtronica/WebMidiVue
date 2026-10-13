<template>
  <div class="social-links">
    <a
        v-for="network in socialNetworks"
        :key="network.name"
        :href="network.url"
        :title="network.name"
        target="_blank"
        rel="noopener noreferrer"
        class="social-link"
    >
      <img :src="network.icon" alt="" class="social-link__icon" aria-hidden="true">
      <span class="sr-only">{{ network.name }}</span>
    </a>
  </div>
</template>

<script>
import facebook from '@fortawesome/fontawesome-free/svgs/brands/facebook-f.svg'
import reddit from '@fortawesome/fontawesome-free/svgs/brands/reddit.svg'
import instagram from '@fortawesome/fontawesome-free/svgs/brands/instagram.svg'
import youtube from '@fortawesome/fontawesome-free/svgs/brands/youtube.svg'
import xTwitter from '@fortawesome/fontawesome-free/svgs/brands/square-x-twitter.svg'
import tiktok from '@fortawesome/fontawesome-free/svgs/brands/tiktok.svg'

export default {
  name: "SocialLinks",
  data() {
    return {
      socialNetworks: [
        {
          name: "Facebook",
          url: "https://www.facebook.com/groups/492176784601023",
          icon: facebook,
        },
        {
          name: "Reddit",
          url: "https://www.reddit.com/r/playtronica/",
          icon: reddit,
        },
        {
          name: "Instagram",
          url: "https://www.instagram.com/playtronica/",
          icon: instagram,
        },
        {
          name: "YouTube",
          url: "https://www.youtube.com/channel/UCQbPfbsfg1Qn0rYUodylyZg",
          icon: youtube,
        },
        {
          name: "X",
          url: "https://x.com/playtronica",
          icon: xTwitter,
        },

        {
          name: "TikTok",
          url: "https://www.tiktok.com/@playtronica",
          icon: tiktok,
        },
      ],
    };
  },
};
</script>

<style scoped>
.social-links {
  display: flex;
  gap: 20px; /* Spacing between icons */
  justify-content: center;
  padding: 10px 0;
}

.social-link {
  text-decoration: none;
  color: inherit;
}

.social-link__icon {
  display: block;
  width: 24px;
  height: 24px;
  transition: opacity 0.2s ease;
}

.social-link:hover .social-link__icon,
.social-link:focus-visible .social-link__icon {
  opacity: 0.65;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
