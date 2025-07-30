# core/querysets.py
from datetime import date

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import (
    BooleanField,
    Case,
    Count,
    F,
    IntegerField,
    Q,
    Sum,
    Value,
    When,
)
from django.db.models.functions import Coalesce, ExtractDay

from .models import CUTOFF_DAY, Student


def student_with_finance(today: date | None = None):
    """
    One-row-per-student queryset with:
      • list of class names  → enrolled_classes  (ArrayAgg)
      • number of classes    → enrolled_count
      • amount due / paid for current month
      • debt  = due − paid
      • is_paid  = debt ≤ 0
      • is_late  = debt > 0  AND  student joined on/before 10th  AND  today > 10th
    """
    today = today or date.today()
    after_cutoff_today = today.day > CUTOFF_DAY  # bool in Python

    qs = (
        Student.objects
        # ── aggregates ────────────────────────────────────────────────────
        .annotate(
            enrolled_classes=ArrayAgg(
                "enrollments__option__klass__name",
                distinct=True,
            ),
            enrolled_count=Count(
                "enrollments__option__klass",
                distinct=True,
            ),
            amount_due=Coalesce(
                Sum(
                    "enrollments__payments__amount_due",
                    filter=Q(enrollments__payments__due_date__month=today.month),
                ),
                0,
            ),
            amount_paid=Coalesce(
                Sum(
                    "enrollments__payments__amount_paid",
                    filter=Q(enrollments__payments__due_date__month=today.month),
                ),
                0,
            ),
        )
        # ── helpers ───────────────────────────────────────────────────────
        .annotate(
            debt=F("amount_due") - F("amount_paid"),
            joined_day=ExtractDay("enrollments__start", output_field=IntegerField()),
        )
        # ── base flags ────────────────────────────────────────────────────
        .annotate(
            is_paid=Case(
                When(debt__lte=0, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
            joined_before_cutoff=Case(
                When(joined_day__lte=CUTOFF_DAY, then=Value(True)),
                default=Value(False),
                output_field=BooleanField(),
            ),
        )
    )

    # ── late flag depends on today's date ────────────────────────────────
    if after_cutoff_today:
        qs = qs.annotate(
            is_late=Case(
                When(
                    Q(debt__gt=0) & Q(joined_before_cutoff=True),
                    then=Value(True),
                ),
                default=Value(False),
                output_field=BooleanField(),
            )
        )
    else:
        # before or on the 10th: nobody is "late" yet
        qs = qs.annotate(is_late=Value(False, output_field=BooleanField()))

    return qs
