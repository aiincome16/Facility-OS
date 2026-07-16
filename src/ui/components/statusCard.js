/************************************************
 * Facility OS
 * statusCard.js
 *
 * Gemeinsame Status- und Hinweisflächen
 * - Tagesstatus
 * - Warnungen
 * - Kennzahlen
 * - Fortschritt
 * - kompakte Präsentationsansicht
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

function clamp(
    value,
    minimum,
    maximum
) {

    return Math.min(
        Math.max(
            value,
            minimum
        ),
        maximum
    );
}

/************************************************
 * STATUSWERTE
 ************************************************/

const ALLOWED_STATUSES =
    Object.freeze([
        "neutral",
        "info",
        "success",
        "warning",
        "danger",
        "objects",
        "personnel",
        "communication",
        "materials",
        "tasks",
        "times",
        "analysis",
        "reports",
        "more"
    ]);

function normalizeStatus(value) {

    const status =
        normalizeText(value)
            .toLowerCase();

    return ALLOWED_STATUSES.includes(
        status
    )
        ? status
        : "neutral";
}

/************************************************
 * STATUSSYMBOLE
 ************************************************/

function getStatusIcon(icon) {

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
            `,

        info:
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
                        d="M12 10.5V17M12 7.5h.01"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        neutral:
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
                        d="M8 12h8"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
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
        icons.neutral
    );
}

/************************************************
 * STATUSKARTE
 ************************************************/

export function renderStatusCard({
    title,
    value = null,
    description = "",
    status = "neutral",
    icon = null,
    route = null,
    action = null,
    badge = null,
    compact = false,
    className = ""
}) {

    const normalizedStatus =
        normalizeStatus(status);

    const normalizedTitle =
        normalizeText(title) ||
        "Status";

    const selectedIcon =
        icon ??
        normalizedStatus;

    const routeAttribute =
        route
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    const actionAttribute =
        action
            ? `data-action="${escapeHtml(
                action
            )}"`
            : "";

    const clickable =
        Boolean(
            route ||
            action
        );

    const tag =
        clickable
            ? "button"
            : "article";

    const typeAttribute =
        clickable
            ? 'type="button"'
            : "";

    const normalizedBadge =
        badge === null ||
        badge === undefined
            ? null
            : normalizeNumber(
                badge
            );

    return `
        <${tag}
            class="
                app-status-card
                app-status-card-${escapeHtml(
                    normalizedStatus
                )}
                ${compact
                    ? "app-status-card-compact"
                    : ""}
                ${clickable
                    ? "is-clickable"
                    : ""}
                ${escapeHtml(
                    className
                )}
            "
            ${typeAttribute}
            ${routeAttribute}
            ${actionAttribute}
        >

            <span class="app-status-card-icon">

                ${getStatusIcon(
                    selectedIcon
                )}

            </span>

            <span class="app-status-card-content">

                <span class="app-status-card-title">
                    ${escapeHtml(
                        normalizedTitle
                    )}
                </span>

                ${
                    value !== null &&
                    value !== undefined &&
                    value !== ""
                        ? `
                            <strong class="app-status-card-value">
                                ${escapeHtml(
                                    value
                                )}
                            </strong>
                        `
                        : ""
                }

                ${
                    normalizeText(
                        description
                    )
                        ? `
                            <span class="app-status-card-description">
                                ${escapeHtml(
                                    description
                                )}
                            </span>
                        `
                        : ""
                }

            </span>

            ${
                normalizedBadge !== null &&
                normalizedBadge > 0
                    ? `
                        <span class="app-status-card-badge">
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
                clickable
                    ? `
                        <span
                            class="app-status-card-arrow"
                            aria-hidden="true"
                        >
                            ›
                        </span>
                    `
                    : ""
            }

        </${tag}>
    `;
}

/************************************************
 * STATUSGITTER
 ************************************************/

export function renderStatusGrid(
    cards,
    {
        columns = 2,
        compact = false,
        className = ""
    } = {}
) {

    const cardItems =
        Array.isArray(cards)
            ? cards
            : [];

    if (
        cardItems.length === 0
    ) {

        return "";
    }

    const safeColumns =
        clamp(
            normalizeNumber(
                columns,
                2
            ),
            1,
            4
        );

    return `
        <section
            class="
                app-status-grid
                app-status-grid-${safeColumns}
                ${compact
                    ? "app-status-grid-compact"
                    : ""}
                ${escapeHtml(
                    className
                )}
            "
        >

            ${cardItems
                .map(
                    (card) =>
                        renderStatusCard({
                            ...card,

                            compact:
                                card.compact ??
                                compact
                        })
                )
                .join("")}

        </section>
    `;
}

/************************************************
 * HINWEISKARTE
 ************************************************/

export function renderAlertCard({
    title,
    message,
    status = "info",
    icon = null,
    route = null,
    action = null,
    buttonLabel = "",
    dismissible = false,
    alertId = null,
    className = ""
}) {

    const normalizedStatus =
        normalizeStatus(status);

    const normalizedTitle =
        normalizeText(title) ||
        "Hinweis";

    const selectedIcon =
        icon ??
        normalizedStatus;

    const routeAttribute =
        route
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    const actionAttribute =
        action
            ? `data-action="${escapeHtml(
                action
            )}"`
            : "";

    const alertIdAttribute =
        alertId
            ? `data-alert-id="${escapeHtml(
                alertId
            )}"`
            : "";

    return `
        <article
            class="
                app-alert-card
                app-alert-card-${escapeHtml(
                    normalizedStatus
                )}
                ${escapeHtml(
                    className
                )}
            "
            ${alertIdAttribute}
        >

            <span class="app-alert-card-icon">

                ${getStatusIcon(
                    selectedIcon
                )}

            </span>

            <div class="app-alert-card-content">

                <strong>
                    ${escapeHtml(
                        normalizedTitle
                    )}
                </strong>

                <p>
                    ${escapeHtml(
                        message
                    )}
                </p>

                ${
                    route ||
                    action
                        ? `
                            <button
                                type="button"
                                class="app-alert-card-action"
                                ${routeAttribute}
                                ${actionAttribute}
                            >
                                ${escapeHtml(
                                    buttonLabel ||
                                    "Öffnen"
                                )}
                            </button>
                        `
                        : ""
                }

            </div>

            ${
                dismissible
                    ? `
                        <button
                            type="button"
                            class="app-alert-card-dismiss"
                            data-action="dismiss-alert"
                            ${alertIdAttribute}
                            aria-label="Hinweis schließen"
                        >
                            ×
                        </button>
                    `
                    : ""
            }

        </article>
    `;
}

