from django.db import models
from django.utils import timezone

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
    start = models.DateField(db_default=timezone.now)
    
class Payment(models.Model):
    enrollment  = models.ForeignKey(Enrollment, on_delete=models.CASCADE)
    due_date    = models.DateField()
    paid_on     = models.DateField(null=True, blank=True)
    method      = models.CharField(max_length=8, choices=[("cash","efectivo"),("transfer","transferencia")])
    amount_due  = models.PositiveIntegerField()
    amount_paid = models.PositiveIntegerField(null=True, blank=True)
    