// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { viteSourceLocator } from "@metagptx/vite-plugin-source-locator";

export default defineConfig({
  plugins: [viteSourceLocator({ prefix: "mgx" }), react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  // server: {
  //   // proxy: {
  //   //   '/api': { target: 'http://localhost:8085', changeOrigin: true, secure: false },
  //   //   '/socket.io': { target: 'http://localhost:8085', ws: true, changeOrigin: true, secure: false },
  //   //   '/uploads': { target: 'http://localhost:8085', changeOrigin: true, secure: false },
  //   //   '/photos': {
  //   //     target: 'http://localhost:8085/uploads',
  //   //     changeOrigin: true,
  //   //     secure: false,
  //   //     // rewrite: (p) => p.replace(/^\/photos/, ''),
  //   //   },
  //   //   '/videos': {
  //   //     target: 'http://localhost:8085/uploads',
  //   //     changeOrigin: true,
  //   //     secure: false,
  //   //     // rewrite: (p) => p.replace(/^\/videos/, ''),
  //   //   },
  //   // }
  // },
});


// export default defineConfig({
//   plugins: [viteSourceLocator({ prefix: "mgx" }), react()],
//   resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
//   server: {
//     proxy: {
//       '/api': { target: 'https://testapi.vismatetechnologies.com', changeOrigin: true, secure: false },
//       '/socket.io': { target: 'https://testapi.vismatetechnologies.com', ws: true, changeOrigin: true, secure: false },
//       '/uploads': { target: 'https://testapi.vismatetechnologies.com', changeOrigin: true, secure: false },
//       '/photos': {
//         target: 'https://testapi.vismatetechnologies.com/uploads',
//         changeOrigin: true,
//         secure: false,
//         // rewrite: (p) => p.replace(/^\/photos/, ''),
//       },
//       '/videos': {
//         target: 'https://testapi.vismatetechnologies.com/uploads',
//         changeOrigin: true,
//         secure: false,
//         // rewrite: (p) => p.replace(/^\/videos/, ''),
//       },
//     }
//   },
// });