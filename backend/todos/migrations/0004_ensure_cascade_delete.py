# Generated migration to ensure CASCADE delete is enforced at database level
from django.db import migrations, connection


def ensure_cascade_delete(apps, schema_editor):
    """
    Ensures CASCADE delete is enforced at database level for PostgreSQL.
    For SQLite, Django handles CASCADE at the application level, so this is a no-op.
    """
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            # Find the foreign key constraint name
            cursor.execute("""
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = 'todos_todocategory'::regclass
                AND contype = 'f'
                AND confrelid = 'accounts_user'::regclass
                LIMIT 1;
            """)
            result = cursor.fetchone()
            
            if result:
                constraint_name = result[0]
                # Drop and recreate with CASCADE
                cursor.execute(f'ALTER TABLE todos_todocategory DROP CONSTRAINT "{constraint_name}";')
                cursor.execute(f'ALTER TABLE todos_todocategory ADD CONSTRAINT "{constraint_name}" FOREIGN KEY (user_id) REFERENCES accounts_user(id) ON DELETE CASCADE;')


def reverse_cascade_delete(apps, schema_editor):
    """
    Reverse operation - just recreate the constraint without explicit CASCADE
    (Django's default behavior will still apply CASCADE at the ORM level)
    """
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT conname
                FROM pg_constraint
                WHERE conrelid = 'todos_todocategory'::regclass
                AND contype = 'f'
                AND confrelid = 'accounts_user'::regclass
                LIMIT 1;
            """)
            result = cursor.fetchone()
            
            if result:
                constraint_name = result[0]
                cursor.execute(f'ALTER TABLE todos_todocategory DROP CONSTRAINT "{constraint_name}";')
                cursor.execute(f'ALTER TABLE todos_todocategory ADD CONSTRAINT "{constraint_name}" FOREIGN KEY (user_id) REFERENCES accounts_user(id);')


class Migration(migrations.Migration):

    dependencies = [
        ('todos', '0003_todocategory_todo_category'),
    ]

    operations = [
        # This migration ensures foreign key constraints have CASCADE at DB level for PostgreSQL
        # For SQLite, Django handles CASCADE at the application level, so this is a no-op
        migrations.RunPython(
            ensure_cascade_delete,
            reverse_cascade_delete,
        ),
    ]

