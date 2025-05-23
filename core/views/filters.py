from django_filters.rest_framework.filters import BaseInFilter, CharFilter
from core.choices import DISTRICT_CHOICES

class SafeCommaSeparatedListFilter(BaseInFilter, CharFilter):
    def filter(self, qs, value):
        if not value: # value is a list from the MultipleChoiceFilter aspect or similar param handling
            return qs
        
        # Assuming 'value' is already a list of strings, as DRF/django-filter usually provides
        # for fields that handle multiple comma-separated inputs.
        valid_choices = set(dict(DISTRICT_CHOICES).keys())
        
        # Ensure we are working with a list, even if a single string was somehow passed
        # (though DRF's query param handling for list-type filters should make `value` a list)
        if isinstance(value, str):
            current_values = [v.strip() for v in value.split(',') if v.strip()]
        elif not isinstance(value, list):
            # If it's not a list or string (e.g. single int/float if field was misconfigured), treat as no valid input
            return qs.none()
        else:
            current_values = value

        if not current_values:
            return qs # Empty list after processing means no filter to apply
            
        valid_values = [v for v in current_values if v in valid_choices]
        
        if not valid_values:
            return qs.none()
            
        return super().filter(qs, valid_values) # This uses self.field_name and self.lookup_expr ('in') 