<template>
  <div class="search-box">
    <input
        ref="input"
        aria-label="Search"
        :value="query"
        :class="{ 'focused': focused }"
        :placeholder="placeholder"
        autocomplete="off"
        spellcheck="false"
        @input="query = $event.target.value"
        @focus="focused = true"
        @blur="focused = false"
        @keyup.enter="go(focusIndex)"
        @keyup.up="onUp"
        @keyup.down="onDown"
    >
    <ul
        v-if="showSuggestions"
        class="suggestions"
        :class="{ 'align-right': alignRight }"
        @mouseleave="unfocus"
    >
      <template v-for="(s, i) in suggestions">
        <li v-if="s.category!==(suggestions[i-1] || {}).category"> {{ s.category }}: </li>
        <li
            :key="i"
            class="suggestion"
            :class="{ focused: i === focusIndex }"
            @mousedown="go(i)"
            @mouseenter="focus(i)"
        >
          <a
              :href="s.path"
              @click.prevent
          >
            <span class="page-title">{{ s.title || s.path }}</span>
            <span
                v-if="s.header"
                class="header"
            >&gt; {{ s.header.title }}</span>
          </a>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
import matchQuery from './match-query'

/* global SEARCH_MAX_SUGGESTIONS, SEARCH_PATHS, SEARCH_HOTKEYS */
export default {
  name: 'SearchBox',

  data () {
    return {
      query: '',
      focused: false,
      focusIndex: 0,
      placeholder: undefined
    }
  },

  computed: {
    showSuggestions () {
      return (
          this.focused
          && this.suggestions
          && this.suggestions.length
      )
    },

    suggestions () {
      const categories = [{
        name: 'Guides',
        filterFn: page => !this.isFromApiReference(page),
        limit: this.$site.themeConfig.searchLimitGuide || SEARCH_MAX_SUGGESTIONS,
      }, {
        name: 'API Reference',
        filterFn: this.isFromApiReference,
        limit: this.$site.themeConfig.searchLimitApi || SEARCH_MAX_SUGGESTIONS,
      }]

      return categories
        .map(cat => this.suggestionsFromCategory(cat.name, cat.filterFn, cat.limit))
        .reduce((sofar, curr) => sofar.concat(curr), [])
    },

    // make suggestions align right when there are not enough items
    alignRight () {
      const navCount = (this.$site.themeConfig.nav || []).length
      const repo = this.$site.repo ? 1 : 0
      return navCount + repo <= 2
    }
  },

  mounted () {
    this.placeholder = this.$site.themeConfig.searchPlaceholder || ''
    document.addEventListener('keydown', this.onHotkey)
  },

  beforeDestroy () {
    document.removeEventListener('keydown', this.onHotkey)
  },

  methods: {
    suggestionsFromCategory (categoryName, filterFn, limit) {
      const query = this.query.trim().toLowerCase()
      if (!query) {
        return []
      }

      const { pages } = this.$site
      const localePath = this.$localePath
      const res = []
      for (let i = 0; i < pages.length; i++) {
        if (res.length >= limit) break
        const p = pages[i]
        // filter out results that do not match current locale
        if (this.getPageLocalePath(p) !== localePath) {
          continue
        }

        if (!filterFn(p)) {
          continue
        }

        // filter out results that do not match searchable paths
        if (!this.isSearchable(p)) {
          continue
        }

        if (matchQuery(query, p)) {
          res.push({ ...p, category: categoryName })
        } else if (p.headers) {
          for (let j = 0; j < p.headers.length; j++) {
            if (res.length >= limit) break
            const h = p.headers[j]
            if (h.title && matchQuery(query, p, h.title)) {
              res.push({
                ...p,
                path: p.path + '#' + h.slug,
                header: h,
                category: categoryName,
              })
            }
          }
        }
      }
      return res
    },

    isFromApiReference (page) {
      return page.path.startsWith('/api/')
    },

    getPageLocalePath (page) {
      for (const localePath in this.$site.locales || {}) {
        if (localePath !== '/' && page.path.indexOf(localePath) === 0) {
          return localePath
        }
      }
      return '/'
    },

    isSearchable (page) {
      let searchPaths = SEARCH_PATHS

      // all paths searchables
      if (searchPaths === null) { return true }

      searchPaths = Array.isArray(searchPaths) ? searchPaths : new Array(searchPaths)

      return searchPaths.filter(path => {
        return page.path.match(path)
      }).length > 0
    },

    onHotkey (event) {
      if (event.srcElement === document.body && SEARCH_HOTKEYS.includes(event.key)) {
        this.$refs.input.focus()
        event.preventDefault()
      }
    },

    onUp () {
      if (this.showSuggestions) {
        if (this.focusIndex > 0) {
          this.focusIndex--
        } else {
          this.focusIndex = this.suggestions.length - 1
        }
      }
    },

    onDown () {
      if (this.showSuggestions) {
        if (this.focusIndex < this.suggestions.length - 1) {
          this.focusIndex++
        } else {
          this.focusIndex = 0
        }
      }
    },

    go (i) {
      if (!this.showSuggestions) {
        return
      }
      this.$router.push(this.suggestions[i].path)
      this.query = ''
      this.focusIndex = 0
    },

    focus (i) {
      this.focusIndex = i
    },

    unfocus () {
      this.focusIndex = -1
    }
  }
}
</script>

<style lang="stylus">
.search-box
  display inline-block
  position relative
  margin-right 1rem
  input
    cursor text
    width 10rem
    height: 2rem
    color lighten($textColor, 25%)
    display inline-block
    border 1px solid darken($borderColor, 10%)
    border-radius 2rem
    font-size 0.9rem
    line-height 2rem
    padding 0 0.5rem 0 2rem
    outline none
    transition all .2s ease
    background #fff url(search.svg) 0.6rem 0.5rem no-repeat
    background-size 1rem
    &:focus
      cursor auto
      border-color $accentColor
  .suggestions
    background #fff
    width 20rem
    position absolute
    top 2 rem
    border 1px solid darken($borderColor, 10%)
    border-radius 6px
    padding 0.4rem
    list-style-type none
    &.align-right
      right 0
    li:not(.suggestion)
      padding 0.4rem 0.6rem
      margin-bottom 0.4rem
      font-weight 600
      font-size 13px
      border-bottom 1px solid #e9eef2
  .suggestion
    line-height 1.4
    padding 0.4rem 0.6rem
    border-radius 4px
    cursor pointer
    a
      white-space normal
      color lighten($textColor, 35%)
      .page-title
        font-weight 600
      .header
        font-size 0.9em
        margin-left 0.25em
    &.focused
      background-color #f3f4f5
      a
        color $accentColor

@media (max-width: $MQNarrow)
  .search-box
    input
      cursor pointer
      width 0
      border-color transparent
      position relative
      &:focus
        cursor text
        left 0
        width 10rem

// Match IE11
@media all and (-ms-high-contrast: none)
  .search-box input
    height 2rem

@media (max-width: $MQNarrow) and (min-width: $MQMobile)
  .search-box
    .suggestions
      left 0

@media (max-width: $MQMobile)
  .search-box
    margin-right 0
    input
      left 1rem
    .suggestions
      right 0

@media (max-width: $MQMobileNarrow)
  .search-box
    .suggestions
      width calc(100vw - 4rem)
    input:focus
      width 8rem
</style>
