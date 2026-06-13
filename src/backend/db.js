const fs = require('fs')
const path = require('path')
const config = require('./config.js')

const DB_PATH = path.resolve(__dirname, '../../data/db.json')

let pgPool = null
if (config.databaseUrl) {
  const pg = require('pg')
  pgPool = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })
}

class JsonDB {
  data = {}
  counters = {}
  _ready = false

  async init() {
    if (this._ready) return
    await this._initStore()
    await this._load()
    await this._initDefaultTables()
    this._ready = true
  }

  async _initStore() {
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

  async _load() {
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
        const store = JSON.parse(raw)
        for (const key of Object.keys(store)) {
          this.data[key] = store[key].data
          this.counters[key] = store[key].next_id
        }
      } catch {
      }
    }
  }

  async _initDefaultTables() {
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

  async _flush(table) {
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
      let store = {}
      try {
        store = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
      } catch {
      }
      if (table) {
        store[table] = { data: this.data[table], next_id: this.counters[table] }
      } else {
        for (const key of Object.keys(this.data)) {
          store[key] = { data: this.data[key], next_id: this.counters[key] }
        }
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8')
    }
  }

  table(name) {
    if (!this.data[name]) {
      this.data[name] = []
      this.counters[name] = 1
    }
    return this.data[name]
  }

  nextId(table) {
    const nid = this.counters[table] || 1
    this.counters[table] = nid + 1
    return nid
  }

  async insert(table, record) {
    const rows = this.table(table)
    record.id = this.nextId(table)
    rows.push(record)
    await this._flush(table)
    return record.id
  }

  async insertMany(table, records) {
    const rows = this.table(table)
    for (const r of records) {
      r.id = this.nextId(table)
      rows.push(r)
    }
    await this._flush(table)
    return records.map(r => r.id)
  }

  find(table, filters = {}) {
    const rows = this.table(table)
    if (!filters || Object.keys(filters).length === 0) return [...rows]
    return rows.filter(r => Object.entries(filters).every(([k, v]) => r[k] === v))
  }

  findOne(table, filters = {}) {
    for (const r of this.table(table)) {
      if (Object.entries(filters).every(([k, v]) => r[k] === v)) return r
    }
    return null
  }

  get(table, id) {
    for (const r of this.table(table)) {
      if (r.id === id) return r
    }
    return null
  }

  async update(table, id, updates) {
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

  async delete(table, id) {
    this.data[table] = this.table(table).filter(r => r.id !== id)
    await this._flush(table)
  }

  async deleteWhere(table, filters = {}) {
    const rows = this.table(table)
    this.data[table] = rows.filter(r => !Object.entries(filters).every(([k, v]) => r[k] === v))
    await this._flush(table)
  }

  count(table, filters = {}) {
    return this.find(table, filters).length
  }

  query(table) {
    const self = this
    return {
      _filters: {},
      _orderBy: null,
      _orderDesc: false,
      _limit: null,
      filter(f) { Object.assign(this._filters, f); return this },
      orderBy(field, desc = false) { this._orderBy = field; this._orderDesc = desc; return this },
      limit(n) { this._limit = n; return this },
      all() {
        let results = self.find(table, this._filters)
        if (this._orderBy) results.sort((a, b) => {
          const av = a[this._orderBy] || '', bv = b[this._orderBy] || ''
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
module.exports = db
