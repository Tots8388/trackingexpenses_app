#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting gunicorn..."
exec gunicorn tracking_expenses.wsgi --bind 0.0.0.0:$PORT
