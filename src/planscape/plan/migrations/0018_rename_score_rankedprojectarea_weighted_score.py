# Generated by Django 4.1.3 on 2023-03-01 23:05

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('plan', '0017_remove_projectarea_scenario_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='rankedprojectarea',
            old_name='score',
            new_name='weighted_score',
        ),
    ]
