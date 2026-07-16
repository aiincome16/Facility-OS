/************************************************
 * Facility OS
 * moduleCard.js
 *
 * Visuelle Hauptmodulkarten
 * - große farbige App-Bereiche
 * - klare Symbole
 * - wenig Text
 * - Status und Warnungen
 * - für Smartphone-Präsentation optimiert
 ************************************************/

/************************************************
 * HTML-SICHERHEIT
 ************************************************/

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/************************************************
 * BASISHELFER
 ************************************************/

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function normalizeNumber(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}

/************************************************
 * MODULFARBEN
 ************************************************/

const ALLOWED_COLORS =
    Object.freeze([
        "overview",
        "objects",
        "personnel",
        "communication",
        "materials",
        "tasks",
        "times",
        "analysis",
        "reports",
        "more",
        "success",
        "warning",
        "danger",
        "neutral"
    ]);

function normalizeColor(value) {

    const color =
        normalizeText(value)
            .toLowerCase();

    return ALLOWED_COLORS.includes(
        color
    )
        ? color
        : "neutral";
}

/************************************************
 * MODULSYMBOLE
 ************************************************/

function getModuleIcon(icon) {

    const icons = {

        overview:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M3.5 11.2 12 4l8.5 7.2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.9"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M5.5 10.5V20h13v-9.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.9"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M9.5 20v-5.5h5V20"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.9"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        objects:
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
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M10 20v-3h4v3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        personnel:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="8.5"
                        cy="8"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M3 19c.6-3.5 2.6-5.3 5.5-5.3S13.4 15.5 14 19"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <circle
                        cx="17"
                        cy="9"
                        r="2.3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                    />

                    <path
                        d="M15.5 14.5c2.8.1 4.5 1.6 5 4.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        communication:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M7.5 9.5h9M7.5 13h6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        materials:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="m4 8 8-4 8 4-8 4Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M4 8v8l8 4 8-4V8"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M12 12v8"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />
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
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9h2.5M14 15h2.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        times:
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
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M12 7.5V12l3.2 2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        reports:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M6 3.5h8l4 4V20H6Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M14 3.5V8h4M9 12h6M9 15.5h6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        analysis:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M5 20V10M12 20V4M19 20v-7"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />

                    <path
                        d="M3.5 20.5h17"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    />
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
                        r="1.6"
                        fill="currentColor"
                    />

                    <circle
                        cx="12"
                        cy="12"
                        r="1.6"
                        fill="currentColor"
                    />

                    <circle
                        cx="19"
                        cy="12"
                        r="1.6"
                        fill="currentColor"
                    />
                </svg>
            `,

        warning:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M12 3.5 21 20H3Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M12 9v5M12 17.5h.01"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        success:
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
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="m8 12 2.5 2.5L16 9"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        danger:
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
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M9 9l6 6M15 9l-6 6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
            `
    };

    const normalizedIcon =
        normalizeText(icon)
            .toLowerCase();

    return (
        icons[normalizedIcon] ??
        icons.more
    );
}

/************************************************
 * STATUS-BADGE
 ************************************************/

function renderStatusBadge({
    label,
    status = "neutral"
}) {

    if (
        !normalizeText(label)
    ) {

        return "";
    }

    return `
        <span
            class="app-module-card-status app-module-card-status-${escapeHtml(
                normalizeColor(status)
            )}"
        >
            ${escapeHtml(label)}
        </span>
    `;
}

/************************************************
 * KENNZAHL
 ************************************************/

function renderValue({
    value,
    valueLabel
}) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";
    }

    return `
        <div class="app-module-card-value">

            <strong>
                ${escapeHtml(value)}
            </strong>

            ${
                normalizeText(
                    valueLabel
                )
                    ? `
                        <span>
                            ${escapeHtml(
                                valueLabel
                            )}
                        </span>
                    `
                    : ""
            }

        </div>
    `;
}

/************************************************
 * EINZELNE MODULKARTE
 ************************************************/

