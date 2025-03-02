import { css, CSSResult, customElement, html, LitElement, property, TemplateResult } from "lit-element";
import PFPage from "@patternfly/patternfly/components/Page/page.css";
import PFGlobal from "@patternfly/patternfly/patternfly-base.css";
import PFButton from "@patternfly/patternfly/components/Button/button.css";
import PFBase from "@patternfly/patternfly/patternfly-base.css";
import AKGlobal from "../../authentik.css";

import { configureSentry } from "../../api/Sentry";
import { CurrentTenant } from "authentik-api";
import { ifDefined } from "lit-html/directives/if-defined";
import { EVENT_SIDEBAR_TOGGLE } from "../../constants";
import { tenant } from "../../api/Config";

// If the viewport is wider than MIN_WIDTH, the sidebar
// is shown besides the content, and not overlayed.
export const MIN_WIDTH = 1200;

export const DefaultTenant: CurrentTenant = {
    brandingLogo: "/static/dist/assets/icons/icon_left_brand.svg",
    brandingFavicon: "/static/dist/assets/icons/icon.png",
    brandingTitle: "authentik",
    uiFooterLinks: [],
    matchedDomain: "",
};

@customElement("ak-sidebar-brand")
export class SidebarBrand extends LitElement {
    @property({attribute: false})
    tenant: CurrentTenant = DefaultTenant;

    static get styles(): CSSResult[] {
        return [
            PFBase,
            PFGlobal,
            PFPage,
            PFButton,
            AKGlobal,
            css`
                :host {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    height: 114px;
                    min-height: 114px;
                }
                .pf-c-brand img {
                    width: 100%;
                    padding: 0 .5rem;
                    height: 42px;
                }
                button.pf-c-button.sidebar-trigger {
                    background-color: transparent;
                    border-radius: 0px;
                    height: 100%;
                    color: var(--ak-dark-foreground);
                }
            `,
        ];
    }

    constructor() {
        super();
        window.addEventListener("resize", () => {
            this.requestUpdate();
        });
    }

    firstUpdated(): void {
        configureSentry(true);
        tenant().then(tenant => this.tenant = tenant);
    }

    render(): TemplateResult {
        return html`
            ${window.innerWidth <= MIN_WIDTH ? html`
                <button
                    class="sidebar-trigger pf-c-button"
                    @click=${() => {
                        this.dispatchEvent(
                            new CustomEvent(EVENT_SIDEBAR_TOGGLE, {
                                bubbles: true,
                                composed: true,
                            })
                        );
                    }}>
                    <i class="fas fa-bars"></i>
                </button>
            ` : html``}
            <a href="#/" class="pf-c-page__header-brand-link">
                <div class="pf-c-brand ak-brand">
                    <img src="${ifDefined(this.tenant.brandingLogo)}" alt="authentik icon" loading="lazy" />
                </div>
            </a>`;
    }
}
