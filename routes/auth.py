from flask import Blueprint, render_template, request, redirect, url_for
from flask_login import login_user, logout_user, login_required, current_user, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db

class User(UserMixin):
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email

bp = Blueprint('auth', __name__, url_prefix='/auth')

@bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        confirm = request.form.get('confirm_password', '')

        errors = []
        if not username or len(username) < 3:
            errors.append("Username must be at least 3 characters")
        if not email or '@' not in email:
            errors.append("Enter a valid email address")
        if len(password) < 6:
            errors.append("Password must be at least 6 characters")
        if password != confirm:
            errors.append("Passwords do not match")

        db = get_db()
        if db.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone():
            errors.append("Username already taken")
        if db.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone():
            errors.append("Email already registered")

        if errors:
            return render_template('auth/register.html', errors=errors, username=username, email=email)

        db.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            (username, email, generate_password_hash(password))
        )
        db.commit()
        user = db.execute('SELECT id, username, email FROM users WHERE username = ?', (username,)).fetchone()
        login_user(User(user['id'], user['username'], user['email']))
        return redirect(url_for('dashboard.index'))

    return render_template('auth/register.html')

@bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        if not user or not check_password_hash(user['password_hash'], password):
            return render_template('auth/login.html', error="Invalid username or password", username=username)
        login_user(User(user['id'], user['username'], user['email']))
        return redirect(url_for('dashboard.index'))

    return render_template('auth/login.html')

@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))
