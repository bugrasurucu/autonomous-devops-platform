import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    supportFile: false,
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: false,
});
