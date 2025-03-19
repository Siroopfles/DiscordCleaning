import { defineConfig } from 'cypress'
import type { PluginEvents, PluginConfigOptions } from 'cypress/types'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(
      on: PluginEvents,
      config: PluginConfigOptions
    ): Promise<PluginConfigOptions> | PluginConfigOptions {
      // implement node event listeners here
      on('task', {
        log(message: string): null {
          console.log(message)
          return null
        },
      })
      return config
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})