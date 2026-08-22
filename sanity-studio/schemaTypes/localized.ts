import {defineField, defineType} from 'sanity'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Localized string',
  type: 'object',
  fields: [
    defineField({name: 'ro', title: 'Română', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'en', title: 'English', type: 'string', validation: (Rule) => Rule.required()}),
  ],
})

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Localized text',
  type: 'object',
  fields: [
    defineField({name: 'ro', title: 'Română', type: 'text', rows: 5, validation: (Rule) => Rule.required()}),
    defineField({name: 'en', title: 'English', type: 'text', rows: 5, validation: (Rule) => Rule.required()}),
  ],
})

export const localizedRichText = defineType({
  name: 'localizedRichText',
  title: 'Localized rich text',
  type: 'object',
  fields: [
    defineField({name: 'ro', title: 'Română', type: 'zebrabyteRichText', validation: (Rule) => Rule.required()}),
    defineField({name: 'en', title: 'English', type: 'zebrabyteRichText', validation: (Rule) => Rule.required()}),
  ],
})
