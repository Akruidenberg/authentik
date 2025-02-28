"""tenant models"""
from uuid import uuid4

from django.db import models
from django.utils.translation import gettext_lazy as _

from authentik.flows.models import Flow


class Tenant(models.Model):
    """Single tenant"""

    tenant_uuid = models.UUIDField(primary_key=True, editable=False, default=uuid4)
    domain = models.TextField(
        help_text=_(
            "Domain that activates this tenant. "
            "Can be a superset, i.e. `a.b` for `aa.b` and `ba.b`"
        )
    )
    default = models.BooleanField(
        default=False,
    )

    branding_title = models.TextField(default="authentik")
    branding_logo = models.TextField(
        default="/static/dist/assets/icons/icon_left_brand.svg"
    )
    branding_favicon = models.TextField(default="/static/dist/assets/icons/icon.png")

    flow_authentication = models.ForeignKey(
        Flow, null=True, on_delete=models.SET_NULL, related_name="tenant_authentication"
    )
    flow_invalidation = models.ForeignKey(
        Flow, null=True, on_delete=models.SET_NULL, related_name="tenant_invalidation"
    )
    flow_recovery = models.ForeignKey(
        Flow, null=True, on_delete=models.SET_NULL, related_name="tenant_recovery"
    )
    flow_unenrollment = models.ForeignKey(
        Flow, null=True, on_delete=models.SET_NULL, related_name="tenant_unenrollment"
    )

    def __str__(self) -> str:
        return self.domain

    class Meta:

        verbose_name = _("Tenant")
        verbose_name_plural = _("Tenants")
