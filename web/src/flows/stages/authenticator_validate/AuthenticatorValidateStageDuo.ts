import { t } from "@lingui/macro";
import { CSSResult, customElement, html, property, TemplateResult } from "lit-element";
import PFLogin from "@patternfly/patternfly/components/Login/login.css";
import PFForm from "@patternfly/patternfly/components/Form/form.css";
import PFFormControl from "@patternfly/patternfly/components/FormControl/form-control.css";
import PFTitle from "@patternfly/patternfly/components/Title/title.css";
import PFButton from "@patternfly/patternfly/components/Button/button.css";
import PFBase from "@patternfly/patternfly/patternfly-base.css";
import AKGlobal from "../../../authentik.css";
import { BaseStage } from "../base";
import { AuthenticatorValidateStage } from "./AuthenticatorValidateStage";
import "../../../elements/forms/FormElement";
import "../../../elements/EmptyState";
import "../../FormStatic";
import { FlowURLManager } from "../../../api/legacy";
import { AuthenticatorValidationChallenge } from "authentik-api/dist/models/AuthenticatorValidationChallenge";
import { AuthenticatorValidationChallengeResponseRequest, DeviceChallenge } from "authentik-api";

@customElement("ak-stage-authenticator-validate-duo")
export class AuthenticatorValidateStageWebDuo extends BaseStage<AuthenticatorValidationChallenge, AuthenticatorValidationChallengeResponseRequest> {

    @property({ attribute: false })
    deviceChallenge?: DeviceChallenge;

    @property({ type: Boolean })
    showBackButton = false;

    static get styles(): CSSResult[] {
        return [PFBase, PFLogin, PFForm, PFFormControl, PFTitle, PFButton, AKGlobal];
    }

    firstUpdated(): void {
        this.host?.submit({
            "duo": this.deviceChallenge?.deviceUid
        });
    }

    render(): TemplateResult {
        if (!this.challenge) {
            return html`<ak-empty-state
                ?loading="${true}"
                header=${t`Loading`}>
            </ak-empty-state>`;
        }
        return html`<div class="pf-c-login__main-body">
            <form class="pf-c-form" @submit=${(e: Event) => { this.submitForm(e); }}>
                <ak-form-static
                    class="pf-c-form__group"
                    userAvatar="${this.challenge.pendingUserAvatar}"
                    user=${this.challenge.pendingUser}>
                    <div slot="link">
                        <a href="${FlowURLManager.cancel()}">${t`Not you?`}</a>
                    </div>
                </ak-form-static>

                <div class="pf-c-form__group pf-m-action">
                    <button type="submit" class="pf-c-button pf-m-primary pf-m-block">
                        ${t`Continue`}
                    </button>
                </div>
            </form>
        </div>
        <footer class="pf-c-login__main-footer">
            <ul class="pf-c-login__main-footer-links">
                ${this.showBackButton ?
                    html`<li class="pf-c-login__main-footer-links-item">
                        <button class="pf-c-button pf-m-secondary pf-m-block" @click=${() => {
                            if (!this.host) return;
                            (this.host as AuthenticatorValidateStage).selectedDeviceChallenge = undefined;
                        }}>
                            ${t`Return to device picker`}
                        </button>
                    </li>`:
                    html``}
            </ul>
        </footer>`;
    }

}
