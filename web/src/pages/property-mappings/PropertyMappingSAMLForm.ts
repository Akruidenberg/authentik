import { SAMLPropertyMapping, PropertymappingsApi } from "authentik-api";
import { t } from "@lingui/macro";
import { customElement } from "lit-element";
import { html, TemplateResult } from "lit-html";
import { DEFAULT_CONFIG } from "../../api/Config";
import { ifDefined } from "lit-html/directives/if-defined";
import "../../elements/forms/HorizontalFormElement";
import "../../elements/CodeMirror";
import { ModelForm } from "../../elements/forms/ModelForm";

@customElement("ak-property-mapping-saml-form")
export class PropertyMappingLDAPForm extends ModelForm<SAMLPropertyMapping, string> {
    loadInstance(pk: string): Promise<SAMLPropertyMapping> {
        return new PropertymappingsApi(DEFAULT_CONFIG).propertymappingsSamlRetrieve({
            pmUuid: pk,
        });
    }

    getSuccessMessage(): string {
        if (this.instance) {
            return t`Successfully updated mapping.`;
        } else {
            return t`Successfully created mapping.`;
        }
    }

    send = (data: SAMLPropertyMapping): Promise<SAMLPropertyMapping> => {
        if (this.instance) {
            return new PropertymappingsApi(DEFAULT_CONFIG).propertymappingsSamlUpdate({
                pmUuid: this.instance.pk || "",
                sAMLPropertyMappingRequest: data
            });
        } else {
            return new PropertymappingsApi(DEFAULT_CONFIG).propertymappingsSamlCreate({
                sAMLPropertyMappingRequest: data
            });
        }
    };

    renderForm(): TemplateResult {
        return html`<form class="pf-c-form pf-m-horizontal">
            <ak-form-element-horizontal
                label=${t`Name`}
                ?required=${true}
                name="name">
                <input type="text" value="${ifDefined(this.instance?.name)}" class="pf-c-form-control" required>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal
                label=${t`SAML Attribute Name`}
                ?required=${true}
                name="samlName">
                <input type="text" value="${ifDefined(this.instance?.samlName)}" class="pf-c-form-control" required>
                <p class="pf-c-form__helper-text">
                    ${t`Attribute name used for SAML Assertions. Can be a URN OID, a schema reference, or a any other string. If this property mapping is used for NameID Property, this field is discarded.`}
                </p>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal
                label=${t`Friendly Name`}
                name="friendlyName">
                <input type="text" value="${ifDefined(this.instance?.friendlyName || "")}" class="pf-c-form-control">
                <p class="pf-c-form__helper-text">
                    ${t`Optionally set the 'FriendlyName' value of the Assertion attribute.`}
                </p>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal
                label=${t`Expression`}
                ?required=${true}
                name="expression">
                <ak-codemirror mode="python" value="${ifDefined(this.instance?.expression)}">
                </ak-codemirror>
                <p class="pf-c-form__helper-text">
                    ${t`Expression using Python.`}
                    <a target="_blank" href="https://goauthentik.io/docs/property-mappings/expression/">
                        ${t`See documentation for a list of all variables.`}
                    </a>
                </p>
            </ak-form-element-horizontal>
        </form>`;
    }

}
