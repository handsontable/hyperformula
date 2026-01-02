<template>
  <div class="hf-hiring-banner">
    <span class="hf-hiring-banner__emoji" aria-hidden="true">🚀</span>
    <span class="hf-hiring-banner__text">
      Join HyperFormula team as a Senior Software Engineer
    </span>
    <a
      class="hf-hiring-banner__cta"
      href="https://handsontable.traffit.com/public/an/4b09e1395bf8ea42ef86db4c4657992c2f48673d"
      target="_blank"
      rel="noopener"
    >
      See the role and apply
    </a>
  </div>
</template>

<script>
export default {
  name: 'HiringBanner',
};
</script>

<style scoped>
:global(:root) {
  --hf-banner-height: 32px;
}

.hf-hiring-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: var(--hf-banner-height);
  padding: 0.65rem 1rem;
  background: linear-gradient(90deg, #0b63ce, #0f8fef);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.hf-hiring-banner__emoji {
  font-size: 1.1rem;
}

.hf-hiring-banner__text {
  flex: 1;
}

.hf-hiring-banner__cta {
  color: #0b63ce;
  background: #fff;
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.1s ease, box-shadow 0.15s ease, background 0.15s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.hf-hiring-banner__cta:hover,
.hf-hiring-banner__cta:focus {
  background: #e8f3ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.16);
}

:global(.theme-container) {
  padding-bottom: calc(var(--hf-banner-height) + 1rem);
}

@media (max-width: 640px) {
  .hf-hiring-banner {
    flex-direction: column;
    align-items: stretch;
  }

  .hf-hiring-banner__cta {
    text-align: center;
  }
}
</style>
