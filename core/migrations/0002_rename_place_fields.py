from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0001_initial'),  # Update to match your actual initial migration name
    ]

    operations = []  # No database operations required since we're using db_column 