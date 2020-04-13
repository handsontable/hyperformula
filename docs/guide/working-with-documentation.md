---
title: Working with the documentation
---

# Working with the documentation

### TypeDoc is dead

Legacy TSDoc documentation that was generated into HTML files was moved to `/typedoc` directory. The MakeFile commands were kept unchanged.

```shell script
make docs
make servedoc
```

But the NPM run script command has a new prefix: `typedoc`

```shell script
npm run typedoc:build
npm run typedoc:serve
```

### Long live the TypeDoc! :tada:

The same documentation system is used to generate Markdown files. Instead of using built in HTML server, the documentation is now served with VuePress engine.

```shell script
npm run docs:api
npm run docs:dev
```

The dev-server watches changes in `*.md` files and the configuration file for sidebar/navbar links changes. `docs:api` has to be run each time the source code TSDocs change.

Navigate to [http://localhost:8080](http://localhost:8080) for the documentation preview. It will reload automatically each time a change is introduced. There is a main navigation at the **top** and each main section has it's own sidebar navigation.

#### Structure

`/docs/.vuepress/config.js` contains all the navigations used.

`/dosc/api.md` will be copied as the main API Reference page. Should be the introduction/glossary.

`/docs/guides` is where all the developer documentation is kept.

`/docs/api` is auto-generated and will be removed each time `docs:api` command is called. 

`/docs/functions` is reserved for auto-generated functions (i.e. `SUM()`, `MAX()`) descriptions.

::: warning
Do not make any changes inside `/docs/api` or `/docs/functions`. You will lose them.
:::