export function renderModuleCard({
    title,
    subtitle = "",
    icon = "more",
    color = "neutral",
    route = null,
    action = null,
    value = null,
    valueLabel = "",
    statusLabel = "",
    status = "neutral",
    badge = null,
    large = false,
    disabled = false,
    className = ""
}) {

    const normalizedTitle =
        normalizeText(title) ||
        "Modul";

    const normalizedColor =
        normalizeColor(color);

    const routeAttribute =
        route && !disabled
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    const actionAttribute =
        action && !disabled
            ? `data-action="${escapeHtml(
                action
            )}"`
            : "";

    const disabledAttribute =
        disabled
            ? "disabled aria-disabled=\"true\""
            : "";

    const normalizedBadge =
        badge === null ||
        badge === undefined
            ? null
            : normalizeNumber(
                badge
            );

    return `
        <button
            type="button"
            class="
                app-module-card
                app-module-card-${escapeHtml(
                    normalizedColor
                )}
                ${large
                    ? "app-module-card-large"
                    : ""}
                ${disabled
                    ? "is-disabled"
                    : ""}
                ${escapeHtml(
                    className
                )}
            "
            ${routeAttribute}
            ${actionAttribute}
            ${disabledAttribute}
            aria-label="${escapeHtml(
                normalizedTitle
            )}"
        >

            <span class="app-module-card-background-icon">

                ${getModuleIcon(
                    icon
                )}

            </span>

            <span class="app-module-card-top">

                <span class="app-module-card-icon">

                    ${getModuleIcon(
                        icon
                    )}

                </span>

                ${
                    normalizedBadge !== null &&
                    normalizedBadge > 0
                        ? `
                            <span class="app-module-card-badge">

                                ${
                                    normalizedBadge > 99
                                        ? "99+"
                                        : normalizedBadge
                                }

                            </span>
                        `
                        : renderStatusBadge({
                            label:
                                statusLabel,

                            status
                        })
                }

            </span>

            <span class="app-module-card-content">

                <strong class="app-module-card-title">
                    ${escapeHtml(
                        normalizedTitle
                    )}
                </strong>

                ${
                    normalizeText(
                        subtitle
                    )
                        ? `
                            <span class="app-module-card-subtitle">
                                ${escapeHtml(
                                    subtitle
                                )}
                            </span>
                        `
                        : ""
                }

            </span>

            ${renderValue({
                value,
                valueLabel
            })}

            <span
                class="app-module-card-arrow"
                aria-hidden="true"
            >
                ›
            </span>

        </button>
    `;
}

/************************************************
 * MODULGITTER
 ************************************************/

export function renderModuleGrid(
    modules,
    {
        columns = 2,
        className = ""
    } = {}
) {

    const moduleItems =
        Array.isArray(modules)
            ? modules
            : [];

    if (
        moduleItems.length === 0
    ) {

        return "";
    }

    const safeColumns =
        Math.min(
            Math.max(
                normalizeNumber(
                    columns
                ),
                1
            ),
            4
        );

    return `
        <section
            class="
                app-module-grid
                app-module-grid-${safeColumns}
                ${escapeHtml(
                    className
                )}
            "
        >

            ${moduleItems
                .map(
                    (module) =>
                        renderModuleCard(
                            module
                        )
                )
                .join("")}

        </section>
    `;
}

/************************************************
 * KOMPAKTE MODULZEILE
 ************************************************/

export function renderCompactModuleCard({
    title,
    subtitle = "",
    icon = "more",
    color = "neutral",
    route = null,
    action = null,
    value = null,
    statusLabel = "",
    status = "neutral",
    disabled = false
}) {

    const normalizedColor =
        normalizeColor(color);

    const routeAttribute =
        route && !disabled
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    const actionAttribute =
        action && !disabled
            ? `data-action="${escapeHtml(
                action
            )}"`
            : "";

    const disabledAttribute =
        disabled
            ? "disabled aria-disabled=\"true\""
            : "";

    return `
        <button
            type="button"
            class="
                app-compact-module-card
                app-compact-module-card-${escapeHtml(
                    normalizedColor
                )}
                ${disabled
                    ? "is-disabled"
                    : ""}
            "
            ${routeAttribute}
            ${actionAttribute}
            ${disabledAttribute}
        >

            <span class="app-compact-module-icon">

                ${getModuleIcon(
                    icon
                )}

            </span>

            <span class="app-compact-module-content">

                <strong>
                    ${escapeHtml(
                        title
                    )}
                </strong>

                ${
                    normalizeText(
                        subtitle
                    )
                        ? `
                            <span>
                                ${escapeHtml(
                                    subtitle
                                )}
                            </span>
                        `
                        : ""
                }

            </span>

            ${
                value !== null &&
                value !== undefined &&
                value !== ""
                    ? `
                        <strong class="app-compact-module-value">
                            ${escapeHtml(
                                value
                            )}
                        </strong>
                    `
                    : renderStatusBadge({
                        label:
                            statusLabel,

                        status
                    })
            }

            <span
                class="app-compact-module-arrow"
                aria-hidden="true"
            >
                ›
            </span>

        </button>
    `;
}

/************************************************
 * KOMPAKTE MODULLISTE
 ************************************************/

export function renderCompactModuleList(
    modules,
    {
        className = ""
    } = {}
) {

    const moduleItems =
        Array.isArray(modules)
            ? modules
            : [];

    if (
        moduleItems.length === 0
    ) {

        return "";
    }

    return `
        <section
            class="
                app-compact-module-list
                ${escapeHtml(
                    className
                )}
            "
        >

            ${moduleItems
                .map(
                    (module) =>
                        renderCompactModuleCard(
                            module
                        )
                )
                .join("")}

        </section>
    `;
}