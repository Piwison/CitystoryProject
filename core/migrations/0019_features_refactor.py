from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0018_remove_place_user_place_contributor_and_more'),
    ]

    operations = [
        # Step 1: Remove the old M2M field first
        migrations.RemoveField(
            model_name='place',
            name='features',
        ),
        
        # Step 2: Create the PlaceFeature model with all its fields
        migrations.CreateModel(
            name='PlaceFeature',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('feature', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.feature')),
                ('place', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.place')),
            ],
        ),
        
        # Step 3: Set up unique_together constraint
        migrations.AlterUniqueTogether(
            name='placefeature',
            unique_together={('place', 'feature')},
        ),
        
        # Step 4: Create the PlacePhoto model
        migrations.CreateModel(
            name='PlacePhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('image', models.URLField()),
                ('caption', models.CharField(blank=True, max_length=255, null=True)),
                ('isPrimary', models.BooleanField(default=False)),
                ('moderation_status', models.CharField(choices=[('PENDING', 'Pending'), ('APPROVED', 'Approved'), ('REJECTED', 'Rejected')], default='PENDING', max_length=10)),
                ('moderation_comment', models.TextField(blank=True, null=True)),
                ('moderation_date', models.DateTimeField(blank=True, null=True)),
                ('place', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='photos', to='core.place')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='place_photos', to='core.user')),
                ('moderator', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='moderated_photos', to='core.user')),
            ],
            options={
                'abstract': False,
            },
        ),
        
        # Step 5: Add the new relationship field to Place
        migrations.AddField(
            model_name='place',
            name='features',
            field=models.ManyToManyField(through='core.PlaceFeature', to='core.Feature'),
        ),
        
        # Step 6: Delete the old Photo model
        migrations.DeleteModel(
            name='Photo',
        ),
        
        # Step 7: Add indexes
        migrations.AddIndex(
            model_name='placefeature',
            index=models.Index(fields=['place'], name='core_placef_place_i_9a7176_idx'),
        ),
        migrations.AddIndex(
            model_name='placefeature',
            index=models.Index(fields=['feature'], name='core_placef_feature_1e50fc_idx'),
        ),
        migrations.AddIndex(
            model_name='placephoto',
            index=models.Index(fields=['isPrimary'], name='core_placep_isPrima_b5d73a_idx'),
        ),
        migrations.AddIndex(
            model_name='placephoto',
            index=models.Index(fields=['place'], name='core_placep_place_i_82a6b9_idx'),
        ),
        migrations.AddIndex(
            model_name='placephoto',
            index=models.Index(fields=['user'], name='core_placep_user_id_3b23bf_idx'),
        ),
    ]