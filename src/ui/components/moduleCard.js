/************************************************
 * Facility OS
 * moduleCard.js
 *
 * Stabile, kompakte Modulkachel
 * - ein Icon je Kachel
 * - Route oder Aktion
 * - kompatible Exports
 ************************************************/

/************************************************
 * BASISHELFER
 ************************************************/

function normalizeText(value) {
    return String(value ?? "").trim();
}

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/************************************************
 * ICONS
 ************************************************/

function renderIcon(name) {
    const icons = {
        clock: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5"></circle>
                <path d="M12 7.5V12l3.2 2"></path>
            </svg>
        `,

        building: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="3.5" width="16" height="17" rx="2"></rect>
                <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"></path>
                <path d="M10 20v-3h4v3"></path>
            </svg>
        `,

        tasks: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="3.5" width="16" height="17" rx="2"></rect>
                <path d="m8 9 1.5 1.5L12 8"></path>
                <path d="m8 15 1.5 1.5L12 14"></path>
                <path d="M14 9h2.5M14 15h2.5"></path>
            </svg>
        `,

        message: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"></path>
                <path d="M7.5 9.5h9M7.5 13h6"></path>
            </svg>
        `,

        guide: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3Z"></path>
                <path d="M8 4.5v12.7"></path>
                <path d="M10.5 8h4M10.5 11h4"></path>
            </svg>
        `,

        material: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m4 8 8-4 8 4-8 4Z"></path>
                <path d="M4 8v8l8 4 8-4V8"></path>
                <path d="M12 12v8"></path>
            </svg>
        `,

        calendar: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="5.5" width="16" height="14.5" rx="2"></rect>
                <path d="M8 3.5v4M16 3.5v4M4 10h16"></path>
                <path d="M8 14h3M13 14h3M8 17h3"></path>
            </svg>
        `,

        help: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M9.7 9a2.5 2.5 0 1 1 4.2 1.8c-1.1.8-1.9 1.3-1.9 2.7"></path>
                <path d="M12 17h.01"></path>
            </svg>
        `,

        more: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
                <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"></circle>
            </svg>
        `
    };

    return icons[normalizeText(name)] || icons.more;
}

/************************************************
 * HAUPTFUNKTION
 ************************************************/

export function renderModuleCard(options = {}) {
    const title =
        normalizeText(options.title) ||
        "Funktion";

    const description =
        normalizeText(options.description);

    const icon =
        normalizeText(options.icon) ||
        "more";

    const tone =
        normalizeText(options.tone) ||
        "blue";

    const route =
        normalizeText(options.route);

    const action =
        normalizeText(options.action);

    const badge =
        normalizeText(options.badge);

    const disabled =
        options.disabled === true;

    const interactionAttribute =
        route
            ? `data-route="${escapeHtml(route)}"`
            : action
                ? `data-action="${escapeHtml(action)}"`
                : "";

    return `
        <button
            type="button"
            class="fo-module-card fo-module-card-${escapeHtml(tone)}"
            ${interactionAttribute}
            ${disabled ? "disabled" : ""}
        >
            <span class="fo-module-card-top">

                <span class="fo-module-card-icon">
                    ${renderIcon(icon)}
                </span>

                ${
                    badge
                        ? `
                            <span class="fo-module-card-badge">
                                ${escapeHtml(badge)}
                            </span>
                        `
                        : ""
                }

            </span>

            <span class="fo-module-card-copy">

                <strong class="fo-module-card-title">
                    ${escapeHtml(title)}
                </strong>

                ${
                    description
                        ? `
                            <span class="fo-module-card-description">
                                ${escapeHtml(description)}
                            </span>
                        `
                        : ""
                }

            </span>

            <span class="fo-module-card-arrow" aria-hidden="true">
                ›
            </span>
        </button>
    `;
}

/************************************************
 * KOMPATIBILITÄTS-EXPORTS
 ************************************************/

export function createModuleCard(options = {}) {
    return renderModuleCard(options);
}

export function renderCompactModuleCard(options = {}) {
    return renderModuleCard(options);
}