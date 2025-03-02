import { FlowsApi, AuthenticatorTOTPStage, StagesApi, FlowsInstancesListDesignationEnum } from "authentik-api";
import { t } from "@lingui/macro";
import { customElement } from "lit-element";
import { html, TemplateResult } from "lit-html";
import { DEFAULT_CONFIG } from "../../../api/Config";
import { ifDefined } from "lit-html/directives/if-defined";
import "../../../elements/forms/HorizontalFormElement";
import "../../../elements/forms/FormGroup";
import { until } from "lit-html/directives/until";
import { ModelForm } from "../../../elements/forms/ModelForm";

@customElement("ak-stage-authenticator-totp-form")
export class AuthenticatorTOTPStageForm extends ModelForm<AuthenticatorTOTPStage, string> {

    loadInstance(pk: string): Promise<AuthenticatorTOTPStage> {
        return new StagesApi(DEFAULT_CONFIG).stagesAuthenticatorTotpRetrieve({
            stageUuid: pk,
        });
    }

    getSuccessMessage(): string {
        if (this.instance) {
            return t`Successfully updated stage.`;
        } else {
            return t`Successfully created stage.`;
        }
    }

    send = (data: AuthenticatorTOTPStage): Promise<AuthenticatorTOTPStage> => {
        if (this.instance) {
            return new StagesApi(DEFAULT_CONFIG).stagesAuthenticatorTotpUpdate({
                stageUuid: this.instance.pk || "",
                authenticatorTOTPStageRequest: data
            });
        } else {
            return new StagesApi(DEFAULT_CONFIG).stagesAuthenticatorTotpCreate({
                authenticatorTOTPStageRequest: data
            });
        }
    };

    renderForm(): TemplateResult {
        return html`<form class="pf-c-form pf-m-horizontal">
            <div class="form-help-text">
                ${t`Stage used to configure a TOTP authenticator (i.e. Authy/Google Authenticator).`}
            </div>
            <ak-form-element-horizontal
                label=${t`Name`}
                ?required=${true}
                name="name">
                <input type="text" value="${ifDefined(this.instance?.name || "")}" class="pf-c-form-control" required>
            </ak-form-element-horizontal>
            <ak-form-group .expanded=${true}>
                <span slot="header">
                    ${t`Stage-specific settings`}
                </span>
                <div slot="body" class="pf-c-form">
                    <ak-form-element-horizontal
                        label=${t`Digits`}
                        ?required=${true}
                        name="digits">
                        <select name="users" class="pf-c-form-control">
                            <option value="6" ?selected=${this.instance?.digits === 6}>
                                ${t`6 digits, widely compatible`}
                            </option>
                            <option value="8" ?selected=${this.instance?.digits === 8}>
                                ${t`8 digits, not compatible with apps like Google Authenticator`}
                            </option>
                        </select>
                    </ak-form-element-horizontal>
                    <ak-form-element-horizontal
                        label=${t`Configuration flow`}
                        name="configureFlow">
                        <select class="pf-c-form-control">
                            <option value="" ?selected=${this.instance?.configureFlow === undefined}>---------</option>
                            ${until(new FlowsApi(DEFAULT_CONFIG).flowsInstancesList({
                                ordering: "pk",
                                designation: FlowsInstancesListDesignationEnum.StageConfiguration,
                            }).then(flows => {
                                return flows.results.map(flow => {
                                    let selected = this.instance?.configureFlow === flow.pk;
                                    if (!this.instance?.pk && !this.instance?.configureFlow && flow.slug === "default-otp-time-configure") {
                                        selected = true;
                                    }
                                    return html`<option value=${ifDefined(flow.pk)} ?selected=${selected}>${flow.name} (${flow.slug})</option>`;
                                });
                            }), html`<option>${t`Loading...`}</option>`)}
                        </select>
                        <p class="pf-c-form__helper-text">${t`Flow used by an authenticated user to configure this Stage. If empty, user will not be able to configure this stage.`}</p>
                    </ak-form-element-horizontal>
                </div>
            </ak-form-group>
        </form>`;
    }

}
