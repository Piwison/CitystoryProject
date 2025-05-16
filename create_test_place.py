import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'citystory_backend.settings')
django.setup()

from core.models import Place, User

def create_test_place():
    try:
        # Get admin user
        user = User.objects.get(username='admin')
        
        # Create a test place
        place = Place.objects.create(
            name='Oasis Coffee Roasting Lab',
            description='A specialty coffee shop in Taipei',
            type='cafe',
            price_range='$$',
            address='No. 23, Lane 223, Section 4, Zhongxiao East Road, Da\'an District, Taipei City',
            user=user,
            slug='oasis-coffee',
            moderation_status='approved',
            district='daan',
            latitude=25.0410,
            longitude=121.5530
        )
        
        print(f"Successfully created place: {place.name} (ID: {place.id})")
        return place
    except Exception as e:
        print(f"Error creating place: {str(e)}")
        return None

if __name__ == '__main__':
    create_test_place() 