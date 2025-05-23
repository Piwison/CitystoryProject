from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Place, Review, PlacePhoto, Feature, Notification, HelpfulVote, SavedPlace
from .models import Badge, UserBadge, UserPoints, UserLevel
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.validators import URLValidator
from .choices import PLACE_TYPE_CHOICES
from django.contrib.contenttypes.models import ContentType
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user model."""
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    authType = serializers.CharField(source='auth_type')
    
    class Meta:
        model = User
        fields = ['id', 'email', 'firstName', 'lastName', 'authType']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['firstName'] = user.first_name
        token['lastName'] = user.last_name
        token['isStaff'] = user.is_staff
        token['authType'] = user.auth_type

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user info to the response
        data['user'] = UserSerializer(self.user).data
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    passwordConfirm = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'}, source='password_confirm')
    authType = serializers.CharField(required=False, default='local', source='auth_type')
    googleId = serializers.CharField(required=False, allow_blank=True, source='google_id')
    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)

    class Meta:
        model = User
        fields = ('email', 'password', 'passwordConfirm', 'firstName', 'lastName', 'authType', 'googleId')

    def validate(self, attrs):
        is_social_account = self.context.get('is_social_account', False)
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        auth_type = attrs.get('auth_type', 'local')
        
        try:
            if auth_type == 'local' and not is_social_account:
                # Regular registration: require password and confirm
                if not password or not password_confirm:
                    raise serializers.ValidationError({"password": "Password and confirmation are required."})
                if password != password_confirm:
                    raise serializers.ValidationError({"password": "Password fields didn't match."})
                try:
                    validate_password(password)
                except ValidationError as e:
                    raise serializers.ValidationError({"password": list(e.messages)})
            # For SSO, skip password validation
            return attrs
        except Exception as e:
            logger.exception("Validation failed in UserRegistrationSerializer")
            raise

    def create(self, validated_data):
        is_social_account = self.context.get('is_social_account', False)
        auth_type = validated_data.get('auth_type', 'local')
        password_confirm = validated_data.pop('password_confirm', None)
        password = validated_data.get('password')
        google_id = validated_data.pop('google_id', None)
        
        try:
            email = validated_data.get('email')
            if email:
                existing_user = User.objects.filter(email=email).first()
                if existing_user:
                    # User already exists, update any social information if needed
                    if auth_type == 'google' and google_id and not existing_user.google_id:
                        existing_user.google_id = google_id
                        existing_user.auth_type = 'google'
                        existing_user.save(update_fields=['google_id', 'auth_type'])
                        logger.info(f"Updated existing user {existing_user.id} with Google ID {google_id}")
                    return existing_user
                    
            # If social account or password is missing, generate a random password
            if is_social_account or auth_type != 'local' or not password:
                password = User.objects.make_random_password()
                validated_data['password'] = password
                
            # Generate a unique username from email if not provided
            if 'username' not in validated_data:
                base_username = email.split('@')[0] if email else User.objects.make_random_password(8)
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                validated_data['username'] = username
                
            # Create and return the user
            user = User.objects.create_user(**validated_data)
            
            # Set google_id if provided
            if google_id:
                user.google_id = google_id
                user.save(update_fields=['google_id'])
                
            return user
        except Exception as e:
            logger.exception("User creation failed in UserRegistrationSerializer")
            raise serializers.ValidationError({"detail": str(e)})

class FeatureSerializer(serializers.ModelSerializer):
    """Serializer for features."""
    typeDisplay = serializers.CharField(source='get_type_display', read_only=True)
    featureType = serializers.CharField(source='feature_type')
    
    class Meta:
        model = Feature
        fields = [
            'id', 'name', 'featureType', 'typeDisplay', 'icon'
        ]
        
    def validate_name(self, value):
        """Validate that the name is not empty and properly formatted"""
        if not value.strip():
            raise serializers.ValidationError("Feature name cannot be empty")
        return value.strip().title()  # Convert to title case
        
    def create(self, validated_data):
        # Extract the feature_type value from the nested dictionary
        feature_type = validated_data.pop('feature_type', None)
        if feature_type:
            # Create feature with the correct field name
            return Feature.objects.create(feature_type=feature_type, **validated_data)
        return Feature.objects.create(**validated_data)
        
    def update(self, instance, validated_data):
        # Extract the feature_type value from the nested dictionary
        feature_type = validated_data.pop('feature_type', None)
        if feature_type:
            instance.feature_type = feature_type
            
        # Update the remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance

class PlaceSerializer(serializers.ModelSerializer):
    """Serializer for places."""
    contributor = UserSerializer(source='created_by', read_only=True)
    features = FeatureSerializer(many=True, read_only=True)
    featureIds = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Feature.objects.all(),
        write_only=True,
        required=False,
        source='features'
    )
    totalReviews = serializers.SerializerMethodField(source='get_total_reviews')
    averageRating = serializers.SerializerMethodField(source='get_average_rating')
    isContributor = serializers.SerializerMethodField(source='get_is_contributor')
    statusDisplay = serializers.SerializerMethodField(source='get_status_display')
    placeTypeDisplay = serializers.CharField(source='place_type', read_only=True)
    
    # Map snake_case model fields to camelCase API fields
    googleMapsLink = serializers.URLField(source='google_maps_link', required=False, allow_null=True)
    priceLevel = serializers.IntegerField(source='price_level', required=False, allow_null=True)
    placeType = serializers.CharField(source='place_type')
    createdBy = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='created_by',
        write_only=True
    )
    
    class Meta:
        model = Place
        fields = [
            'id', 'name', 'description', 'placeType', 'placeTypeDisplay', 'priceLevel',
            'address', 'district', 'slug', 'website', 'phone',
            'latitude', 'longitude', 'contributor', 'features',
            'featureIds', 'averageRating', 'totalReviews',
            'created_at', 'updated_at', 'moderation_status',
            'isContributor', 'statusDisplay', 'googleMapsLink',
            'createdBy'
        ]
        read_only_fields = [
            'contributor', 'averageRating', 'totalReviews',
            'created_at', 'updated_at', 'moderation_status', 'slug',
            'isContributor', 'statusDisplay', 'placeTypeDisplay'
        ]

    def get_totalReviews(self, obj):
        """Get the total number of approved reviews"""
        return obj.get_review_count()

    def get_averageRating(self, obj):
        """Get the average rating across all reviews"""
        # Just use avg_rating, the field was renamed
        return obj.avg_rating if hasattr(obj, 'avg_rating') else None
        
    def get_isContributor(self, obj):
        """Determine if the current user is the creator of this place"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.created_by == request.user
        return False
        
    def get_statusDisplay(self, obj):
        """Get a user-friendly status display"""
        status_map = {
            'PENDING': 'Pending Approval',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        }
        return status_map.get(obj.moderation_status, obj.moderation_status)

    def validate_featureIds(self, value):
        """
        Validate that all features are applicable to the place type.
        """
        place_type = self.initial_data.get('place_type')
        if not place_type:
            place_type = self.instance.place_type if self.instance else None
            
        # Since Feature.is_applicable_to_place_type() now always returns True,
        # we don't need to filter for invalid features anymore.
        # This is left as a placeholder in case we need to reimpose restrictions later
        return value

    def create(self, validated_data):
        featureIds = validated_data.pop('features', [])
        place = Place.objects.create(**validated_data)
        place.features.set(featureIds)
        return place

    def update(self, instance, validated_data):
        featureIds = validated_data.pop('features', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if featureIds is not None:
            instance.features.set(featureIds)
        return instance 

class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews."""
    user = UserSerializer(read_only=True)
    # place = PlaceSerializer(read_only=True) # Keep commented to avoid circularity if ReviewSerializer is used in PlaceSerializer
    isOwner = serializers.SerializerMethodField()
    statusDisplay = serializers.SerializerMethodField()
    
    # Expose camelCase to API but map to snake_case model fields
    # Make all rating fields not strictly required at field level; validation logic will handle it.
    foodQuality = serializers.FloatField(source='food_quality', required=False, allow_null=True)
    service = serializers.FloatField(required=False, allow_null=True)
    value = serializers.FloatField(required=False, allow_null=True)
    cleanliness = serializers.FloatField(required=False, allow_null=True)
    overallRating = serializers.FloatField(source='overall_rating', required=False, allow_null=True) # Changed here
    helpfulCount = serializers.IntegerField(source='helpful_count', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'place', 'comment',
            'foodQuality', 'service', 'value', 'cleanliness',
            'overallRating', 'created_at', 'updated_at', 'moderation_status',
            'helpfulCount', 'isOwner', 'statusDisplay'
        ]
        read_only_fields = [
            'user', 'place', 'created_at', 'updated_at',
            'moderation_status', 'helpfulCount', 'isOwner', 'statusDisplay'
        ]
    
    def get_isOwner(self, obj):
        """Determine if the current user is the owner of this review"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.user == request.user
        return False
        
    def get_statusDisplay(self, obj):
        """Get a user-friendly status display"""
        status_map = {
            'PENDING': 'Pending Approval',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        }
        return status_map.get(obj.moderation_status, obj.moderation_status)

    def validate(self, data): # `data` here is after to_internal_value has run for each field.
        place_pk = self.context['view'].kwargs.get('place_pk')
        try:
            place = Place.objects.get(pk=place_pk)
        except Place.DoesNotExist:
            raise serializers.ValidationError("Associated place not found.")
        place_type = place.place_type

        validation_errors = {} # Accumulate errors

        all_potential_rating_fields = {
            'overallRating': 'Overall rating',
            'foodQuality': 'Food quality',
            'service': 'Service',
            'value': 'Value',
            'cleanliness': 'Cleanliness'
        }
        place_type_requirements = {
            'restaurant': ['overallRating', 'foodQuality', 'service', 'value'],
            'hotel': ['overallRating', 'cleanliness', 'service', 'value'],
            'cafe': ['overallRating', 'foodQuality', 'service'],
            'bar': ['overallRating', 'service', 'value'],
            'attraction': ['overallRating']
        }
        required_field_keys_for_this_type = place_type_requirements.get(place_type, ['overallRating'])

        for field_api_name in all_potential_rating_fields.keys():
            display_name = all_potential_rating_fields[field_api_name]
            is_field_required_for_this_type = field_api_name in required_field_keys_for_this_type
            was_field_provided_in_input = field_api_name in self.initial_data
            provided_value_initial = self.initial_data.get(field_api_name)
            processed_value_in_data = data.get(field_api_name)

            current_field_errors = []

            if not self.partial:  # POST request
                if is_field_required_for_this_type and provided_value_initial is None:
                    current_field_errors.append(f"{display_name} is required for {place_type} reviews.")
            else:  # PATCH request
                if was_field_provided_in_input and is_field_required_for_this_type and provided_value_initial is None:
                    current_field_errors.append(f"{display_name} cannot be set to null for {place_type} reviews if it's a required field.")
            
            if was_field_provided_in_input and processed_value_in_data is not None:
                if not (1 <= processed_value_in_data <= 5):
                    current_field_errors.append(f"{display_name} must be between 1 and 5.")
            
            if current_field_errors:
                validation_errors[field_api_name] = current_field_errors

        if validation_errors:
            raise serializers.ValidationError(validation_errors)
        
        return data

    def create(self, validated_data):
        """Create a new review and update place ratings"""
        # Calculate overall_rating if not provided
        if 'overall_rating' not in validated_data:
            # Average of provided ratings, excluding None values
            rating_fields = ['food_quality', 'service', 'value', 'cleanliness']
            ratings = [validated_data[field] for field in rating_fields if field in validated_data and validated_data[field] is not None]
            
            if ratings:
                validated_data['overall_rating'] = sum(ratings) / len(ratings)
            else:
                # Default if no ratings provided
                validated_data['overall_rating'] = 3.0
        
        review = super().create(validated_data)
        
        # Update place ratings
        if hasattr(review.place, 'update_average_ratings'):
            review.place.update_average_ratings()
        
        return review

    def update(self, instance, validated_data):
        """Update an existing review and recalculate place ratings"""
        # Recalculate overall_rating if any component rating changed
        rating_changed = False
        for field in ['food_quality', 'service', 'value', 'cleanliness']:
            if field in validated_data and validated_data[field] != getattr(instance, field):
                rating_changed = True
                break
        
        if rating_changed:
            # Average of all provided and existing ratings
            rating_fields = ['food_quality', 'service', 'value', 'cleanliness']
            ratings = []
            for field in rating_fields:
                value = validated_data.get(field, getattr(instance, field))
                if value is not None:
                    ratings.append(value)
            
            if ratings:
                validated_data['overall_rating'] = sum(ratings) / len(ratings)
        
        review = super().update(instance, validated_data)
        
        # Update place ratings
        if hasattr(review.place, 'update_average_ratings'):
            review.place.update_average_ratings()
        
        return review

class PhotoSerializer(serializers.ModelSerializer):
    """Serializer for photos."""
    user = UserSerializer(read_only=True)
    place = PlaceSerializer(read_only=True)
    isOwner = serializers.SerializerMethodField()
    statusDisplay = serializers.SerializerMethodField()
    
    # Map snake_case model fields to camelCase API fields
    isPrimary = serializers.BooleanField(source='is_primary', required=False)
    isApproved = serializers.BooleanField(source='is_approved', required=False, read_only=True)
    uploadedAt = serializers.DateTimeField(source='uploaded_at', read_only=True)
    
    class Meta:
        model = PlacePhoto
        fields = [
            'id', 'user', 'place', 'url',
            'caption', 'isPrimary', 'isApproved', 'uploadedAt',
            'created_at', 'updated_at', 'moderation_status',
            'isOwner', 'statusDisplay'
        ]
        read_only_fields = [
            'user', 'place', 'created_at', 
            'updated_at', 'moderation_status', 'isOwner',
            'statusDisplay', 'uploadedAt', 'isApproved'
        ]
    
    def get_isOwner(self, obj):
        """Determine if the current user is the uploader of this photo"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.user == request.user
        return False
        
    def get_statusDisplay(self, obj):
        """Get a user-friendly status display"""
        status_map = {
            'PENDING': 'Pending Approval',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        }
        return status_map.get(obj.moderation_status, obj.moderation_status)

    # No order field to validate in PlacePhoto

    def validate(self, data):
        """
        Additional validation:
        - Ensure URL is provided on creation
        """
        if not self.instance and not data.get('url'):
            raise serializers.ValidationError({
                'url': 'An image URL is required'
            })
        return data

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    notificationType = serializers.CharField(source='notification_type')
    isRead = serializers.BooleanField(source='is_read')

    # Fields for GenericForeignKey
    contentType = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.all(),
        source='content_type' 
    )
    objectId = serializers.CharField(source='object_id') 
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notificationType', 'title',
            'message', 'isRead', 
            'contentType', 
            'objectId',  
            'created_at'
        ]
        read_only_fields = [
            'user', 'notificationType', 'title',
            'message', 
            'created_at'
        ]

class ModerationStatusSerializer(serializers.Serializer):
    """Serializer for handling moderation status updates."""
    status = serializers.ChoiceField(choices=['pending', 'approved', 'rejected'])
    comment = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate moderation status transitions."""
        if data.get('status') == 'rejected' and not data.get('comment'):
            raise serializers.ValidationError({
                'comment': 'A comment is required when rejecting content.'
            })
        return data 

class SavedPlaceSerializer(serializers.ModelSerializer):
    """Serializer for saved/bookmarked places."""
    placeDetails = serializers.SerializerMethodField()
    userEmail = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = SavedPlace
        fields = [
            'id', 'user', 'place', 'placeDetails', 'notes',
            'created_at', 'updated_at', 'userEmail'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
        extra_kwargs = {
            'place': {'required': False}  # Make place optional for update operations
        }
    
    def get_placeDetails(self, obj):
        """Get the place details."""
        return PlaceSerializer(obj.place).data
        
    def validate(self, data):
        """Validate that the user can save this place."""
        # Skip validation if this is an update operation (PATCH/PUT)
        request = self.context.get('request')
        if request and request.method in ['PATCH', 'PUT']:
            return data
            
        # Check if place is provided for create operations
        place = data.get('place')
        user = self.context['request'].user
        
        if not place:
            raise serializers.ValidationError({'place': 'Place is required'})
            
        if place.moderation_status != 'approved' and place.created_by != user:
            raise serializers.ValidationError(
                {'place': 'You can only save approved places or places you own'}
            )
            
        return data
        
    def create(self, validated_data):
        """Create a new saved place, handling the unique constraint."""
        user = self.context['request'].user
        place = validated_data.get('place')
        notes = validated_data.get('notes', '')
        
        # Check if already saved
        existing = SavedPlace.objects.filter(user=user, place=place).first()
        if existing:
            # Update notes if provided
            if notes:
                existing.notes = notes
                existing.save(update_fields=['notes', 'updated_at'])
            return existing
            
        # Create new saved place
        saved_place = SavedPlace.objects.create(
            user=user,
            place=place,
            notes=notes
        )
        return saved_place 

class BadgeSerializer(serializers.ModelSerializer):
    """Serializer for badges."""
    levelDisplay = serializers.CharField(source='get_level_display', read_only=True)
    typeDisplay = serializers.CharField(source='get_category_display', read_only=True)
    maxLevel = serializers.IntegerField(source='max_level')
    type = serializers.CharField(source='category')
    
    class Meta:
        model = Badge
        fields = [
            'id', 'name', 'description', 'type', 'typeDisplay',
            'maxLevel', 'levelDisplay', 'icon', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class UserBadgeSerializer(serializers.ModelSerializer):
    """Serializer for user badges."""
    badgeDetails = BadgeSerializer(source='badge', read_only=True)
    earnedAt = serializers.DateTimeField(source='earned_at', read_only=True)
    
    class Meta:
        model = UserBadge
        fields = [
            'id', 'user', 'badge', 'badgeDetails',
            'earnedAt', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'earnedAt', 'created_at', 'updated_at']

class UserPointsSerializer(serializers.ModelSerializer):
    """Serializer for user points."""
    sourceTypeDisplay = serializers.CharField(source='get_source_type_display', read_only=True)
    sourceType = serializers.CharField(source='source_type')
    sourceId = serializers.IntegerField(source='source_id')
    
    class Meta:
        model = UserPoints
        fields = [
            'id', 'user', 'points', 'sourceType', 'sourceTypeDisplay',
            'sourceId', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

class UserLevelSerializer(serializers.ModelSerializer):
    """Serializer for user levels."""
    title = serializers.SerializerMethodField()
    totalPoints = serializers.SerializerMethodField()
    nextLevelThreshold = serializers.SerializerMethodField()
    progressPercentage = serializers.SerializerMethodField()
    
    class Meta:
        model = UserLevel
        fields = [
            'id', 'user', 'level', 'title', 'totalPoints',
            'nextLevelThreshold', 'progressPercentage', 'updated_at'
        ]
        read_only_fields = ['user', 'level', 'updated_at']
    
    def get_title(self, obj):
        return obj.get_level_title()
    
    def get_totalPoints(self, obj):
        return UserPoints.get_total_points(obj.user)
    
    def get_nextLevelThreshold(self, obj):
        return obj.get_next_level_threshold()
    
    def get_progressPercentage(self, obj):
        return obj.get_progress_to_next_level()

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with badges and points."""
    badges = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    totalPoints = serializers.SerializerMethodField()
    badgeCount = serializers.SerializerMethodField()
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    authType = serializers.CharField(source='auth_type', read_only=True)
    isVerified = serializers.BooleanField(source='is_verified', read_only=True)
    guideLevel = serializers.IntegerField(source='guide_level', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'firstName', 'lastName', 
            'authType', 'badges', 'level', 'totalPoints',
            'badgeCount', 'isVerified', 'guideLevel'
        ]
        read_only_fields = ['email', 'authType', 'isVerified', 'guideLevel']
    
    def get_badges(self, obj):
        # Get top 5 badges by level (highest first)
        user_badges = UserBadge.objects.filter(user=obj).select_related('badge').order_by('-badge__max_level')[:5]
        return UserBadgeSerializer(user_badges, many=True).data
    
    def get_level(self, obj):
        try:
            user_level = UserLevel.objects.get(user=obj)
            return UserLevelSerializer(user_level).data
        except UserLevel.DoesNotExist:
            return None
    
    def get_totalPoints(self, obj):
        return UserPoints.get_total_points(obj)
        
    def get_badgeCount(self, obj):
        return UserBadge.objects.filter(user=obj).count() 