# Generated by Django 4.1.3 on 2023-03-02 00:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('conditions', '0004_get_condition_pixels'),
        ('plan', '0017_remove_project_priorities'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='priorities_new',
        ),
        migrations.AddField(
            model_name='project',
            name='priorities',
            field=models.ManyToManyField(through='plan.ConfigPriority', to='conditions.condition'),
        ),
    ]