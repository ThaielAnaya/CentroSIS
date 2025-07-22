from django.contrib import admin
from core.models import PricePlan, ClassOption


class PricePlanInline(admin.TabularInline):
    model = PricePlan
    extra = 1
    
@admin.register(PricePlan)
class PricePlanAdmin(admin.ModelAdmin):
    list_display = ('option', 'cycle', 'base_price')
    list_filter = ('cycle',)
    search_fields = ('option__name',)
    ordering = ('option__name', 'cycle')
    
@admin.register(ClassOption)
class ClassOptionAdmin(admin.ModelAdmin):
    list_display = ('klass__name',)
    inlines = [PricePlanInline]