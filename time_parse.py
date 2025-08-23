
def time_str_to_seconds(time_str):
    """
    0-2桁:1-2桁:1-2桁の時間表記（例: 1:23:45, 12:3:4, 0:59:59 など）を秒数に変換する。
    """
    parts = time_str.strip().split(":")
    if len(parts) == 3:
        h, m, s = parts
    elif len(parts) == 2:
        h = 0
        m, s = parts
    else:
        raise ValueError(f"Invalid time format: {time_str}")
    return int(h) * 3600 + int(m) * 60 + int(s)
