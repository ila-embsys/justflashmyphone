import react from "@vitejs/plugin-react";
import { defineConfig, type UserConfig } from "vite";

/**
 * Determines the base path for the Vite build.
 * - In a local environment, it defaults to '/'.
 * - In a GitHub Actions environment, it checks if the repository is a user/org page
 *   (e.g., `owner.github.io`) and sets the base to '/' accordingly.
 * - For all other repositories (project pages), it sets the base to '/<repo-name>/'.
 */
function getBase() {
  const githubRepo = process.env.GITHUB_REPOSITORY;
  if (!githubRepo) return '/';

  const [owner, repoName] = githubRepo.split('/');
  return repoName === `${owner}.github.io` ? '/' : `/${repoName}/`;
}

export default defineConfig({
  plugins: [react()],
  base: getBase(),
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  worker: {
    format: "es"
  },
  build: {
    target: 'esnext',
  }

});
