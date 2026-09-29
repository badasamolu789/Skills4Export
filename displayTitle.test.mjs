import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildDisplayTitle, getCourseFromDisplayTitle } from './src/utils/displayTitle.ts'

test('professional title combines the current role and workplace', () => {
  assert.equal(buildDisplayTitle('Product Designer', 'Google'), 'Product Designer at Google')
  assert.equal(buildDisplayTitle('Product Designer', ''), '')
})

test('student title combines the course and institution', () => {
  assert.equal(buildDisplayTitle('Medicine and Surgery', 'Rhema University'), 'Medicine and Surgery at Rhema University')
})

test('an existing student title preserves its course when structured course data is absent', () => {
  assert.equal(
    getCourseFromDisplayTitle('Medicine and Surgery at Rhema University', 'Rhema University'),
    'Medicine and Surgery',
  )
  assert.equal(getCourseFromDisplayTitle('Designer at Google', 'Rhema University'), '')
})
