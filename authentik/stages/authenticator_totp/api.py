"""AuthenticatorTOTPStage API Views"""
from django_filters.rest_framework.backends import DjangoFilterBackend
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework import mixins
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAdminUser
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import GenericViewSet, ModelViewSet, ReadOnlyModelViewSet

from authentik.api.authorization import OwnerFilter, OwnerPermissions
from authentik.flows.api.stages import StageSerializer
from authentik.stages.authenticator_totp.models import AuthenticatorTOTPStage


class AuthenticatorTOTPStageSerializer(StageSerializer):
    """AuthenticatorTOTPStage Serializer"""

    class Meta:

        model = AuthenticatorTOTPStage
        fields = StageSerializer.Meta.fields + ["configure_flow", "digits"]


class AuthenticatorTOTPStageViewSet(ModelViewSet):
    """AuthenticatorTOTPStage Viewset"""

    queryset = AuthenticatorTOTPStage.objects.all()
    serializer_class = AuthenticatorTOTPStageSerializer


class TOTPDeviceSerializer(ModelSerializer):
    """Serializer for totp authenticator devices"""

    class Meta:

        model = TOTPDevice
        fields = [
            "name",
            "pk",
        ]
        depth = 2


class TOTPDeviceViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    GenericViewSet,
):
    """Viewset for totp authenticator devices"""

    queryset = TOTPDevice.objects.all()
    serializer_class = TOTPDeviceSerializer
    permission_classes = [OwnerPermissions]
    filter_backends = [OwnerFilter, DjangoFilterBackend, OrderingFilter, SearchFilter]
    search_fields = ["name"]
    filterset_fields = ["name"]
    ordering = ["name"]


class TOTPAdminDeviceViewSet(ReadOnlyModelViewSet):
    """Viewset for totp authenticator devices (for admins)"""

    permission_classes = [IsAdminUser]
    queryset = TOTPDevice.objects.all()
    serializer_class = TOTPDeviceSerializer
    search_fields = ["name"]
    filterset_fields = ["name"]
    ordering = ["name"]
