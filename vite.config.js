import { sveltekit } from '@sveltejs/kit/vite';
import { cookieSession } from "./src/lib/vite/index.js";

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), cookieSession()]
};

export default config;
