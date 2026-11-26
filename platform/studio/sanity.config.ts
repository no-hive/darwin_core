import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {codeInput} from '@sanity/code-input'
import {table} from '@sanity/table'

export default defineConfig({
  name: 'default',
  title: 'Darwin Core',

  projectId: '0ypa3y83',
  dataset: 'production',

  plugins: [structureTool(), visionTool(), codeInput(), table()],

  schema: {
    types: schemaTypes,
  },
})
