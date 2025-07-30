from django.db import models
from django.utils import timezone
from datetime import date
from decimal import Decimal

from billing.services import _round_up

DISCOUNT_RATE = Decimal("0.10")
LATE_PENALTY = Decimal("0.10")
CUTOFF_DAY = 10

class Student(models.Model):
    DNI = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    birth_date = models.DateField()
    active = models.BooleanField(default=True)
    is_family_member = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
class Class(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
class ClassOption(models.Model):
    identifier = models.CharField(max_length=10)
    klass = models.ForeignKey(Class, on_delete=models.CASCADE)
    weekly_sessions = models.PositiveSmallIntegerField()
    
    class Meta:
        unique_together = ('klass', 'weekly_sessions')

class PricePlan(models.Model):
    BILLING = (('M', 'Mensual'), ('S', 'Semestral'))
    option = models.ForeignKey(ClassOption, on_delete=models.CASCADE)
    cycle = models.CharField(max_length=1, choices=BILLING)
    base_price = models.PositiveIntegerField(help_text="Pesos antes de descuentos")
    
class Enrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    option = models.ForeignKey(ClassOption, on_delete=models.PROTECT)
    start = models.DateField(default=timezone.now)
    
class Payment(models.Model):
    CYCLE = PricePlan.BILLING
    METHOD = (("cash", "efectivo"), ("transfer", "transferencia"))
    
    enrollment  = models.ForeignKey(Enrollment, related_name="payments", on_delete=models.CASCADE)
    cycle = models.CharField(max_length=1, choices=CYCLE, default="M")
    due_date    = models.DateField()
    paid_on     = models.DateField(null=True, blank=True)
    method      = models.CharField(max_length=8, choices=[("cash","efectivo"),("transfer","transferencia")])
    amount_due  = models.PositiveIntegerField(editable=False)
    amount_paid = models.PositiveIntegerField(null=True, blank=True)
    
    def _calc_amount_due(self) -> int:
        """
        Base price ± late-penalty ± one possible discount.

        Late penalty (10 %) applies **only** when:
        • today is after the 10th, AND
        • the student enrolled on/before the 10th of the same month
        """
        plan   = PricePlan.objects.get(option=self.enrollment.option, cycle=self.cycle)
        total  = Decimal(plan.base_price)

        today                = timezone.now().date()
        joined_before_cutoff = self.enrollment.start.day <= CUTOFF_DAY
        after_cutoff_today   = today.day > CUTOFF_DAY
        is_late              = joined_before_cutoff and after_cutoff_today

        if is_late:
            total += total * LATE_PENALTY      # +10 %

        if self.cycle == "M":                  # discounts allowed only for monthly
            if not is_late and self.method == "cash":
                total -= total * DISCOUNT_RATE            # 10 % cash discount
            elif self.method == "transfer" and self.enrollment.student.is_family_member:
                total -= total * DISCOUNT_RATE            # 10 % family + transfer

        return _round_up(total)


    def save(self, *args, **kwargs):
        self.amount_due = self._calc_amount_due()
        super().save(*args, **kwargs)


    def amount_due_for(self) -> int:
        """Convenience helper to recalc without saving."""
        return self._calc_amount_due()
    