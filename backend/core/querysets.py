from django.db.models import Count, Sum, BooleanField, Q, Case, When, F
from datetime import date
from .models import Student, Enrollment, Payment

def student_with_finance(today:date = date.today()):
    tenth = date(today.year, today.month, 10)
    qs = Student.objects.all()
    
    qs = qs.annotate(
        enrolled_classes=Count('enrollments__option__klass', distinct=True),
        amount_due = Sum('enrollments__amount_due',
                         filter=Q(enrollments__payment__due_date__month=today.month,)),
        amount_paid = Sum('enrollments__payment__amount_paid',
                          filter=Q(enrollments__payment__due_date__month=today.month,)),
    ).annotate(
        debt = F('amount_due') - F('amount_paid'),
        is_paid = Case(When(debt__lte=0, then=True), default=False, output_field=BooleanField()),
        is_late = Case(When(debt__gt=0, then=today > tenth), default=False, output_field=BooleanField()),
    )
    return qs