import math
from datetime import date

ROUND_STEP = 1000

def _round_up(x:int) -> int:
    return math.ceil(x / ROUND_STEP) * ROUND_STEP

def compute_line(base:int, *, family:bool, cash:bool, late:bool) -> int:
    discount = _round_up(base*0.10) if (family or cash) else 0
    penalty = _round_up(base*0.10) if late else 0
    return base - discount + penalty