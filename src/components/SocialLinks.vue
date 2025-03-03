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
      <i :class="network.iconClass"></i>
      <span class="sr-only">{{ network.name }}</span>
    </a>
  </div>
</template>

<script>
import '@fortawesome/fontawesome-free/css/all.min.css';

export default {
  name: "SocialLinks",
  data() {
    return {
      socialNetworks: [
        {
          name: "Facebook",
          url: "https://www.facebook.com/groups/492176784601023",
          iconClass: "fab fa-facebook-f",
        },
        {
          name: "Reddit",
          url: "https://www.reddit.com/r/playtronica/",
          iconClass: "fab fa-reddit",
        },
        {
          name: "Instagram",
          url: "https://www.instagram.com/playtronica/",
          iconClass: "fab fa-instagram",
        },
        {
          name: "YouTube",
          url: "https://www.youtube.com/channel/UCQbPfbsfg1Qn0rYUodylyZg",
          iconClass: "fab fa-youtube",
        },
        {
          name: "X",
          url: "https://x.com/playtronica",
          iconClass: "fab fa-square-x-twitter",
        },

        {
          name: "TikTok",
          url: "https://www.tiktok.com/@playtronica",
          iconClass: "fab fa-tiktok",
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
  font-size: 24px; /* Adjust icon size */
  transition: color 0.3s ease;
}

.social-link:hover {
  color: #007bff; /* Example color change on hover */
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
