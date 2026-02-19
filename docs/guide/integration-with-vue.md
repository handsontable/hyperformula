# Integration with Vue

Installing HyperFormula in a Vue application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Troubleshooting

### Vue reactivity issues

If you encounter an error like

```
Uncaught TypeError: Cannot read properties of undefined (reading 'licenseKeyValidityState')
```

it means that Vue's reactivity system tries to deeply observe the HyperFormula instance. To fix this, wrap your HyperFormula instance in Vue's [`markRaw`](https://vuejs.org/api/reactivity-advanced.html#markraw) function:

```javascript
import { markRaw } from 'vue';
import { HyperFormula } from 'hyperformula';

const hfInstance = markRaw(
  HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
  })
);
```

This function prevents Vue from converting the HyperFormula instance into a reactive proxy, which can cause errors and performance issues.

## Demo

::: tip
This demo uses the [Vue 3](https://v3.vuejs.org/) framework. If you are looking for an example using Vue 2, check out the [code on GitHub](https://github.com/handsontable/hyperformula-demos/tree/2.5.x/vue-demo).
:::

<iframe
  :src="`https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/3.2.x/vue-3-demo?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview&v=${$page.buildDateURIEncoded}`"
  style="width:100%; height:1070px; border:0; border-radius: 4px; overflow:hidden;"
  title="handsontable/hyperformula-demos: react-demo"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>
