from django.db import models
from django.utils import timezone

class Student(models.Model):
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
