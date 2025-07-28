from django.contrib import admin
from nested_admin import (
    NestedModelAdmin, NestedStackedInline, NestedTabularInline,
)

from core.models import PricePlan, ClassOption, Class

class PricePlanInline(NestedTabularInline):
    model = PricePlan
    extra = 1
    
class ClassOptionInLine(NestedStackedInline):
    model = ClassOption
    extra = 1
    inlines = [PricePlanInline]
    
@admin.register(Class)
class ClassAdmin(NestedModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)
    inlines = [ClassOptionInLine]
    
    