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
        student = self.enrollment.student
        plan = PricePlan.objects.get(option=self.enrollment.option, cycle=self.cycle)
        
        base = Decimal(plan.base_price)
        total = base
        
        is_late = self.due_date.day > CUTOFF_DAY
        monthly = self.cycle == "M"
        family = student.is_family_member
        by_cash = self.method == "cash"
        by_trans = self.method == "transfer"
        
        if is_late:
            total += total * LATE_PENALTY
            
        discount_applies = None
        if monthly:
            if not is_late and by_cash:
                discount_applies = "cash"
            elif by_trans and family:
                discount_applies = "family"
                
        if discount_applies:
            total -= total * DISCOUNT_RATE
            
        return _round_up(total)
    
    def save(self, *args, **kwargs):
        self.amount_due = self._calc_amount_due()
        super().save(*args, **kwargs)
        
    def amount_due_for(self) -> int:
        return self._calc_amount_due()
    