import re

HABIT_WEEKS = {1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13}
_DAY = re.compile(r"^w(\d+)\|d[0-6]$")
_DONE = re.compile(r"^w(\d+)\|done$")


def summarize(d: dict) -> dict:
    """Korte samenvatting van een voortgang-document voor het beheeroverzicht."""
    days = weeks_done = 0
    for key, val in d.items():
        if val is not True:
            continue
        m = _DAY.match(key)
        if m and int(m.group(1)) in HABIT_WEEKS:
            days += 1
            continue
        m = _DONE.match(key)
        if m and 1 <= int(m.group(1)) <= 13:
            weeks_done += 1
    goal = d.get("me|doel")
    return {
        "days": days,
        "days_total": 84,
        "weeks_done": weeks_done,
        "mode": d.get("me|mode") or "full",
        "goal": goal[:160] if isinstance(goal, str) else "",
        "eval30": d.get("ev30|score"),
        "eval60": d.get("ev60|score"),
        "eval90": d.get("ev90|score"),
    }
