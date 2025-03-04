import { ConsentStage, ConsentStageModeEnum, StagesApi } from "authentik-api";
import { t } from "@lingui/macro";
import { customElement, property } from "lit-element";
import { html, TemplateResult } from "lit-html";
import { DEFAULT_CONFIG } from "../../../api/Config";
import { ifDefined } from "lit-html/directives/if-defined";
import "../../../elements/forms/HorizontalFormElement";
import "../../../elements/forms/FormGroup";
import { ModelForm } from "../../../elements/forms/ModelForm";

@customElement("ak-stage-consent-form")
export class ConsentStageForm extends ModelForm<ConsentStage, string> {

    loadInstance(pk: string): Promise<ConsentStage> {
        return new StagesApi(DEFAULT_CONFIG).stagesConsentRetrieve({
            stageUuid: pk,
        }).then(stage => {
            this.showExpiresIn = stage.name === ConsentStageModeEnum.Expiring;
            return stage;
        });
    }

    @property({type: Boolean})
    showExpiresIn = false;

    getSuccessMessage(): string {
        if (this.instance) {
            return t`Successfully updated stage.`;
        } else {
            return t`Successfully created stage.`;
        }
    }

    send = (data: ConsentStage): Promise<ConsentStage> => {
        if (this.instance) {
            return new StagesApi(DEFAULT_CONFIG).stagesConsentUpdate({
                stageUuid: this.instance.pk || "",
                consentStageRequest: data
            });
        } else {
            return new StagesApi(DEFAULT_CONFIG).stagesConsentCreate({
                consentStageRequest: data
            });
        }
    };

    renderForm(): TemplateResult {
        return html`<form class="pf-c-form pf-m-horizontal">
            <div class="form-help-text">
                ${t`Prompt for the user's consent. The consent can either be permanent or expire in a defined amount of time.`}
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
                        label=${t`Mode`}
                        ?required=${true}
                        name="mode">
                        <select class="pf-c-form-control" @change=${(ev: Event) => {
                            const target = ev.target as HTMLSelectElement;
                            if (target.selectedOptions[0].value === ConsentStageModeEnum.Expiring) {
                                this.showExpiresIn = true;
                            } else {
                                this.showExpiresIn = false;
                            }
                        }}>
                            <option value=${ConsentStageModeEnum.AlwaysRequire} ?selected=${this.instance?.mode === ConsentStageModeEnum.AlwaysRequire}>
                                ${t`Always require consent`}
                            </option>
                            <option value=${ConsentStageModeEnum.Permanent} ?selected=${this.instance?.mode === ConsentStageModeEnum.Permanent}>
                                ${t`Consent given last indefinitely`}
                            </option>
                            <option value=${ConsentStageModeEnum.Expiring} ?selected=${this.instance?.mode === ConsentStageModeEnum.Expiring}>
                                ${t`Consent expires.`}
                            </option>
                        </select>
                    </ak-form-element-horizontal>
                    <ak-form-element-horizontal
                        ?hidden=${!this.showExpiresIn}
                        label=${t`Consent expires in`}
                        ?required=${true}
                        name="consentExpireIn">
                        <input type="text" value="${ifDefined(this.instance?.consentExpireIn || "weeks=4")}" class="pf-c-form-control" required>
                        <p class="pf-c-form__helper-text">${t`Offset after which consent expires. (Format: hours=1;minutes=2;seconds=3).`}</p>
                    </ak-form-element-horizontal>
                </div>
            </ak-form-group>
        </form>`;
    }

}
