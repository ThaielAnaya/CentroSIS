from datetime import date, timedelta
from decimal import Decimal

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Enrollment, Payment, PricePlan

@receiver(post_save, sender=Enrollment)
def create_payments_for_enrollment(sender, instance, created, **kwargs):
    if not created:
        return
    
    option = instance.option
    try:
        plan = option.priceplan_set
    except PricePlan.DoesNotExist:
        return
    
    today = date.today()
    due = date(today.year, today.month, 28)
    
    Payment.objects.create(
        enrollment = instance,
        cycle = "M",
        due_date = due,
        method = "transfer",
    )