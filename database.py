import sqlite3
import os
from flask import g
from config import Config

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(Config.DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    db = get_db()
    db.executescript('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            parent_id INTEGER,
            FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id INTEGER,
            category_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS reading_blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER,
            title TEXT,
            content TEXT NOT NULL,
            order_idx INTEGER,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS formulas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER,
            title TEXT,
            content TEXT NOT NULL,
            order_idx INTEGER,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS mcqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            answer TEXT NOT NULL,
            explanation TEXT,
            difficulty TEXT DEFAULT 'medium',
            order_idx INTEGER,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER,
            content TEXT NOT NULL,
            order_idx INTEGER,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER,
            content TEXT NOT NULL,
            is_completed INTEGER DEFAULT 0,
            order_idx INTEGER,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS daily_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            plan_date TEXT NOT NULL,
            topic_id INTEGER,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mcq_id INTEGER UNIQUE,
            attempts INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            FOREIGN KEY (mcq_id) REFERENCES mcqs (id) ON DELETE CASCADE
        );
        
        -- OPTIMIZATION: Add indexes for fast library and todo queries
        CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category_id);
        CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(is_completed);
        CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(plan_date);
    ''')
    db.commit()
