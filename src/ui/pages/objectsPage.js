/************************************************
 * Facility OS
 * objectsPage.js
 ************************************************/

import {
    USER_ROLES
} from "../../config/appConfig.js";

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
 * DATENHELFER
 ************************************************/

function getVisibleObjects(state) {

    const currentUser =
        state.currentUser;

    if (!currentUser) {
        return [];
    }

    const allObjects =
        Array.isArray(state.objects)
            ? state.objects
            : [];

    switch (currentUser.role) {

        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:
        case USER_ROLES.BUCHHALTUNG:

            return allObjects;

        case USER_ROLES.OBJEKTLEITER:

            return allObjects.filter(
                (object) =>
                    object.objectLeaderId ===
                    currentUser.id
            );

        case USER_ROLES.MITARBEITER: {

            const assignedObjectIds =
                Array.isArray(
                    currentUser.assignedObjectIds
                )
                    ? currentUser.assignedObjectIds
                    : [];

            return allObjects.filter(
                (object) =>
                    assignedObjectIds.includes(
                        object.id
                    )
            );
        }

        case USER_ROLES.KUNDE: {

            const allowedObjectIds =
                state.customerAccess
                    .filter(
                        (access) =>
                            access.customerUserId ===
                                currentUser.id &&
                            access.active === true &&
                            access.access
                                ?.objectOverview ===
                                true
                    )
                    .map(
                        (access) =>
                            access.objectId
                    );

            return allObjects.filter(
                (object) =>
                    allowedObjectIds.includes(
                        object.id
                    )
            );
        }

        default:

            return [];
    }
}

function getRoomsForObject(
    state,
    objectId
) {

    return state.rooms.filter(
        (room) =>
            room.objectId ===
                objectId &&
            room.active !== false
    );
}

function getEmployeesForObject(
    state,
    object
) {

    const assignedEmployeeIds =
        Array.isArray(
            object.assignedEmployeeIds
        )
            ? object.assignedEmployeeIds
            : [];

    return state.users.filter(
        (user) =>
            assignedEmployeeIds.includes(
                user.id
            )
    );
}

function getOpenTicketsForObject(
    state,
    objectId
) {

    return state.tickets.filter(
        (ticket) => {

            return (
                ticket.objectId ===
                    objectId &&
                ![
                    "RESOLVED",
                    "CLOSED",
                    "COMPLETED"
                ].includes(
                    ticket.status
                )
            );
        }
    );
}

function formatAddress(address) {

    if (
        !address ||
        typeof address !== "object"
    ) {

        return "Keine Adresse hinterlegt";
    }

    const street =
        String(
            address.street ?? ""
        ).trim();

    const postalCode =
        String(
            address.postalCode ?? ""
        ).trim();

    const city =
        String(
            address.city ?? ""
        ).trim();

    const cityLine =
        [postalCode, city]
            .filter(Boolean)
            .join(" ");

    return [street, cityLine]
        .filter(Boolean)
        .join(", ");
}

/************************************************
 * OBJEKTKARTE
 ************************************************/

function renderObjectCard(
    state,
    object
) {

    const rooms =
        getRoomsForObject(
            state,
            object.id
        );

    const employees =
        getEmployeesForObject(
            state,
            object
        );

    const openTickets =
        getOpenTicketsForObject(
            state,
            object.id
        );

    const statusLabel =
        object.active !== false
            ? "Aktiv"
            : "Inaktiv";

    const statusClass =
        object.active !== false
            ? "status-active"
            : "status-inactive";

    return `
        <article class="object-card">

            <div class="object-card-header">

                <div>

                    <span class="object-id">
                        ${escapeHtml(object.id)}
                    </span>

                    <h2>
                        ${escapeHtml(object.name)}
                    </h2>

                </div>

                <span
                    class="object-status ${statusClass}"
                >
                    ${escapeHtml(statusLabel)}
                </span>

            </div>

            <p class="object-customer">
                ${escapeHtml(
                    object.customerName ??
                    "Kein Kunde hinterlegt"
                )}
            </p>

            <p class="object-address">
                ${escapeHtml(
                    formatAddress(
                        object.address
                    )
                )}
            </p>

            <div class="object-metrics">

                <div>
                    <strong>
                        ${rooms.length}
                    </strong>

                    <span>
                        Räume
                    </span>
                </div>

                <div>
                    <strong>
                        ${employees.length}
                    </strong>

                    <span>
                        Mitarbeiter
                    </span>
                </div>

                <div>
                    <strong>
                        ${openTickets.length}
                    </strong>

                    <span>
                        Offene Tickets
                    </span>
                </div>

            </div>

            <div class="object-features">

                ${
                    object.qrRequired
                        ? `
                            <span class="feature-badge">
                                QR-Check-in
                            </span>
                        `
                        : ""
                }

                ${
                    object.gpsRequired
                        ? `
                            <span class="feature-badge">
                                GPS
                            </span>
                        `
                        : ""
                }

                ${
                    object.guideEnabled
                        ? `
                            <span class="feature-badge">
                                Objektanleitung
                            </span>
                        `
                        : ""
                }

                ${
                    object.customerPortalEnabled
                        ? `
                            <span class="feature-badge">
                                Kundenportal
                            </span>
                        `
                        : ""
                }

            </div>

            <button
                type="button"
                class="button button-primary button-full"
                data-object-id="${escapeHtml(object.id)}"
                data-action="select-object"
            >
                Objekt öffnen
            </button>

        </article>
    `;
}

/************************************************
 * SEITE
 ************************************************/

export function renderObjectsPage(
    state
) {

    const objects =
        getVisibleObjects(state);

    return `
        <section class="page-section">

            <div class="page-heading">

                <div>

                    <span class="eyebrow">
                        Facility OS
                    </span>

                    <h1>
                        Objekte
                    </h1>

                </div>

            </div>

            ${
                objects.length === 0
                    ? `
                        <section class="content-card">

                            <h2>
                                Keine Objekte vorhanden
                            </h2>

                            <p>
                                Für diesen Benutzer sind
                                derzeit keine Objekte
                                freigegeben oder zugeordnet.
                            </p>

                        </section>
                    `
                    : `
                        <div class="objects-grid">

                            ${objects
                                .map(
                                    (object) =>
                                        renderObjectCard(
                                            state,
                                            object
                                        )
                                )
                                .join("")}

                        </div>
                    `
            }

        </section>
    `;
}