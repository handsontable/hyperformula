(window.webpackJsonp=window.webpackJsonp||[]).push([[4],{301:function(e,t,s){},319:function(e,t,s){"use strict";s(301)},324:function(e,t,s){"use strict";s(116),s(119),s(14),s(20),s(40),s(120),s(299);var n=s(122),o=s.n(n),i=(e,t,s=null)=>{let n=o()(t,"title","");return o()(t,"frontmatter.tags")&&(n+=" "+t.frontmatter.tags.join(" ")),s&&(n+=" "+s),r(e,n)};const r=(e,t)=>{const s=t.toLowerCase();return e.toLowerCase().split(/\s+/g).map(e=>e.trim()).filter(e=>!!e).every(e=>s.indexOf(e)>-1)};var u={name:"SearchBox",data:()=>({query:"",focused:!1,focusIndex:0,placeholder:void 0}),computed:{showSuggestions(){return this.focused&&this.suggestions&&this.suggestions.length},suggestions(){return[{name:"Guides",filterFn:e=>!this.isFromApiReference(e),limit:this.$site.themeConfig.searchLimitGuide||5},{name:"API Reference",filterFn:this.isFromApiReference,limit:this.$site.themeConfig.searchLimitApi||5}].map(e=>this.suggestionsFromCategory(e.name,e.filterFn,e.limit)).reduce((e,t)=>e.concat(t),[])},alignRight(){return(this.$site.themeConfig.nav||[]).length+(this.$site.repo?1:0)<=2}},mounted(){this.placeholder=this.$site.themeConfig.searchPlaceholder||"",document.addEventListener("keydown",this.onHotkey)},beforeDestroy(){document.removeEventListener("keydown",this.onHotkey)},methods:{suggestionsFromCategory(e,t,s){const n=this.query.trim().toLowerCase();if(!n)return[];const{pages:o}=this.$site,r=this.$localePath,u=[];for(let a=0;a<o.length&&!(u.length>=s);a++){const l=o[a];if(this.getPageLocalePath(l)===r&&t(l)&&this.isSearchable(l))if(i(n,l))u.push({...l,category:e});else if(l.headers)for(let t=0;t<l.headers.length&&!(u.length>=s);t++){const s=l.headers[t];s.title&&i(n,l,s.title)&&u.push({...l,path:l.path+"#"+s.slug,header:s,category:e})}}return u},isFromApiReference:e=>e.path.startsWith("/api/"),getPageLocalePath(e){for(const t in this.$site.locales||{})if("/"!==t&&0===e.path.indexOf(t))return t;return"/"},isSearchable(e){let t=null;return null===t||(t=Array.isArray(t)?t:new Array(t),t.filter(t=>e.path.match(t)).length>0)},onHotkey(e){e.srcElement===document.body&&["s","/"].includes(e.key)&&(this.$refs.input.focus(),e.preventDefault())},onUp(){this.showSuggestions&&(this.focusIndex>0?this.focusIndex--:this.focusIndex=this.suggestions.length-1)},onDown(){this.showSuggestions&&(this.focusIndex<this.suggestions.length-1?this.focusIndex++:this.focusIndex=0)},go(e){this.showSuggestions&&(this.$router.push(this.suggestions[e].path),this.query="",this.focusIndex=0)},focus(e){this.focusIndex=e},unfocus(){this.focusIndex=-1}}},a=(s(319),s(25)),l=Object(a.a)(u,(function(){var e=this,t=e._self._c;return t("div",{staticClass:"search-box"},[t("input",{ref:"input",class:{focused:e.focused},attrs:{"aria-label":"Search",placeholder:e.placeholder,autocomplete:"off",spellcheck:"false"},domProps:{value:e.query},on:{input:function(t){e.query=t.target.value},focus:function(t){e.focused=!0},blur:function(t){e.focused=!1},keyup:[function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"enter",13,t.key,"Enter")?null:e.go(e.focusIndex)},function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"up",38,t.key,["Up","ArrowUp"])?null:e.onUp.apply(null,arguments)},function(t){return!t.type.indexOf("key")&&e._k(t.keyCode,"down",40,t.key,["Down","ArrowDown"])?null:e.onDown.apply(null,arguments)}]}}),e._v(" "),e.showSuggestions?t("ul",{staticClass:"suggestions",class:{"align-right":e.alignRight},on:{mouseleave:e.unfocus}},[e._l(e.suggestions,(function(s,n){return[s.category!==(e.suggestions[n-1]||{}).category?t("li",[e._v(" "+e._s(s.category)+": ")]):e._e(),e._v(" "),t("li",{key:n,staticClass:"suggestion",class:{focused:n===e.focusIndex},on:{mousedown:function(t){return e.go(n)},mouseenter:function(t){return e.focus(n)}}},[t("a",{attrs:{href:s.path},on:{click:function(e){e.preventDefault()}}},[t("span",{staticClass:"page-title"},[e._v(e._s(s.title||s.path))]),e._v(" "),s.header?t("span",{staticClass:"header"},[e._v("> "+e._s(s.header.title))]):e._e()])])]}))],2):e._e()])}),[],!1,null,null,null);t.a=l.exports}}]);