from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.db import models
from .models import User, Place, Review, Photo, Feature, Notification, HelpfulVote

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name'),
        }),
    )

class ModeratedModelAdmin(admin.ModelAdmin):
    """Base admin class for models with moderation"""
    list_filter = ['moderation_status', 'created_at']
    readonly_fields = ['moderation_date', 'moderator']
    actions = ['approve_items', 'reject_items']
    
    def get_list_display(self, request):
        """Add moderation status and actions to list display"""
        return ('moderation_status_display', 'moderation_date', 'moderator') + self.list_display
    
    def moderation_status_display(self, obj):
        """Colorized moderation status"""
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.moderation_status, 'black'),
            obj.get_moderation_status_display()
        )
    moderation_status_display.short_description = 'Status'
    
    def approve_items(self, request, queryset):
        """Bulk approve selected items"""
        for obj in queryset:
            obj.update_moderation_status('approved', moderator=request.user)
        self.message_user(request, f'{len(queryset)} items were successfully approved.')
    approve_items.short_description = 'Approve selected items'
    
    def reject_items(self, request, queryset):
        """Bulk reject selected items"""
        for obj in queryset:
            obj.update_moderation_status('rejected', moderator=request.user)
        self.message_user(request, f'{len(queryset)} items were successfully rejected.')
    reject_items.short_description = 'Reject selected items'
    
    def save_model(self, request, obj, form, change):
        """Track moderator on save"""
        if 'moderation_status' in form.changed_data:
            obj.moderator = request.user
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Show pending items first"""
        qs = super().get_queryset(request)
        return qs.order_by(
            models.Case(
                models.When(moderation_status='pending', then=0),
                models.When(moderation_status='rejected', then=1),
                default=2,
                output_field=models.IntegerField(),
            ),
            '-created_at'
        )

@admin.register(Place)
class PlaceAdmin(ModeratedModelAdmin):
    list_display = ('name', 'type', 'price_range', 'user', 'moderation_status', 'created_at')
    list_filter = ('type', 'price_range', 'moderation_status')
    search_fields = ('name', 'description', 'address')
    readonly_fields = ('created_at', 'updated_at')
    filter_horizontal = ('features',)
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'type', 'user')
        }),
        ('Location & Contact', {
            'fields': ('address', 'latitude', 'longitude', 'website', 'phone')
        }),
        ('Business Details', {
            'fields': ('price_range', 'features')
        }),
        ('Moderation', {
            'fields': ('moderation_status', 'moderation_comment', 'moderation_date', 'moderator')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.user = request.user
        super().save_model(request, obj, form, change)

@admin.register(Review)
class ReviewAdmin(ModeratedModelAdmin):
    list_display = ('place', 'user', 'overall_rating', 'helpful_count', 'moderation_status', 'created_at')
    list_filter = ('overall_rating', 'moderation_status')
    search_fields = ('place__name', 'user__username', 'comment')
    readonly_fields = ('created_at', 'updated_at', 'helpful_count')
    
    fieldsets = (
        (None, {
            'fields': ('place', 'user', 'comment')
        }),
        ('Ratings', {
            'fields': ('overall_rating', 'food_rating', 'service_rating', 'value_rating', 'cleanliness_rating')
        }),
        ('Engagement', {
            'fields': ('helpful_count',)
        }),
        ('Moderation', {
            'fields': ('moderation_status', 'moderation_comment', 'moderation_date', 'moderator')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.user = request.user
        super().save_model(request, obj, form, change)

@admin.register(Photo)
class PhotoAdmin(ModeratedModelAdmin):
    list_display = ('place', 'user', 'moderation_status', 'created_at')
    list_filter = ('moderation_status',)
    search_fields = ('place__name', 'user__username', 'caption')
    readonly_fields = ('created_at', 'updated_at')

    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.user = request.user
        super().save_model(request, obj, form, change)

@admin.register(Feature)
class FeatureAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'applicable_place_types')
    search_fields = ('name', 'description')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description')
        }),
        ('Display', {
            'fields': ('icon',)
        }),
        ('Settings', {
            'fields': ('applicable_place_types',)
        }),
    )

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'created_at', 'is_read')
    list_filter = ('notification_type', 'is_read')
    search_fields = ('user__username', 'title', 'message')
    readonly_fields = ('created_at', 'updated_at')

@admin.register(HelpfulVote)
class HelpfulVoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'review', 'is_helpful')
    list_filter = ('is_helpful',)
    search_fields = ('user__username', 'review__place__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('user', 'review', 'is_helpful')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
