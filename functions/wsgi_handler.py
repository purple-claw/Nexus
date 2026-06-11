import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ['FLASK_ENV'] = 'production'

from serverless_wsgi import handle_request
from main import app as application


def handler(event, context):
    return handle_request(application, event, context)
