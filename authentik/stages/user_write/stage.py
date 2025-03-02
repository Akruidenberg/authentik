"""Write stage logic"""
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.backends import ModelBackend
from django.db.utils import IntegrityError
from django.http import HttpRequest, HttpResponse
from django.utils.translation import gettext as _
from structlog.stdlib import get_logger

from authentik.core.middleware import SESSION_IMPERSONATE_USER
from authentik.core.models import USER_ATTRIBUTE_SOURCES, User, UserSourceConnection
from authentik.core.sources.stage import PLAN_CONTEXT_SOURCES_CONNECTION
from authentik.flows.planner import PLAN_CONTEXT_PENDING_USER
from authentik.flows.stage import StageView
from authentik.lib.utils.reflection import class_to_path
from authentik.stages.password.stage import PLAN_CONTEXT_AUTHENTICATION_BACKEND
from authentik.stages.prompt.stage import PLAN_CONTEXT_PROMPT
from authentik.stages.user_write.signals import user_write

LOGGER = get_logger()


class UserWriteStageView(StageView):
    """Finalise Enrollment flow by creating a user object."""

    def get(self, request: HttpRequest) -> HttpResponse:
        """Save data in the current flow to the currently pending user. If no user is pending,
        a new user is created."""
        if PLAN_CONTEXT_PROMPT not in self.executor.plan.context:
            message = _("No Pending data.")
            messages.error(request, message)
            LOGGER.debug(message)
            return self.executor.stage_invalid()
        data = self.executor.plan.context[PLAN_CONTEXT_PROMPT]
        user_created = False
        if PLAN_CONTEXT_PENDING_USER not in self.executor.plan.context:
            self.executor.plan.context[PLAN_CONTEXT_PENDING_USER] = User()
            self.executor.plan.context[
                PLAN_CONTEXT_AUTHENTICATION_BACKEND
            ] = class_to_path(ModelBackend)
            LOGGER.debug(
                "Created new user",
                flow_slug=self.executor.flow.slug,
            )
            user_created = True
        user: User = self.executor.plan.context[PLAN_CONTEXT_PENDING_USER]
        # Before we change anything, check if the user is the same as in the request
        # and we're updating a password. In that case we need to update the session hash
        # Also check that we're not currently impersonating, so we don't update the session
        should_update_seesion = False
        if (
            any("password" in x for x in data.keys())
            and self.request.user.pk == user.pk
            and SESSION_IMPERSONATE_USER not in self.request.session
        ):
            should_update_seesion = True
        for key, value in data.items():
            setter_name = f"set_{key}"
            # Check if user has a setter for this key, like set_password
            if hasattr(user, setter_name):
                setter = getattr(user, setter_name)
                if callable(setter):
                    setter(value)
            # User has this key already
            elif hasattr(user, key):
                setattr(user, key, value)
            # Otherwise we just save it as custom attribute, but only if the value is prefixed with
            # `attribute_`, to prevent accidentally saving values
            else:
                if not key.startswith("attribute_"):
                    LOGGER.debug("discarding key", key=key)
                    continue
                user.attributes[key.replace("attribute_", "", 1)] = value
        # Extra check to prevent flows from saving a user with a blank username
        if user.username == "":
            LOGGER.warning("Aborting write to empty username", user=user)
            return self.executor.stage_invalid()
        # Check if we're writing from a source, and save the source to the attributes
        if PLAN_CONTEXT_SOURCES_CONNECTION in self.executor.plan.context:
            if USER_ATTRIBUTE_SOURCES not in user.attributes or not isinstance(
                user.attributes.get(USER_ATTRIBUTE_SOURCES), list
            ):
                user.attributes[USER_ATTRIBUTE_SOURCES] = []
            connection: UserSourceConnection = self.executor.plan.context[
                PLAN_CONTEXT_SOURCES_CONNECTION
            ]
            user.attributes[USER_ATTRIBUTE_SOURCES].append(connection.source.name)
        try:
            user.save()
        except IntegrityError as exc:
            LOGGER.warning("Failed to save user", exc=exc)
            self.executor.stage_invalid()
        user_write.send(
            sender=self, request=request, user=user, data=data, created=user_created
        )
        # Check if the password has been updated, and update the session auth hash
        if should_update_seesion:
            update_session_auth_hash(self.request, user)
            LOGGER.debug("Updated session hash", user=user)
        LOGGER.debug(
            "Updated existing user",
            user=user,
            flow_slug=self.executor.flow.slug,
        )
        return self.executor.stage_ok()
