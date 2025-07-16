#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import dotenv
dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '../.hc_to_app_env'))

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.processor.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    if sys.argv[1] == 'runserver':
        backend_server_port = os.getenv("BACKEND_SERVER_PORT", "8000")
        backend_server_domain = os.getenv("BACKEND_SERVER_DOMAIN", "localhost")
        if not backend_server_domain or not backend_server_port:
            print("❌ ERROR: BACKEND_SERVER_DOMAIN or BACKEND_SERVER_PORT is not set")
            sys.exit(1)
        execute_from_command_line(["manage.py", "runserver", "--noreload", f"{backend_server_domain}:{backend_server_port}"])
    else:
        execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
