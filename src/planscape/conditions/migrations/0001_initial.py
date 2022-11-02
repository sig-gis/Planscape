# Generated by Django 4.1.1 on 2022-11-02 20:29

import django.contrib.gis.db.models.fields
from django.db import migrations, models
import django.db.models.deletion
from typing import Tuple

class Migration(migrations.Migration):

    initial = True

    dependencies:list[Tuple[str, str]] = []

    operations = [
        migrations.CreateModel(
            name='AbstractCondition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('condition_name', models.CharField(max_length=120)),
                ('display_name', models.CharField(max_length=120, null=True)),
                ('region_name', models.CharField(max_length=120, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Condition',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('geometry', django.contrib.gis.db.models.fields.RasterField(srid=4326)),
                ('condition', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='conditions.abstractcondition')),
            ],
        ),
    ]
