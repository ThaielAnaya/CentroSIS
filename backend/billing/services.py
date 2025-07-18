import math
from datetime import date

from backend.core.models import PricePlan

ROUND_STEP = 1000

def _round_up(x:int) -> int:
    return math.ceil(x / ROUND_STEP) * ROUND_STEP

def compute_line(base:int, *, family:bool, cash:bool, late:bool) -> int:
    discount = _round_up(base*0.10) if (family or cash) else 0
    penalty = _round_up(base*0.10) if late else 0
    return base - discount + penalty

def invoice(student, today:date=date.today()) -> int:
    total = 0
    family = student.is_family_member
    for e in student.enrollments.all():
        plan = PricePlan.objects.get(option=e.option, cycle="S" if e.is_semestral else "M")
        late = today > date(today.year, today.month, 10)
        total += compute_line(plan.base_price, family=family, cash=False, late=late)
    return total