from django.db import migrations, models
from django.db.models import F, Q

def migrate_price_range_data(apps, schema_editor):
    """
    Migrate price range data from $ symbols to numeric values
    """
    Place = apps.get_model('core', 'Place')
    
    # Map old values to new values
    mapping = {
        '$': '500',       # Budget -> NT$500
        '$$': '1000',     # Moderate -> NT$1000
        '$$$': '1500',    # Expensive -> NT$1500
        '$$$$': '2000',   # Very Expensive -> NT$2000+
    }
    
    # Update each place with the new price range value
    for old_value, new_value in mapping.items():
        Place.objects.filter(price_range=old_value).update(price_range=new_value)

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_rename_text_review_comment_remove_review_rating_and_more'),
    ]

    operations = [
        # Update the price_range field to use the new numeric choices
        migrations.AlterField(
            model_name='place',
            name='price_range',
            field=models.CharField(
                choices=[
                    ('0', 'Free'),
                    ('500', 'NT$500'),
                    ('1000', 'NT$1000'),
                    ('1500', 'NT$1500'),
                    ('2000', 'NT$2000+'),
                ],
                help_text='Price range in NT$ (0=Free, 500=NT$500, 1000=NT$1000, 1500=NT$1500, 2000=NT$2000+)',
                max_length=10
            ),
        ),
        
        # Run the data migration function
        migrations.RunPython(
            migrate_price_range_data,
            # No reverse migration provided since it's not straightforward to map back
            migrations.RunPython.noop
        ),
    ] 