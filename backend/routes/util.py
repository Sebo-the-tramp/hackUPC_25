from typing import Optional
from flask import Request

def get_user_id_from_cookie(request: Request) -> Optional[int]:
    user_id = request.cookies.get("user_id")
    if not user_id:
        return None
    try:
        return int(user_id)
    except ValueError:
        return None
