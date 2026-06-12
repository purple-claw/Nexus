import json
import threading
import psycopg2
import psycopg2.extras


class PgJsonDB:
    def __init__(self, dsn):
        self.dsn = dsn
        self.lock = threading.Lock()
        self.data = {}
        self.counters = {}
        self.conn = psycopg2.connect(dsn)
        self.conn.autocommit = True
        self._init_store()
        self._load()
        self._init_default_tables()

    def _init_store(self):
        with self.conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS jsondb_store (
                    key TEXT PRIMARY KEY,
                    data JSONB NOT NULL DEFAULT '[]'::jsonb,
                    next_id INTEGER NOT NULL DEFAULT 1
                )
            """)

    def _load(self):
        with self.conn.cursor() as cur:
            cur.execute("SELECT key, data, next_id FROM jsondb_store")
            for key, data, next_id in cur:
                self.data[key] = data
                self.counters[key] = next_id

    def _init_default_tables(self):
        defaults = ['users', 'categories', 'documents', 'topics', 'reading_blocks',
                    'formulas', 'mcqs', 'notes', 'todos', 'daily_plans', 'progress']
        for t in defaults:
            if t not in self.data:
                self.data[t] = []
                self.counters[t] = 1
                self._flush(t)

    def _flush(self, table=None):
        with self.conn.cursor() as cur:
            if table:
                cur.execute(
                    "INSERT INTO jsondb_store (key, data, next_id) "
                    "VALUES (%s, %s::jsonb, %s) "
                    "ON CONFLICT (key) DO UPDATE SET data = %s::jsonb, next_id = %s",
                    (table, json.dumps(self.data[table], default=str), self.counters[table],
                     json.dumps(self.data[table], default=str), self.counters[table])
                )
            else:
                for key in self.data:
                    cur.execute(
                        "INSERT INTO jsondb_store (key, data, next_id) "
                        "VALUES (%s, %s::jsonb, %s) "
                        "ON CONFLICT (key) DO UPDATE SET data = %s::jsonb, next_id = %s",
                        (key, json.dumps(self.data[key], default=str), self.counters[key],
                         json.dumps(self.data[key], default=str), self.counters[key])
                    )

    def _save(self):
        self._flush()

    def table(self, name):
        return self.data.setdefault(name, [])

    def next_id(self, table):
        nid = self.counters.get(table, 1)
        self.counters[table] = nid + 1
        return nid

    def insert(self, table, record):
        with self.lock:
            rows = self.table(table)
            record['id'] = self.next_id(table)
            rows.append(record)
            self._flush(table)
            return record['id']

    def insert_many(self, table, records):
        with self.lock:
            rows = self.table(table)
            for r in records:
                r['id'] = self.next_id(table)
                rows.append(r)
            self._flush(table)
            return [r['id'] for r in records]

    def find(self, table, **filters):
        rows = self.table(table)
        if not filters:
            return list(rows)
        return [r for r in rows if all(r.get(k) == v for k, v in filters.items())]

    def find_one(self, table, **filters):
        for r in self.table(table):
            if all(r.get(k) == v for k, v in filters.items()):
                return r
        return None

    def get(self, table, id):
        for r in self.table(table):
            if r.get('id') == id:
                return r
        return None

    def update(self, table, id, updates):
        with self.lock:
            for r in self.table(table):
                if r.get('id') == id:
                    r.update(updates)
                    self._flush(table)
                    return True
        return False

    def delete(self, table, id):
        with self.lock:
            rows = self.table(table)
            self.data[table] = [r for r in rows if r.get('id') != id]
            self._flush(table)

    def delete_where(self, table, **filters):
        with self.lock:
            rows = self.table(table)
            self.data[table] = [r for r in rows if not all(r.get(k) == v for k, v in filters.items())]
            self._flush(table)

    def count(self, table, **filters):
        return len(self.find(table, **filters))

    def sum(self, table, field, **filters):
        rows = self.find(table, **filters)
        return sum(r.get(field, 0) for r in rows)

    def query(self, table):
        return Query(self, table)


class Query:
    def __init__(self, db, table):
        self.db = db
        self.table = table
        self._filters = {}
        self._order_by = None
        self._order_desc = False
        self._limit = None

    def filter(self, **kwargs):
        self._filters.update(kwargs)
        return self

    def order_by(self, field, desc=False):
        self._order_by = field
        self._order_desc = desc
        return self

    def limit(self, n):
        self._limit = n
        return self

    def all(self):
        results = self.db.find(self.table, **self._filters)
        if self._order_by:
            results.sort(key=lambda r: r.get(self._order_by, ''), reverse=self._order_desc)
        if self._limit:
            results = results[:self._limit]
        return list(results)

    def first(self):
        results = self.all()
        return results[0] if results else None

    def count(self):
        return len(self.db.find(self.table, **self._filters))
