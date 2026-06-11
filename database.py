import sqlite3
import os
from flask import g
from config import Config

def get_db():
    if 'db' not in g:
        os.makedirs(os.path.dirname(Config.DATABASE), exist_ok=True)
        g.db = sqlite3.connect(Config.DATABASE, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
        g.db.execute("PRAGMA busy_timeout = 5000")
        g.db.execute("PRAGMA journal_mode = WAL")
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    db = get_db()
    try:
        db.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            parent_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            document_id INTEGER,
            category_id INTEGER,
            title TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE SET NULL,
            FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
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
            user_id INTEGER NOT NULL,
            plan_date TEXT NOT NULL,
            topic_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (topic_id) REFERENCES topics (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mcq_id INTEGER,
            attempts INTEGER DEFAULT 0,
            correct_count INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (mcq_id) REFERENCES mcqs (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
        CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_root_name
            ON categories(user_id, name) WHERE parent_id IS NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_child_name
            ON categories(user_id, parent_id, name) WHERE parent_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_topics_user ON topics(user_id);
        CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category_id);
        CREATE INDEX IF NOT EXISTS idx_topics_document ON topics(document_id);
        CREATE INDEX IF NOT EXISTS idx_reading_topic_order ON reading_blocks(topic_id, order_idx);
        CREATE INDEX IF NOT EXISTS idx_formulas_topic_order ON formulas(topic_id, order_idx);
        CREATE INDEX IF NOT EXISTS idx_notes_topic_order ON notes(topic_id, order_idx);
        CREATE INDEX IF NOT EXISTS idx_mcqs_topic_order ON mcqs(topic_id, order_idx);
        CREATE INDEX IF NOT EXISTS idx_todos_topic_order ON todos(topic_id, order_idx);
        CREATE INDEX IF NOT EXISTS idx_todos_completed_topic ON todos(is_completed, topic_id);
        CREATE INDEX IF NOT EXISTS idx_daily_plans_user_date ON daily_plans(user_id, plan_date);
        CREATE INDEX IF NOT EXISTS idx_daily_plans_topic ON daily_plans(topic_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_plans_unique_day_topic ON daily_plans(user_id, plan_date, topic_id);
        CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(user_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_progress_user_mcq ON progress(user_id, mcq_id);
        ''')
        db.commit()
    except sqlite3.Error as e:
        db.rollback()
        raise RuntimeError(f"Database initialization failed: {e}")
