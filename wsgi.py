import os
os.environ['FLASK_ENV'] = 'production'

from main import app as application

if __name__ == '__main__':
    application.run()
