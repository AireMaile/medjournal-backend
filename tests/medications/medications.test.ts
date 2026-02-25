/**
 * tests/medications/medications.test.ts
 *
 * Integration tests for the medications master list.
 *
 * Covers:
 *   GET /v1/medications
 */

import request from 'supertest'
import app from '../../src/app'
import { clearDatabase, createTestMedication } from '../helpers/factories'

beforeEach(async () => {
  await clearDatabase()
})

describe('GET /v1/medications', () => {

  // ─── Happy Path ─────────────────────────────────────────────────────────────

  it('returns all medications as an array', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })
    await createTestMedication({ name: 'Fluoxetine', category: 'SSRI' })
    await createTestMedication({ name: 'Venlafaxine', category: 'SNRI' })

    const res = await request(app).get('/v1/medications')

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(3)
  })

  it('returns an empty array when no medications exist', async () => {
    const res = await request(app).get('/v1/medications')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns medications sorted alphabetically by name', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })
    await createTestMedication({ name: 'Fluoxetine', category: 'SSRI' })
    await createTestMedication({ name: 'Bupropion', category: 'Atypical' })

    const res = await request(app).get('/v1/medications')

    expect(res.status).toBe(200)
    const names = res.body.map((m: any) => m.name)
    expect(names).toEqual(['Bupropion', 'Fluoxetine', 'Sertraline'])
  })

  it('returns the expected fields on each medication', async () => {
    await createTestMedication({
      name: 'Sertraline',
      category: 'SSRI',
      commonDosages: ['25mg', '50mg', '100mg'],
    })

    const res = await request(app).get('/v1/medications')

    expect(res.status).toBe(200)
    expect(res.body[0]).toMatchObject({
      name: 'Sertraline',
      category: 'SSRI',
      commonDosages: ['25mg', '50mg', '100mg'],
    })
    expect(res.body[0].id).toBeDefined()
  })

  // ─── No Auth Required ────────────────────────────────────────────────────────

  it('does not require an auth token', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })

    const res = await request(app)
      .get('/v1/medications')
    // No Authorization header

    expect(res.status).toBe(200)
  })

  // ─── Search Filter ───────────────────────────────────────────────────────────

  it('filters by name with ?search=', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })
    await createTestMedication({ name: 'Fluoxetine', category: 'SSRI' })

    const res = await request(app).get('/v1/medications?search=ser')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Sertraline')
  })

  it('search is case insensitive', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })

    const res = await request(app).get('/v1/medications?search=SERTR')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Sertraline')
  })

  it('returns empty array when search matches nothing', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })

    const res = await request(app).get('/v1/medications?search=xyznotreal')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  // ─── Category Filter ─────────────────────────────────────────────────────────

  it('filters by category with ?category=', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })
    await createTestMedication({ name: 'Fluoxetine', category: 'SSRI' })
    await createTestMedication({ name: 'Venlafaxine', category: 'SNRI' })

    const res = await request(app).get('/v1/medications?category=SSRI')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    res.body.forEach((m: any) => expect(m.category).toBe('SSRI'))
  })

  it('category filter is case insensitive', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })

    const res = await request(app).get('/v1/medications?category=ssri')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  it('returns empty array for an unknown category', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })

    const res = await request(app).get('/v1/medications?category=FAKECATEGORY')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  // ─── Combined Filters ────────────────────────────────────────────────────────

  it('combines search and category filters', async () => {
    await createTestMedication({ name: 'Sertraline', category: 'SSRI' })
    await createTestMedication({ name: 'Escitalopram', category: 'SSRI' })
    await createTestMedication({ name: 'Sertraline-clone', category: 'SNRI' }) // same name pattern, different category

    const res = await request(app).get('/v1/medications?search=ser&category=SSRI')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].name).toBe('Sertraline')
  })
})