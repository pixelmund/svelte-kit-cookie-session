import preprocess from "svelte-preprocess";
import adapter from "@sveltejs/adapter-node"
import path from "path";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    adapter: adapter({}),
    vite: {
      optimizeDeps: {
        exclude: ['svelte-kit-cookie-session']
      },
      resolve: {
        alias: {
          $cookieSession: path.resolve('../src')
        },
      },
    },
  },
};

export default config;
