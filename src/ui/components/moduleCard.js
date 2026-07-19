/************************************************
 * Facility OS
 * moduleCard.js
 *
 * Einheitliche kompakte App-Kachel
 * - genau ein Icon
 * - Route oder Aktion
 * - farbliche Varianten
 * - kopiersichere HTML-Ausgabe
 ************************************************/

/************************************************
 * BASISHELFER
 ************************************************/

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

/*
 * Die HTML-Zeichen werden absichtlich über
 * Zeichencodes erzeugt. Dadurch können sie beim
 * Kopieren auf dem Smartphone nicht umgewandelt
 * oder beschädigt werden.
 */
function escapeHtml(value) {

    const ampersand =
        String.fromCharCode(38);

    const replacements = {

        [ampersand]:
            `${ampersand}amp;`,

        "<":
            `${ampersand}lt;`,

        ">":
            `${ampersand}gt;`,

        '"':
            `${ampersand}quot;`,

        "'":
            `${ampersand}#039;`
    };

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            (character) =>
                replacements[
                    character
                ] ??
                character
        );
}

/************************************************
 * ICONS
 ************************************************/

function getIconSvg(iconName) {

    const icons = {

        clock:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="8.5"
                    ></circle>

                    <path
                        d="M12 7.5V12l3.2 2"
                    ></path>
                </svg>
            `,

        building:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <rect
                        x="4"
                        y="3.5"
                        width="16"
                        height="17"
                        rx="2"
                    ></rect>

                    <path
                        d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"
                    ></path>

                    <path
                        d="M10 20v-3h4v3"
                    ></path>
                </svg>
            `,

        tasks:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <rect
                        x="4"
                        y="3.5"
                        width="16"
                        height="17"
                        rx="2"
                    ></rect>

                    <path
                        d="m8 9 1.5 1.5L12 8"
                    ></path>

                    <path
                        d="m8 15 1.5 1.5L12 14"
                    ></path>

                    <path
                        d="M14 9h2.5M14 15h2.5"
                    ></path>
                </svg>
            `,

        message:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                    ></path>

                    <path
                        d="M7.5 9.5h9M7.5 13h6"
                    ></path>
                </svg>
            `,

        guide:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3Z"
                    ></path>

                    <path
                        d="M8 4.5v12.7"
                    ></path>

                    <path
                        d="M10.5 8h4M10.5 11h4"
                    ></path>
                </svg>
            `,

        material:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="m4 8 8-4 8 4-8 4Z"
                    ></path>

                    <path
                        d="M4 8v8l8 4 8-4V8"
                    ></path>

                    <path
                        d="M12 12v8"
                    ></path>
                </svg>
            `,

        calendar:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <rect
                        x="4"
                        y="5.5"
                        width="16"
                        height="14.5"
                        rx="2"
                    ></rect>

                    <path
                        d="M8 3.5v4M16 3.5v4M4 10h16"
                    ></path>

                    <path
                        d="M8 14h3M13 14h3M8 17h3"
                    ></path>
                </svg>
            `,

        help:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="9"
                    ></circle>

                    <path
                        d="M9.7 9a2.5 2.5 0 1 1 4.2 1.8c-1.1.8-1.9 1.3-1.9 2.7"
                    ></path>

                    <path
                        d="M12 17h.01"
                    ></path>
                </svg>
            `,

        more:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="5"
                        cy="12"
                        r="1.5"
                        fill="currentColor"
                        stroke="none"
                    ></circle>

                    <circle
                        cx="12"
                        cy="12"
                        r="1.5"
                        fill="currentColor"
                        stroke="none"
                    ></circle>

                    <circle
                        cx="19"
                        cy="12"
                        r="1.5"
                        fill="currentColor"
                        stroke="none"
                    ></circle>
                </svg>
            `
    };

    return (
        icons[
            normalizeText(
                iconName
            )
        ] ??
        icons.more
    );
}

/************************************************
 * HAUPTFUNKTION
 ************************************************/

export function renderModuleCard({
    title,
    description = "",
    icon = "more",
    tone = "blue",
    route = "",
    action = "",
    badge = "",
    disabled = false
} = {}) {

    const normalizedTitle =
        normalizeText(
            title
        ) ||
        "Funktion";

    const normalizedDescription =
        normalizeText(
            description
        );

    const normalizedTone =
        normalizeText(
            tone
        ) ||
        "blue";

    const normalizedRoute =
        normalizeText(
            route
        );

    const normalizedAction =
        normalizeText(
            action
        );

    const normalizedBadge =
        normalizeText(
            badge
        );

    const attributes = [];

    if (normalizedRoute) {

        attributes.push(
            `data-route="${escapeHtml(
                normalizedRoute
            )}"`
        );
    }

    if (normalizedAction) {

        attributes.push(
            `data-action="${escapeHtml(
                normalizedAction
            )}"`
        );
    }

    if (disabled) {

        attributes.push(
            "disabled"
        );

        attributes.push(
            'aria-disabled="true"'
        );
    }

    return `
        <button
            type="button"
            class="fo-module-card fo-module-card-${escapeHtml(
                normalizedTone
            )}"
            ${attributes.join(" ")}
        >
            <span class="fo-module-card-top">

                <span
                    class="fo-module-card-icon"
                    aria-hidden="true"
                >
                    ${getIconSvg(icon)}
                </span>

                ${
                    normalizedBadge
                        ? `
                            <span class="fo-module-card-badge">
                                ${escapeHtml(
                                    normalizedBadge
                                )}
                            </span>
                        `
                        : ""
                }

            </span>

            <span class="fo-module-card-copy">

                <strong class="fo-module-card-title">
                    ${escapeHtml(
                        normalizedTitle
                    )}
                </strong>

                ${
                    normalizedDescription
                        ? `
                            <span class="fo-module-card-description">
                                ${escapeHtml(
                                    normalizedDescription
                                )}
                            </span>
                        `
                        : ""
                }

            </span>

            <span
                class="fo-module-card-arrow"
                aria-hidden="true"
            >
                ›
            </span>
        </button>
    `;
}

/************************************************
 * KOMPATIBILITÄTS-EXPORTS
 *
 * Bestehende oder spätere Seiten können dieselbe
 * Komponente unter diesen Namen verwenden.
 ************************************************/

export function createModuleCard(options) {

    return renderModuleCard(
        options
    );
}

export function renderCompactModuleCard(options) {

    return renderModuleCard(
        options
    );
}