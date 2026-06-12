import json
import os
import tempfile
import threading
from datetime import datetime


class JsonDB:
    def __init__(self, path):
        self.path = path
        self.lock = threading.RLock()
        self.data = {}
        self.counters = {}
        self._load()

    def _load(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        if os.path.exists(self.path):
            with open(self.path, 'r') as f:
                self.data = json.load(f)
        else:
            self.data = {}
            self._save()
        self._reindex()

    def _reindex(self):
        for table, rows in self.data.items():
            max_id = max((r.get('id', 0) for r in rows), default=0)
            self.counters[table] = max_id + 1

    def _save(self):
        with self.lock:
            fd, tmp = tempfile.mkstemp(dir=os.path.dirname(self.path))
            try:
                with os.fdopen(fd, 'w') as f:
                    json.dump(self.data, f, indent=2, default=str)
                os.replace(tmp, self.path)
            except:
                os.unlink(tmp)
                raise

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
            self._save()
            return record['id']

    def insert_many(self, table, records):
        with self.lock:
            rows = self.table(table)
            for r in records:
                r['id'] = self.next_id(table)
                rows.append(r)
            self._save()
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
                    self._save()
                    return True
        return False

    def delete(self, table, id):
        with self.lock:
            rows = self.table(table)
            self.data[table] = [r for r in rows if r.get('id') != id]
            self._save()

    def delete_where(self, table, **filters):
        with self.lock:
            rows = self.table(table)
            self.data[table] = [r for r in rows if not all(r.get(k) == v for k, v in filters.items())]
            self._save()

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
