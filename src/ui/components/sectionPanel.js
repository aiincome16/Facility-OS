/************************************************
 * Facility OS
 * sectionPanel.js
 *
 * Gemeinsame Inhaltsbereiche
 * - kompakte Seitenabschnitte
 * - aufklappbare Gruppen
 * - Listen und Aktionszeilen
 * - konsistente Darstellung aller Module
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

function asArray(value) {

    return Array.isArray(value)
        ? value
        : [];
}

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function normalizeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

/************************************************
 * ERLAUBTE FARBEN
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
        "info",
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
 * ICONS
 ************************************************/

function getPanelIcon(icon) {

    const icons = {

        overview:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M4 19V9.5L12 4l8 5.5V19"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M8 19v-5h8v5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
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
                        cx="9"
                        cy="8"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M3.5 19c.5-3.4 2.5-5.2 5.5-5.2s5 1.8 5.5 5.2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <circle
                        cx="17"
                        cy="9"
                        r="2.2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
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
                        d="M4 8v8l8 4 8-4V8M12 12v8"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
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

        settings:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M19 13.5v-3l-2-.7a6 6 0 0 0-.8-1.8l.9-1.9-2.2-2.2-1.9.9a6 6 0 0 0-1.8-.8L10.5 2h-3l-.7 2a6 6 0 0 0-1.8.8l-1.9-.9L.9 6.1 1.8 8a6 6 0 0 0-.8 1.8l-2 .7v3l2 .7a6 6 0 0 0 .8 1.8l-.9 1.9 2.2 2.2 1.9-.9a6 6 0 0 0 1.8.8l.7 2h3l.7-2a6 6 0 0 0 1.8-.8l1.9.9 2.2-2.2-.9-1.9a6 6 0 0 0 .8-1.8Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        transform="translate(2 0)"
                    />
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
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M9.8 9a2.4 2.4 0 1 1 4.2 1.6c-.7.7-2 1.1-2 2.4"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M12 17h.01"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
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
 * SEITENTITEL
 ************************************************/

export function renderPageTitle({
    eyebrow = "",
    title,
    description = "",
    color = "neutral",
    backRoute = null,
    actionLabel = "",
    actionRoute = null,
    action = null,
    compact = false
}) {

    const normalizedColor =
        normalizeColor(color);

    return `
        <header
            class="
                app-page-title
                app-page-title-${escapeHtml(
                    normalizedColor
                )}
                ${compact
                    ? "app-page-title-compact"
                    : ""}
            "
        >

            ${
                backRoute
                    ? `
                        <button
                            type="button"
                            class="app-page-back-button"
                            data-route="${escapeHtml(
                                backRoute
                            )}"
                            aria-label="Zurück"
                        >
                            ‹
                        </button>
                    `
                    : ""
            }

            <div class="app-page-title-content">

                ${
                    normalizeText(
                        eyebrow
                    )
                        ? `
                            <span class="app-page-title-eyebrow">
                                ${escapeHtml(
                                    eyebrow
                                )}
                            </span>
                        `
                        : ""
                }

                <h1>
                    ${escapeHtml(
                        title
                    )}
                </h1>

                ${
                    normalizeText(
                        description
                    )
                        ? `
                            <p>
                                ${escapeHtml(
                                    description
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

            ${
                normalizeText(
                    actionLabel
                ) &&
                (
                    actionRoute ||
                    action
                )
                    ? `
                        <button
                            type="button"
                            class="app-page-title-action"
                            ${
                                actionRoute
                                    ? `data-route="${escapeHtml(
                                        actionRoute
                                    )}"`
                                    : ""
                            }
                            ${
                                action
                                    ? `data-action="${escapeHtml(
                                        action
                                    )}"`
                                    : ""
                            }
                        >
                            ${escapeHtml(
                                actionLabel
                            )}
                        </button>
                    `
                    : ""
            }

        </header>
    `;
}

/************************************************
 * ABSCHNITTSÜBERSCHRIFT
 ************************************************/

