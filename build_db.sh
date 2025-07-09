cd backend
if [[ "$OSTYPE" == "darwin"* ]]; then
    rm -f db.sqlite3
else
    rm -f db.sqlite3 2>/dev/null || del /f db.sqlite3 2>NUL
fi
python manage.py makemigrations
python manage.py migrate