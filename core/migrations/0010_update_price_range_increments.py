from django.db import migrations, models
import django.db.models.deletion

def update_price_range_data(apps, schema_editor):
    """
    Update existing price range data to match the new price range format
    """
    Place = apps.get_model('core', 'Place')
    
    # Map old values to new values
    mapping = {
        '0': '0',           # Free -> Free
        '500': '200',       # NT$500 -> NT$1-200 (adjust as needed)
        '1000': '800',      # NT$1000 -> NT$600-800
        '1500': '1500',     # NT$1500 -> NT$1000-1500
        '2000': '2000+',    # NT$2000+ -> NT$2000+
    }
    
    # Update each place with the new price range value
    for old_value, new_value in mapping.items():
        Place.objects.filter(price_range=old_value).update(price_range=new_value)


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_merge_0005_savedplace_0005_update_price_range_field'),  # Updated to the correct parent migration
    ]

    operations = [
        # First, update the help_text
        migrations.AlterField(
            model_name='place',
            name='price_range',
            field=models.CharField(
                choices=[
                    ('0', 'Free'),
                    ('200', 'NT$1-200'),
                    ('400', 'NT$200-400'),
                    ('600', 'NT$400-600'),
                    ('800', 'NT$600-800'),
                    ('1000', 'NT$800-1000'),
                    ('1500', 'NT$1000-1500'),
                    ('2000', 'NT$1500-2000'),
                    ('2000+', 'NT$2000+'),
                ],
                help_text='Price range in NT$ (0=Free, 200=NT$1-200, 400=NT$200-400, 600=NT$400-600, 800=NT$600-800, 1000=NT$800-1000, 1500=NT$1000-1500, 2000=NT$1500-2000, 2000+=NT$2000+)',
                max_length=10
            ),
        ),
        
        # Then, run the data migration function
        migrations.RunPython(
            update_price_range_data,
            # No reverse migration provided - one-way migration
            migrations.RunPython.noop
        ),
    ] 