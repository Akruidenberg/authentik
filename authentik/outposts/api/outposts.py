"""Outpost API Views"""
from dacite.core import from_dict
from dacite.exceptions import DaciteError
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.fields import BooleanField, CharField, DateTimeField
from rest_framework.relations import PrimaryKeyRelatedField
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.serializers import JSONField, ModelSerializer, ValidationError
from rest_framework.viewsets import ModelViewSet

from authentik.core.api.providers import ProviderSerializer
from authentik.core.api.utils import PassiveSerializer, is_dict
from authentik.core.models import Provider
from authentik.outposts.models import (
    Outpost,
    OutpostConfig,
    OutpostType,
    default_outpost_config,
)
from authentik.providers.ldap.models import LDAPProvider
from authentik.providers.proxy.models import ProxyProvider


class OutpostSerializer(ModelSerializer):
    """Outpost Serializer"""

    config = JSONField(validators=[is_dict], source="_config")
    providers = PrimaryKeyRelatedField(
        allow_empty=False,
        many=True,
        queryset=Provider.objects.select_subclasses().all(),
    )
    providers_obj = ProviderSerializer(source="providers", many=True, read_only=True)

    def validate_providers(self, providers: list[Provider]) -> list[Provider]:
        """Check that all providers match the type of the outpost"""
        type_map = {
            OutpostType.LDAP: LDAPProvider,
            OutpostType.PROXY: ProxyProvider,
            None: Provider,
        }
        for provider in providers:
            if not isinstance(provider, type_map[self.initial_data.get("type")]):
                raise ValidationError(
                    (
                        f"Outpost type {self.initial_data['type']} can't be used with "
                        f"{type(provider)} providers."
                    )
                )
        return providers

    def validate_config(self, config) -> dict:
        """Check that the config has all required fields"""
        try:
            from_dict(OutpostConfig, config)
        except DaciteError as exc:
            raise ValidationError(f"Failed to validate config: {str(exc)}") from exc
        return config

    class Meta:

        model = Outpost
        fields = [
            "pk",
            "name",
            "type",
            "providers",
            "providers_obj",
            "service_connection",
            "token_identifier",
            "config",
        ]
        extra_kwargs = {"type": {"required": True}}


class OutpostDefaultConfigSerializer(PassiveSerializer):
    """Global default outpost config"""

    config = JSONField(read_only=True)


class OutpostHealthSerializer(PassiveSerializer):
    """Outpost health status"""

    last_seen = DateTimeField(read_only=True)
    version = CharField(read_only=True)
    version_should = CharField(read_only=True)
    version_outdated = BooleanField(read_only=True)


class OutpostViewSet(ModelViewSet):
    """Outpost Viewset"""

    queryset = Outpost.objects.all()
    serializer_class = OutpostSerializer
    filterset_fields = {
        "providers": ["isnull"],
    }
    search_fields = [
        "name",
        "providers__name",
    ]
    ordering = ["name"]

    @extend_schema(responses={200: OutpostHealthSerializer(many=True)})
    @action(methods=["GET"], detail=True, pagination_class=None)
    # pylint: disable=invalid-name, unused-argument
    def health(self, request: Request, pk: int) -> Response:
        """Get outposts current health"""
        outpost: Outpost = self.get_object()
        states = []
        for state in outpost.state:
            states.append(
                {
                    "last_seen": state.last_seen,
                    "version": state.version,
                    "version_should": state.version_should,
                    "version_outdated": state.version_outdated,
                }
            )
        return Response(OutpostHealthSerializer(states, many=True).data)

    @extend_schema(responses={200: OutpostDefaultConfigSerializer(many=False)})
    @action(detail=False, methods=["GET"])
    def default_settings(self, request: Request) -> Response:
        """Global default outpost config"""
        host = self.request.build_absolute_uri("/")
        return Response({"config": default_outpost_config(host)})
