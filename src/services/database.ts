import { openDB, type DBSchema } from 'idb'
import type { Company } from '../types'

interface ZeroCloudDB extends DBSchema {
  companies: { key: string; value: Company }
  meta: { key: string; value: string | number }
}

const dbPromise = openDB<ZeroCloudDB>('zero-cloud', 1, {
  upgrade(db) {
    db.createObjectStore('companies', { keyPath: 'id' })
    db.createObjectStore('meta')
  },
})

export async function getAllCompanies(): Promise<Company[]> {
  const companies = await (await dbPromise).getAll('companies')
  return companies.sort((a, b) => a.booth.localeCompare(b.booth))
}

export async function getCompanyById(id: string): Promise<Company | undefined> {
  return (await dbPromise).get('companies', id)
}

export async function saveCompanies(companies: Company[]): Promise<void> {
  const tx = (await dbPromise).transaction('companies', 'readwrite')
  await Promise.all([...companies.map((c) => tx.store.put(c)), tx.done])
}

export async function getMeta<T extends string | number>(key: string): Promise<T | undefined> {
  return (await (await dbPromise).get('meta', key)) as T | undefined
}

export async function setMeta(key: string, value: string | number): Promise<void> {
  await (await dbPromise).put('meta', value, key)
}

export async function clearDatabase(): Promise<void> {
  const db = await dbPromise
  await Promise.all([db.clear('companies'), db.clear('meta')])
}
