from datetime import date
from flask import request, url_for

NAV_GROUPS = [
    {
        "label": "Study",
        "items": [
            {"label": "Dashboard", "endpoint": "dashboard.index", "endpoint_args": {}, "match": ["/"], "icon": "dashboard"},
            {"label": "Library", "endpoint": "library.library", "endpoint_args": {}, "match": ["/library", "/topic"], "icon": "library"},
            {"label": "Reading", "endpoint": "reading.reading_list", "endpoint_args": {}, "match": ["/reading"], "icon": "reading"},
            {"label": "Question Bank", "endpoint": "mcq.mcq_list", "endpoint_args": {}, "match": ["/mcq"], "icon": "question"},
        ],
    },
    {
        "label": "Plan",
        "items": [
            {"label": "Calendar", "endpoint": "calendar.calendar_page", "endpoint_args": {}, "match": ["/calendar"], "icon": "calendar"},
            {"label": "Daily Plan", "endpoint": "daily.daily_view", "endpoint_args": {"date": date.today().isoformat()}, "match": ["/daily"], "icon": "daily"},
            {"label": "Tasks", "endpoint": "todos.todos_list", "endpoint_args": {}, "match": ["/todos"], "icon": "tasks"},
        ],
    },
    {
        "label": "Content",
        "items": [
            {"label": "Upload XML", "endpoint": "upload.upload_page", "endpoint_args": {}, "match": ["/upload"], "icon": "upload"},
        ],
    },
]


def build_navigation():
    groups = []
    for group in NAV_GROUPS:
        items = []
        for item in group["items"]:
            href = url_for(item["endpoint"], **item.get("endpoint_args", {}))
            active = _is_active(item["match"])
            items.append({**item, "href": href, "active": active})
        groups.append({"label": group["label"], "items": items})
    return groups


def _is_active(matches):
    path = request.path.rstrip("/") or "/"
    if "/" in matches and path == "/":
        return True
    return any(path.startswith(match.rstrip("/")) for match in matches if match != "/")
