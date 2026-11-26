import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '0ypa3y83',
    dataset: 'production'
  },
  studioHost: 'darwin-core-0ypa3y83',
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
    appId: 'ytx4twp7juo5afg3msx2f8pq',
  },
})