/************************************************
 * HINWEISLISTE
 ************************************************/

export function renderAlertList(
    alerts,
    {
        maximum = 3,
        className = ""
    } = {}
) {

    const alertItems =
        Array.isArray(alerts)
            ? alerts
            : [];

    if (
        alertItems.length === 0
    ) {

        return "";
    }

    const safeMaximum =
        Math.max(
            normalizeNumber(
                maximum,
                3
            ),
            1
        );

    return `
        <section
            class="
                app-alert-list
                ${escapeHtml(
                    className
                )}
            "
        >

            ${alertItems
                .slice(
                    0,
                    safeMaximum
                )
                .map(
                    (alert) =>
                        renderAlertCard(
                            alert
                        )
                )
                .join("")}

        </section>
    `;
}

/************************************************
 * FORTSCHRITTSKARTE
 ************************************************/

export function renderProgressCard({
    title,
    current = 0,
    total = 0,
    description = "",
    status = "tasks",
    route = null,
    action = null,
    showPercentage = true,
    className = ""
}) {

    const normalizedStatus =
        normalizeStatus(status);

    const currentValue =
        Math.max(
            normalizeNumber(
                current
            ),
            0
        );

    const totalValue =
        Math.max(
            normalizeNumber(
                total
            ),
            0
        );

    const percentage =
        totalValue > 0
            ? clamp(
                Math.round(
                    (
                        currentValue /
                        totalValue
                    ) *
                    100
                ),
                0,
                100
            )
            : 0;

    const routeAttribute =
        route
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    const actionAttribute =
        action
            ? `data-action="${escapeHtml(
                action
            )}"`
            : "";

    const clickable =
        Boolean(
            route ||
            action
        );

    const tag =
        clickable
            ? "button"
            : "article";

    const typeAttribute =
        clickable
            ? 'type="button"'
            : "";

    return `
        <${tag}
            class="
                app-progress-card
                app-progress-card-${escapeHtml(
                    normalizedStatus
                )}
                ${clickable
                    ? "is-clickable"
                    : ""}
                ${escapeHtml(
                    className
                )}
            "
            ${typeAttribute}
            ${routeAttribute}
            ${actionAttribute}
        >

            <div class="app-progress-card-header">

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

                <div class="app-progress-card-value">

                    <strong>
                        ${escapeHtml(
                            currentValue
                        )}
                    </strong>

                    <span>
                        von
                        ${escapeHtml(
                            totalValue
                        )}
                    </span>

                </div>

            </div>

            <div
                class="app-progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${percentage}"
                aria-label="${escapeHtml(
                    title
                )}"
            >

                <span
                    class="app-progress-value"
                    style="width: ${percentage}%"
                ></span>

            </div>

            ${
                showPercentage
                    ? `
                        <span class="app-progress-percentage">
                            ${percentage} %
                        </span>
                    `
                    : ""
            }

        </${tag}>
    `;
}

/************************************************
 * TAGESSTATUS
 ************************************************/

export function renderDailyStatus({
    title = "Tagesstatus",
    subtitle = "",
    items = [],
    route = null,
    className = ""
}) {

    const statusItems =
        Array.isArray(items)
            ? items
            : [];

    const routeAttribute =
        route
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    const tag =
        route
            ? "button"
            : "section";

    const typeAttribute =
        route
            ? 'type="button"'
            : "";

    return `
        <${tag}
            class="
                app-daily-status
                ${route
                    ? "is-clickable"
                    : ""}
                ${escapeHtml(
                    className
                )}
            "
            ${typeAttribute}
            ${routeAttribute}
        >

            <div class="app-daily-status-header">

                <div>

                    <span class="app-daily-status-label">
                        Heute
                    </span>

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
                                <span class="app-daily-status-subtitle">
                                    ${escapeHtml(
                                        subtitle
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

                ${
                    route
                        ? `
                            <span
                                class="app-daily-status-arrow"
                                aria-hidden="true"
                            >
                                ›
                            </span>
                        `
                        : ""
                }

            </div>

            ${
                statusItems.length > 0
                    ? `
                        <div class="app-daily-status-items">

                            ${statusItems
                                .slice(0, 4)
                                .map(
                                    (item) => {

                                        const status =
                                            normalizeStatus(
                                                item.status
                                            );

                                        return `
                                            <div
                                                class="
                                                    app-daily-status-item
                                                    app-daily-status-item-${escapeHtml(
                                                        status
                                                    )}
                                                "
                                            >

                                                <span>
                                                    ${escapeHtml(
                                                        item.label
                                                    )}
                                                </span>

                                                <strong>
                                                    ${escapeHtml(
                                                        item.value
                                                    )}
                                                </strong>

                                            </div>
                                        `;
                                    }
                                )
                                .join("")}

                        </div>
                    `
                    : ""
            }

        </${tag}>
    `;
}