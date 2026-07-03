import fs from 'fs'
import path from 'path'
import pg from 'pg'
import { config } from './config'

const DB_PATH = path.resolve(__dirname, '../../data/db.json')
const DB_TMP_PATH = DB_PATH + '.tmp'

let pgPool: pg.Pool | null = null
if (config.databaseUrl) {
  pgPool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
  pgPool.on('error', (err: Error) => {
    console.error('PostgreSQL pool error:', err.message, err.stack)
  })
} else if (process.env.NODE_ENV === 'production') {
  console.warn('WARNING: DATABASE_URL not set. Using JSON file store. Data will not persist across restarts in production.')
}

let writeLock: Promise<void> = Promise.resolve()

interface QueryBuilder {
  _filters: Record<string, any>
  _orderBy: string | null
  _orderDesc: boolean
  _limit: number | null
  filter(f: Record<string, any>): QueryBuilder
  orderBy(field: string, desc?: boolean): QueryBuilder
  limit(n: number): QueryBuilder
  all(): any[]
  first(): any | null
  count(): number
}

class JsonDB {
  data: Record<string, any[]> = {}
  counters: Record<string, number> = {}
  _ready: boolean = false
  _initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this._ready) return
    if (this._initPromise) return this._initPromise
    this._initPromise = this._initInternal()
    return this._initPromise
  }

  async _initInternal(): Promise<void> {
    if (this._ready) return
    await this._initStore()
    await this._load()
    await this._initDefaultTables()
    this._ready = true
  }

  async _initStore(): Promise<void> {
    if (pgPool) {
      const client = await pgPool.connect()
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS jsondb_store (
            key TEXT PRIMARY KEY,
            data JSONB NOT NULL DEFAULT '[]'::jsonb,
            next_id INTEGER NOT NULL DEFAULT 1
          )
        `)
      } finally {
        client.release()
      }
    } else {
      const dir = path.dirname(DB_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, '{}', 'utf-8')
      }
    }
  }

  async _load(): Promise<void> {
    if (pgPool) {
      const client = await pgPool.connect()
      try {
        const result = await client.query('SELECT key, data, next_id FROM jsondb_store')
        for (const row of result.rows) {
          this.data[row.key] = row.data
          this.counters[row.key] = row.next_id
        }
      } finally {
        client.release()
      }
    } else {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8')
        if (raw.trim()) {
          const store = JSON.parse(raw)
          for (const key of Object.keys(store)) {
            this.data[key] = store[key].data
            this.counters[key] = store[key].next_id
          }
        }
      } catch (parseErr: any) {
        console.error('WARN: Corrupted db.json detected — backing up and starting fresh:', parseErr.message)
        try {
          const backupPath = DB_PATH + '.' + Date.now() + '.bak'
          fs.copyFileSync(DB_PATH, backupPath)
          console.error('Backed up corrupted db.json to', backupPath)
        } catch (backupErr: any) {
          console.error('Failed to backup corrupted db.json:', backupErr.message)
        }
      }
    }
  }

  async _initDefaultTables(): Promise<void> {
    const defaults = ['users', 'categories', 'documents', 'topics', 'reading_blocks',
      'formulas', 'mcqs', 'notes', 'todos', 'daily_plans', 'progress']
    for (const t of defaults) {
      if (!this.data[t]) {
        this.data[t] = []
        this.counters[t] = 1
        await this._flush(t)
      }
    }
  }

  async _flush(table?: string): Promise<void> {
    if (pgPool) {
      const client = await pgPool.connect()
      try {
        if (table) {
          await client.query(
            `INSERT INTO jsondb_store (key, data, next_id)
             VALUES ($1, $2::jsonb, $3)
             ON CONFLICT (key) DO UPDATE SET data = $2::jsonb, next_id = $3`,
            [table, JSON.stringify(this.data[table]), this.counters[table]]
          )
        } else {
          for (const key of Object.keys(this.data)) {
            await client.query(
              `INSERT INTO jsondb_store (key, data, next_id)
               VALUES ($1, $2::jsonb, $3)
               ON CONFLICT (key) DO UPDATE SET data = $2::jsonb, next_id = $3`,
              [key, JSON.stringify(this.data[key]), this.counters[key]]
            )
          }
        }
      } finally {
        client.release()
      }
    } else {
      const task = async () => {
        let store: Record<string, any> = {}
        try {
          const raw = fs.readFileSync(DB_PATH, 'utf-8')
          if (raw.trim()) store = JSON.parse(raw)
        } catch (readErr: any) {
          if (readErr.code !== 'ENOENT') {
            console.error('WARN: Could not read db.json for flush, starting fresh:', readErr.message)
          }
        }
        if (table) {
          store[table] = { data: this.data[table], next_id: this.counters[table] }
        } else {
          for (const key of Object.keys(this.data)) {
            store[key] = { data: this.data[key], next_id: this.counters[key] }
          }
        }
        const content = JSON.stringify(store, null, 2)
        fs.writeFileSync(DB_TMP_PATH, content, 'utf-8')
        fs.renameSync(DB_TMP_PATH, DB_PATH)
      }
      writeLock = writeLock.then(task, task)
      await writeLock
    }
  }

  table(name: string): any[] {
    if (!this.data[name]) {
      this.data[name] = []
      this.counters[name] = 1
    }
    return this.data[name]
  }

  nextId(table: string): number {
    const nid = this.counters[table] || 1
    this.counters[table] = nid + 1
    return nid
  }

  async insert(table: string, record: any): Promise<number> {
    const rows = this.table(table)
    record.id = this.nextId(table)
    rows.push(record)
    await this._flush(table)
    return record.id
  }

  async insertMany(table: string, records: any[]): Promise<number[]> {
    const rows = this.table(table)
    for (const r of records) {
      r.id = this.nextId(table)
      rows.push(r)
    }
    await this._flush(table)
    return records.map(r => r.id)
  }

  find(table: string, filters: Record<string, any> = {}): any[] {
    const rows = this.table(table)
    if (!filters || Object.keys(filters).length === 0) return [...rows]
    return rows.filter(r => Object.entries(filters).every(([k, v]) => r[k] === v))
  }

  findOne(table: string, filters: Record<string, any> = {}): any {
    for (const r of this.table(table)) {
      if (Object.entries(filters).every(([k, v]) => r[k] === v)) return r
    }
    return null
  }

  get(table: string, id: number): any {
    for (const r of this.table(table)) {
      if (r.id === id) return r
    }
    return null
  }

  async update(table: string, id: number, updates: Record<string, any>): Promise<boolean> {
    const rows = this.table(table)
    for (const r of rows) {
      if (r.id === id) {
        Object.assign(r, updates)
        await this._flush(table)
        return true
      }
    }
    return false
  }

  async delete(table: string, id: number): Promise<void> {
    this.data[table] = this.table(table).filter(r => r.id !== id)
    await this._flush(table)
  }

  async deleteWhere(table: string, filters: Record<string, any> = {}): Promise<void> {
    const rows = this.table(table)
    this.data[table] = rows.filter(r => !Object.entries(filters).every(([k, v]) => r[k] === v))
    await this._flush(table)
  }

  count(table: string, filters: Record<string, any> = {}): number {
    return this.find(table, filters).length
  }

  query(table: string): QueryBuilder {
    const self = this
    return {
      _filters: {},
      _orderBy: null,
      _orderDesc: false,
      _limit: null,
      filter(f: Record<string, any>) { Object.assign(this._filters, f); return this },
      orderBy(field: string, desc = false) { this._orderBy = field; this._orderDesc = desc; return this },
      limit(n: number) { this._limit = n; return this },
      all() {
        let results = self.find(table, this._filters)
        if (this._orderBy) results.sort((a, b) => {
          const av = a[this._orderBy!] || '', bv = b[this._orderBy!] || ''
          return this._orderDesc ? (bv > av ? 1 : bv < av ? -1 : 0) : (av > bv ? 1 : av < bv ? -1 : 0)
        })
        if (this._limit) results = results.slice(0, this._limit)
        return results
      },
      first() { return this.all()[0] || null },
      count() { return self.find(table, this._filters).length },
    }
  }
}

const db = new JsonDB()
export { JsonDB }
export default db
