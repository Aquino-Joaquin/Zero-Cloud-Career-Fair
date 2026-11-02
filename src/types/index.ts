export type JobType = 'Full-time' | 'Part-time' | 'Internship'
export type Modality = 'On-site' | 'Hybrid' | 'Remote'

export interface Job {
  id: string
  title: string
  type: JobType
  modality: Modality
  location: string
  description: string
  requirements: string[]
  updatedAt: string
}

export interface Company {
  id: string
  name: string
  industry: string
  description: string
  location: string
  website: string
  booth: string
  color: string
  updatedAt: string
  jobs: Job[]
}

/** Lo que devolverá el servidor: la versión permite la sincronización incremental (Día 2). */
export interface Dataset {
  version: number
  updatedAt: string
  companies: Company[]
}
