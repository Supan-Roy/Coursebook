# Generated migration for trash bin feature

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('materials', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='material',
            name='is_deleted',
            field=models.BooleanField(default=False, db_index=True),
        ),
        migrations.AddField(
            model_name='material',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name='material',
            index=models.Index(fields=['user', 'is_deleted'], name='materials_m_user_id_is_del_idx'),
        ),
        migrations.AddIndex(
            model_name='material',
            index=models.Index(fields=['deleted_at'], name='materials_m_deleted_idx'),
        ),
    ]
