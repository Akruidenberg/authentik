"""authentik URL Configuration"""
from django.contrib.auth.decorators import login_required
from django.urls import path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import RedirectView
from django.views.generic.base import TemplateView

from authentik.core.views import impersonate
from authentik.core.views.interface import FlowInterfaceView

urlpatterns = [
    path(
        "",
        login_required(RedirectView.as_view(pattern_name="authentik_core:if-admin")),
        name="root-redirect",
    ),
    # Impersonation
    path(
        "-/impersonation/<int:user_id>/",
        impersonate.ImpersonateInitView.as_view(),
        name="impersonate-init",
    ),
    path(
        "-/impersonation/end/",
        impersonate.ImpersonateEndView.as_view(),
        name="impersonate-end",
    ),
    # Interfaces
    path(
        "if/admin/",
        ensure_csrf_cookie(TemplateView.as_view(template_name="if/admin.html")),
        name="if-admin",
    ),
    path(
        "if/flow/<slug:flow_slug>/",
        ensure_csrf_cookie(FlowInterfaceView.as_view()),
        name="if-flow",
    ),
    # Fallback for WS
    path("ws/outpost/<uuid:pk>/", TemplateView.as_view(template_name="if/admin.html")),
    path(
        "ws/client/",
        TemplateView.as_view(template_name="if/admin.html"),
    ),
]
