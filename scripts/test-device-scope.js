const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..', 'src', 'components')
const vueFiles = []
const visit = directory => {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) visit(target)
    else if (entry.name.endsWith('.vue')) vueFiles.push(target)
  }
}
visit(root)

const relative = file => path.relative(root, file).split(path.sep).join('/')
const biotronSelectorUsers = vueFiles
  .filter(file => fs.readFileSync(file, 'utf8').includes('@biotron-device-selector'))
  .map(relative)
  .sort()
const expected = [
  'BiotronPage/BiotronPage.vue',
  'BiotronPage/BiotronPageUpdated.vue',
  'BiotronPage/BiotronUpdatePage.vue'
]
assert.deepStrictEqual(biotronSelectorUsers, expected)

const directSafeSelectorUsers = vueFiles
  .filter(file => fs.readFileSync(file, 'utf8').includes('BiotronDeviceSelector.vue'))
  .map(relative)
assert.deepStrictEqual(directSafeSelectorUsers, [])

const handoffOutsideBiotron = vueFiles
  .filter(file => !relative(file).startsWith('BiotronPage/'))
  .filter(file => fs.readFileSync(file, 'utf8').includes('allow-daw-handoff'))
  .map(relative)
assert.deepStrictEqual(handoffOutsideBiotron, [])

console.log('Device scope verified: beta alias limits safe lifecycle and DAW handoff to Biotron pages.')
