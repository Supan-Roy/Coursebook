# Generated migration to ensure CASCADE delete is enforced at database level
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('todos', '0003_todocategory_todo_category'),
    ]

    operations = [
        # This migration ensures foreign key constraints have CASCADE at DB level
        # Finds and recreates the constraint with CASCADE
        migrations.RunSQL(
            # PostgreSQL: Find constraint name and recreate with CASCADE
            sql="""
            DO $$
            DECLARE
                constraint_name TEXT;
            BEGIN
                -- Find the foreign key constraint name
                SELECT conname INTO constraint_name
                FROM pg_constraint
                WHERE conrelid = 'todos_todocategory'::regclass
                AND contype = 'f'
                AND confrelid = 'accounts_user'::regclass
                LIMIT 1;
                
                -- Drop and recreate with CASCADE if found
                IF constraint_name IS NOT NULL THEN
                    EXECUTE format('ALTER TABLE todos_todocategory DROP CONSTRAINT %I', constraint_name);
                    EXECUTE format('ALTER TABLE todos_todocategory ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES accounts_user(id) ON DELETE CASCADE', constraint_name);
                END IF;
            END $$;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]