export function renderSectionHeader({
    title,
    description = "",
    count = null,
    actionLabel = "",
    actionRoute = null,
    action = null,
    compact = false
}) {

    return `
        <header
            class="
                app-section-header
                ${compact
                    ? "app-section-header-compact"
                    : ""}
            "
        >

            <div>

                <div class="app-section-header-title">

                    <h2>
                        ${escapeHtml(
                            title
                        )}
                    </h2>

                    ${
                        count !== null &&
                        count !== undefined
                            ? `
                                <span class="app-section-header-count">
                                    ${escapeHtml(
                                        count
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

                ${
                    normalizeText(
                        description
                    )
                        ? `
                            <p>
                                ${escapeHtml(
                                    description
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

            ${
                normalizeText(
                    actionLabel
                ) &&
                (
                    actionRoute ||
                    action
                )
                    ? `
                        <button
                            type="button"
                            class="app-section-header-action"
                            ${
                                actionRoute
                                    ? `data-route="${escapeHtml(
                                        actionRoute
                                    )}"`
                                    : ""
                            }
                            ${
                                action
                                    ? `data-action="${escapeHtml(
                                        action
                                    )}"`
                                    : ""
                            }
                        >
                            ${escapeHtml(
                                actionLabel
                            )}
                        </button>
                    `
                    : ""
            }

        </header>
    `;
}

/************************************************
 * EINFACHES PANEL
 ************************************************/

export function renderSectionPanel({
    title = "",
    description = "",
    icon = null,
    color = "neutral",
    content = "",
    count = null,
    route = null,
    action = null,
    actionLabel = "",
    highlighted = false,
    className = ""
}) {

    const normalizedColor =
        normalizeColor(color);

    const clickable =
        Boolean(
            route ||
            action
        );

    const tag =
        clickable
            ? "button"
            : "section";

    const typeAttribute =
        clickable
            ? 'type="button"'
            : "";

    return `
        <${tag}
            class="
                app-section-panel
                app-section-panel-${escapeHtml(
                    normalizedColor
                )}
                ${highlighted
                    ? "is-highlighted"
                    : ""}
                ${clickable
                    ? "is-clickable"
                    : ""}
                ${escapeHtml(
                    className
                )}
            "
            ${typeAttribute}
            ${
                route
                    ? `data-route="${escapeHtml(
                        route
                    )}"`
                    : ""
            }
            ${
                action
                    ? `data-action="${escapeHtml(
                        action
                    )}"`
                    : ""
            }
        >

            ${
                title
                    ? `
                        <header class="app-section-panel-header">

                            ${
                                icon
                                    ? `
                                        <span class="app-section-panel-icon">
                                            ${getPanelIcon(
                                                icon
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                            <div>

                                <strong>
                                    ${escapeHtml(
                                        title
                                    )}
                                </strong>

                                ${
                                    normalizeText(
                                        description
                                    )
                                        ? `
                                            <span>
                                                ${escapeHtml(
                                                    description
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                            ${
                                count !== null &&
                                count !== undefined
                                    ? `
                                        <span class="app-section-panel-count">
                                            ${escapeHtml(
                                                count
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                            ${
                                clickable
                                    ? `
                                        <span
                                            class="app-section-panel-arrow"
                                            aria-hidden="true"
                                        >
                                            ›
                                        </span>
                                    `
                                    : ""
                            }

                        </header>
                    `
                    : ""
            }

            ${
                content
                    ? `
                        <div class="app-section-panel-content">
                            ${content}
                        </div>
                    `
                    : ""
            }

            ${
                normalizeText(
                    actionLabel
                ) &&
                !clickable
                    ? `
                        <footer class="app-section-panel-footer">

                            <button
                                type="button"
                                class="app-section-panel-action"
                                ${
                                    route
                                        ? `data-route="${escapeHtml(
                                            route
                                        )}"`
                                        : ""
                                }
                                ${
                                    action
                                        ? `data-action="${escapeHtml(
                                            action
                                        )}"`
                                        : ""
                                }
                            >
                                ${escapeHtml(
                                    actionLabel
                                )}
                            </button>

                        </footer>
                    `
                    : ""
            }

        </${tag}>
    `;
}

/************************************************
 * AUFKLAPPBARES PANEL
 ************************************************/

export function renderCollapsiblePanel({
    title,
    description = "",
    icon = null,
    color = "neutral",
    content = "",
    count = null,
    open = false,
    className = ""
}) {

    const normalizedColor =
        normalizeColor(color);

    return `
        <details
            class="
                app-collapsible-panel
                app-collapsible-panel-${escapeHtml(
                    normalizedColor
                )}
                ${escapeHtml(
                    className
                )}
            "
            ${open ? "open" : ""}
        >

            <summary>

                ${
                    icon
                        ? `
                            <span class="app-collapsible-panel-icon">
                                ${getPanelIcon(
                                    icon
                                )}
                            </span>
                        `
                        : ""
                }

                <div class="app-collapsible-panel-heading">

                    <strong>
                        ${escapeHtml(
                            title
                        )}
                    </strong>

                    ${
                        normalizeText(
                            description
                        )
                            ? `
                                <span>
                                    ${escapeHtml(
                                        description
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

                ${
                    count !== null &&
                    count !== undefined
                        ? `
                            <span class="app-collapsible-panel-count">
                                ${escapeHtml(
                                    count
                                )}
                            </span>
                        `
                        : ""
                }

                <span
                    class="app-collapsible-panel-arrow"
                    aria-hidden="true"
                >
                    ›
                </span>

            </summary>

            <div class="app-collapsible-panel-content">
                ${content}
            </div>

        </details>
    `;
}

/************************************************
 * AKTIONSZEILE
 ************************************************/

export function renderActionRow({
    title,
    description = "",
    icon = "more",
    color = "neutral",
    route = null,
    action = null,
    value = null,
    badge = null,
    status = "",
    disabled = false,
    danger = false,
    className = ""
}) {

    const normalizedColor =
        danger
            ? "danger"
            : normalizeColor(color);

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
                app-action-row
                app-action-row-${escapeHtml(
                    normalizedColor
                )}
                ${disabled
                    ? "is-disabled"
                    : ""}
                ${danger
                    ? "is-danger"
                    : ""}
                ${escapeHtml(
                    className
                )}
            "
            ${
                route && !disabled
                    ? `data-route="${escapeHtml(
                        route
                    )}"`
                    : ""
            }
            ${
                action && !disabled
                    ? `data-action="${escapeHtml(
                        action
                    )}"`
                    : ""
            }
            ${
                disabled
                    ? 'disabled aria-disabled="true"'
                    : ""
            }
        >

            <span class="app-action-row-icon">
                ${getPanelIcon(
                    icon
                )}
            </span>

            <span class="app-action-row-content">

                <strong>
                    ${escapeHtml(
                        title
                    )}
                </strong>

                ${
                    normalizeText(
                        description
                    )
                        ? `
                            <span>
                                ${escapeHtml(
                                    description
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
                        <strong class="app-action-row-value">
                            ${escapeHtml(
                                value
                            )}
                        </strong>
                    `
                    : ""
            }

            ${
                normalizedBadge !== null &&
                normalizedBadge > 0
                    ? `
                        <span class="app-action-row-badge">
                            ${
                                normalizedBadge > 99
                                    ? "99+"
                                    : normalizedBadge
                            }
                        </span>
                    `
                    : ""
            }

            ${
                normalizeText(
                    status
                )
                    ? `
                        <span class="app-action-row-status">
                            ${escapeHtml(
                                status
                            )}
                        </span>
                    `
                    : ""
            }

            <span
                class="app-action-row-arrow"
                aria-hidden="true"
            >
                ›
            </span>

        </button>
    `;
}

/************************************************
 * AKTIONSLISTE
 ************************************************/

export function renderActionRows(
    rows,
    {
        className = ""
    } = {}
) {

    const items =
        asArray(rows);

    if (
        items.length === 0
    ) {

        return "";
    }

    return `
        <div
            class="
                app-action-row-list
                ${escapeHtml(
                    className
                )}
            "
        >

            ${items
                .map(
                    (row) =>
                        renderActionRow(
                            row
                        )
                )
                .join("")}

        </div>
    `;
}

/************************************************
 * INFOZEILE
 ************************************************/

export function renderInfoRow({
    label,
    value,
    status = "neutral",
    icon = null,
    emphasize = false,
    className = ""
}) {

    const normalizedStatus =
        normalizeColor(status);

    return `
        <div
            class="
                app-info-row
                app-info-row-${escapeHtml(
                    normalizedStatus
                )}
                ${emphasize
                    ? "is-emphasized"
                    : ""}
                ${escapeHtml(
                    className
                )}
            "
        >

            ${
                icon
                    ? `
                        <span class="app-info-row-icon">
                            ${getPanelIcon(
                                icon
                            )}
                        </span>
                    `
                    : ""
            }

            <span class="app-info-row-label">
                ${escapeHtml(
                    label
                )}
            </span>

            <strong class="app-info-row-value">
                ${escapeHtml(
                    value
                )}
            </strong>

        </div>
    `;
}

/************************************************
 * INFOLISTE
 ************************************************/

export function renderInfoList(
    items,
    {
        columns = 1,
        className = ""
    } = {}
) {

    const entries =
        asArray(items);

    if (
        entries.length === 0
    ) {

        return "";
    }

    const safeColumns =
        Math.min(
            Math.max(
                normalizeNumber(
                    columns,
                    1
                ),
                1
            ),
            4
        );

    return `
        <div
            class="
                app-info-list
                app-info-list-${safeColumns}
                ${escapeHtml(
                    className
                )}
            "
        >

            ${entries
                .map(
                    (item) =>
                        renderInfoRow(
                            item
                        )
                )
                .join("")}

        </div>
    `;
}

/************************************************
 * LEERZUSTAND
 ************************************************/

export function renderEmptyState({
    title = "Keine Einträge",
    description = "Für diesen Bereich sind derzeit keine Daten vorhanden.",
    icon = "info",
    color = "neutral",
    actionLabel = "",
    actionRoute = null,
    action = null,
    compact = false
}) {

    const normalizedColor =
        normalizeColor(color);

    return `
        <section
            class="
                app-empty-state
                app-empty-state-${escapeHtml(
                    normalizedColor
                )}
                ${compact
                    ? "app-empty-state-compact"
                    : ""}
            "
        >

            <span class="app-empty-state-icon">
                ${getPanelIcon(
                    icon
                )}
            </span>

            <strong>
                ${escapeHtml(
                    title
                )}
            </strong>

            <p>
                ${escapeHtml(
                    description
                )}
            </p>

            ${
                normalizeText(
                    actionLabel
                ) &&
                (
                    actionRoute ||
                    action
                )
                    ? `
                        <button
                            type="button"
                            class="app-empty-state-action"
                            ${
                                actionRoute
                                    ? `data-route="${escapeHtml(
                                        actionRoute
                                    )}"`
                                    : ""
                            }
                            ${
                                action
                                    ? `data-action="${escapeHtml(
                                        action
                                    )}"`
                                    : ""
                            }
                        >
                            ${escapeHtml(
                                actionLabel
                            )}
                        </button>
                    `
                    : ""
            }

        </section>
    `;
}

/************************************************
 * TEXTBLOCK
 ************************************************/

export function renderTextBlock({
    title = "",
    text = "",
    color = "neutral",
    icon = null,
    className = ""
}) {

    const normalizedColor =
        normalizeColor(color);

    return `
        <article
            class="
                app-text-block
                app-text-block-${escapeHtml(
                    normalizedColor
                )}
                ${escapeHtml(
                    className
                )}
            "
        >

            ${
                icon
                    ? `
                        <span class="app-text-block-icon">
                            ${getPanelIcon(
                                icon
                            )}
                        </span>
                    `
                    : ""
            }

            <div>

                ${
                    normalizeText(
                        title
                    )
                        ? `
                            <strong>
                                ${escapeHtml(
                                    title
                                )}
                            </strong>
                        `
                        : ""
                }

                <p>
                    ${escapeHtml(
                        text
                    )}
                </p>

            </div>

        </article>
    `;
}