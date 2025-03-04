import { t } from "@lingui/macro";
import { CSSResult, customElement, html, LitElement, property, TemplateResult } from "lit-element";

import "../../elements/Tabs";
import "../../elements/charts/ApplicationAuthorizeChart";
import "../../elements/buttons/SpinnerButton";
import "../../elements/EmptyState";
import "../../elements/events/ObjectChangelog";
import "../policies/BoundPoliciesList";
import "./ApplicationForm";
import "./ApplicationCheckAccessForm";
import "../../elements/PageHeader";
import { Application, CoreApi } from "authentik-api";
import { DEFAULT_CONFIG } from "../../api/Config";
import PFPage from "@patternfly/patternfly/components/Page/page.css";
import PFContent from "@patternfly/patternfly/components/Content/content.css";
import PFGallery from "@patternfly/patternfly/layouts/Gallery/gallery.css";
import PFCard from "@patternfly/patternfly/components/Card/card.css";
import PFBase from "@patternfly/patternfly/patternfly-base.css";
import PFButton from "@patternfly/patternfly/components/Button/button.css";
import PFDescriptionList from "@patternfly/patternfly/components/DescriptionList/description-list.css";
import AKGlobal from "../../authentik.css";
import { ifDefined } from "lit-html/directives/if-defined";

@customElement("ak-application-view")
export class ApplicationViewPage extends LitElement {

    @property()
    set applicationSlug(value: string) {
        new CoreApi(DEFAULT_CONFIG).coreApplicationsRetrieve({
            slug: value
        }).then((app) => {
            this.application = app;
        });
    }

    @property({attribute: false})
    application!: Application;

    static get styles(): CSSResult[] {
        return [PFBase, PFPage, PFContent, PFButton, PFDescriptionList, PFGallery, PFCard, AKGlobal];
    }

    render(): TemplateResult {
        return html`<ak-page-header
                icon=${this.application?.metaIcon || ""}
                header=${this.application?.name || t`Loading`}
                description=${ifDefined(this.application?.metaPublisher)}
                .iconImage=${true}>
            </ak-page-header>
            ${this.renderApp()}`;
    }

    renderApp(): TemplateResult {
        if (!this.application) {
            return html`<ak-empty-state
                ?loading="${true}"
                header=${t`Loading`}>
            </ak-empty-state>`;
        }
        return html`
            <ak-tabs>
                <section slot="page-overview" data-tab-title="${t`Overview`}" class="pf-c-page__main-section pf-m-no-padding-mobile">
                    <div class="pf-l-gallery pf-m-gutter">
                        <div class="pf-c-card pf-l-gallery__item">
                            <div class="pf-c-card__title">${t`Related`}</div>
                            <div class="pf-c-card__body">
                                <dl class="pf-c-description-list">
                                    ${this.application.providerObj ?
                                    html`<div class="pf-c-description-list__group">
                                            <dt class="pf-c-description-list__term">
                                                <span class="pf-c-description-list__text">${t`Provider`}</span>
                                            </dt>
                                            <dd class="pf-c-description-list__description">
                                                <div class="pf-c-description-list__text">
                                                    <a href="#/core/providers/${this.application.providerObj?.pk}">
                                                        ${this.application.providerObj?.name}
                                                    </a>
                                                </div>
                                            </dd>
                                        </div>`:
                                    html``}
                                    <div class="pf-c-description-list__group">
                                        <dt class="pf-c-description-list__term">
                                            <span class="pf-c-description-list__text">${t`Policy engine mode`}</span>
                                        </dt>
                                        <dd class="pf-c-description-list__description">
                                            <div class="pf-c-description-list__text">
                                                ${this.application.policyEngineMode?.toUpperCase()}
                                            </div>
                                        </dd>
                                    </div>
                                    <div class="pf-c-description-list__group">
                                        <dt class="pf-c-description-list__term">
                                            <span class="pf-c-description-list__text">${t`Edit`}</span>
                                        </dt>
                                        <dd class="pf-c-description-list__description">
                                            <div class="pf-c-description-list__text">
                                                <ak-forms-modal>
                                                    <span slot="submit">
                                                        ${t`Update`}
                                                    </span>
                                                    <span slot="header">
                                                        ${t`Update Application`}
                                                    </span>
                                                    <ak-application-form slot="form" .instancePk=${this.application.slug}>
                                                    </ak-application-form>
                                                    <button slot="trigger" class="pf-c-button pf-m-secondary">
                                                        ${t`Edit`}
                                                    </button>
                                                </ak-forms-modal>
                                            </div>
                                        </dd>
                                    </div>
                                    <div class="pf-c-description-list__group">
                                        <dt class="pf-c-description-list__term">
                                            <span class="pf-c-description-list__text">${t`Check access`}</span>
                                        </dt>
                                        <dd class="pf-c-description-list__description">
                                            <div class="pf-c-description-list__text">
                                                <ak-forms-modal .closeAfterSuccessfulSubmit=${false}>
                                                    <span slot="submit">
                                                        ${t`Check`}
                                                    </span>
                                                    <span slot="header">
                                                        ${t`Check Application access`}
                                                    </span>
                                                    <ak-application-check-access-form slot="form" .application=${this.application}>
                                                    </ak-application-check-access-form>
                                                    <button slot="trigger" class="pf-c-button pf-m-secondary">
                                                        ${t`Test`}
                                                    </button>
                                                </ak-forms-modal>
                                            </div>
                                        </dd>
                                    </div>
                                    ${this.application.launchUrl ?
                                        html`<div class="pf-c-description-list__group">
                                            <dt class="pf-c-description-list__term">
                                                <span class="pf-c-description-list__text">${t`Launch`}</span>
                                            </dt>
                                            <dd class="pf-c-description-list__description">
                                                <div class="pf-c-description-list__text">
                                                    <a target="_blank" href=${this.application.launchUrl} slot="trigger" class="pf-c-button pf-m-secondary">
                                                        ${t`Launch`}
                                                    </a>
                                                </div>
                                            </dd>
                                        </div>`: html``}
                                </dl>
                            </div>
                        </div>
                        <div class="pf-c-card pf-l-gallery__item" style="grid-column-end: span 4;grid-row-end: span 2;">
                            <div class="pf-c-card__title">${t`Logins over the last 24 hours`}</div>
                            <div class="pf-c-card__body">
                                ${this.application && html`
                                    <ak-charts-application-authorize applicationSlug=${this.application.slug}>
                                    </ak-charts-application-authorize>`}
                            </div>
                        </div>
                        <div class="pf-c-card pf-l-gallery__item" style="grid-column-end: span 5;grid-row-end: span 3;">
                            <div class="pf-c-card__title">${t`Changelog`}</div>
                            <div class="pf-c-card__body">
                                <ak-object-changelog
                                    targetModelPk=${this.application.pk || ""}
                                    targetModelApp="authentik_core"
                                    targetModelName="application">
                                </ak-object-changelog>
                            </div>
                        </div>
                    </div>
                </section>
                <div slot="page-policy-bindings" data-tab-title="${t`Policy / Group / User Bindings`}" class="pf-c-page__main-section pf-m-no-padding-mobile">
                    <div class="pf-c-card">
                        <div class="pf-c-card__title">${t`These policies control which users can access this application.`}</div>
                        <ak-bound-policies-list .target=${this.application.pk}>
                        </ak-bound-policies-list>
                    </div>
                </div>
            </ak-tabs>`;
    }
}
