import os
from flask import g
from config import Config

def get_db():
    if 'db' not in g:
        if Config.DATABASE_URL:
            from pgjsondb import PgJsonDB
            g.db = PgJsonDB(Config.DATABASE_URL)
        else:
            from jsondb import JsonDB
            g.db = JsonDB(Config.DATABASE)
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db._save()

def init_db():
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    db = get_db()
    tables = ['users', 'categories', 'documents', 'topics', 'reading_blocks',
              'formulas', 'mcqs', 'notes', 'todos', 'daily_plans', 'progress']
    for t in tables:
        if t not in db.data:
            db.data[t] = []
    db._save()
