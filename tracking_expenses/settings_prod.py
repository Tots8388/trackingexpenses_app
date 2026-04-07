import os
import dj_database_url
from .settings import *

DEBUG = False

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '.railway.app').split(',')
CSRF_TRUSTED_ORIGINS = ['https://*.railway.app']

# Database - use Railway's PostgreSQL
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600)
    }

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise for serving static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Add the React build assets directory so WhiteNoise serves /assets/* files
WHITENOISE_ROOT = BASE_DIR / 'frontend' / 'dist'

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', SECRET_KEY)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# CORS - allow the Railway domain
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',')
    if origin.strip()
]
CORS_ALLOW_ALL_ORIGINS = not CORS_ALLOWED_ORIGINS

# Path to the React SPA index.html (used by the catch-all view)
FRONTEND_DIR = BASE_DIR / 'frontend' / 'dist'

# Email - use console for now, switch to real SMTP later
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
