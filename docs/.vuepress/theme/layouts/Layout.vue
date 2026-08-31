<template>
  <ParentLayout>
    <template #page-top>
      <ViewMarkdownLink />
    </template>
  </ParentLayout>
</template>

<script>
// Overrides `@vuepress/theme-default`'s `Layout.vue` only to fill the
// `page-top` slot it exposes (rendered above `<Content>` in `Page.vue`),
// so the "View as Markdown" link appears at the top of every guide page's
// article body — not as a fixed floating overlay.
import ParentLayout from '@parent-theme/layouts/Layout.vue';
import ViewMarkdownLink from '../../components/ViewMarkdownLink.vue';

export default {
  name: 'Layout',
  components: { ParentLayout, ViewMarkdownLink },
};
</script>
