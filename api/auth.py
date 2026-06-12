from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user, UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from database import get_db

bp = Blueprint('api_auth', __name__)

class ApiUser(UserMixin):
    def __init__(self, id, username, email):
        self.id = id
        self.username = username
        self.email = email

@bp.route('/auth/me')
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({
            "user": {
                "id": current_user.id,
                "username": current_user.username,
                "email": current_user.email,
            }
        })
    return jsonify({"user": None})

@bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json(force=True)
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    errors = []
    if not username or len(username) < 3:
        errors.append("Username must be at least 3 characters")
    if not email or '@' not in email:
        errors.append("Enter a valid email address")
    if len(password) < 6:
        errors.append("Password must be at least 6 characters")

    db = get_db()
    if not errors and db.find_one('users', username=username):
        errors.append("Username already taken")
    if not errors and db.find_one('users', email=email):
        errors.append("Email already registered")

    if errors:
        return jsonify({"error": errors[0]}), 400

    user_id = db.insert('users', {
        'username': username,
        'email': email,
        'password_hash': generate_password_hash(password),
    })
    user = db.get('users', user_id)
    login_user(ApiUser(user['id'], user['username'], user['email']))
    return jsonify({
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
        }
    })

@bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(force=True)
    username = data.get('username', '').strip()
    password = data.get('password', '')

    db = get_db()
    user = db.find_one('users', username=username)
    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({"error": "Invalid username or password"}), 401

    login_user(ApiUser(user['id'], user['username'], user['email']))
    return jsonify({
        "user": {
            "id": user['id'],
            "username": user['username'],
            "email": user['email'],
        }
    })

@bp.route('/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True})
