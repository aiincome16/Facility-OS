/************************************************
 * Facility OS
 * objectDetailPage.js
 ************************************************/

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatAddress(address) {

    if (
        !address ||
        typeof address !== "object"
    ) {

        return "Keine Adresse hinterlegt";
    }

    const street =
        String(address.street ?? "").trim();

    const postalCode =
        String(address.postalCode ?? "").trim();

    const city =
        String(address.city ?? "").trim();

    return [
        street,
        [postalCode, city]
            .filter(Boolean)
            .join(" ")
    ]
        .filter(Boolean)
        .join(", ");
}

function getObjectRooms(
    state,
    objectId
) {

    return state.rooms
        .filter(
            (room) =>
                room.objectId === objectId &&
                room.active !== false
        )
        .sort(
            (firstRoom, secondRoom) =>
                Number(firstRoom.sequence ?? 0) -
                Number(secondRoom.sequence ?? 0)
        );
}

function getObjectTasks(
    state,
    objectId
) {

    return state.tasks.filter(
        (task) =>
            task.objectId === objectId &&
            task.active !== false
    );
}

function getObjectEmployees(
    state,
    object
) {

    const employeeIds =
        Array.isArray(
            object.assignedEmployeeIds
        )
            ? object.assignedEmployeeIds
            : [];

    return state.users.filter(
        (user) =>
            employeeIds.includes(user.id)
    );
}

function getObjectTickets(
    state,
    objectId
) {

    return state.tickets.filter(
        (ticket) =>
            ticket.objectId === objectId
    );
}

function getOpenTickets(
    tickets
) {

    return tickets.filter(
        (ticket) =>
            ![
                "RESOLVED",
                "CLOSED",
                "COMPLETED"
            ].includes(ticket.status)
    );
}

function getObjectMaterialWarnings(
    state,
    objectId
) {

    return state.materialStock.filter(
        (stock) =>
            stock.objectId === objectId &&
            [
                "LOW",
                "CRITICAL"
            ].includes(stock.status)
    );
}

function renderMetric(
    value,
    label
) {

    return `
        <div class="object-detail-metric">

            <strong>
                ${escapeHtml(value)}
            </strong>

            <span>
                ${escapeHtml(label)}
            </span>

        </div>
    `;
}

function renderRoomCard(
    state,
    room
) {

    const roomTasks =
        state.tasks.filter(
            (task) =>
                task.roomId === room.id &&
                task.active !== false
        );

    return `
        <article class="room-card">

            <div class="room-card-header">

                <div>

                    <span class="room-sequence">
                        Bereich
                        ${escapeHtml(room.sequence)}
                    </span>

                    <h3>
                        ${escapeHtml(room.name)}
                    </h3>

                </div>

                <span class="room-time">
                    ${escapeHtml(
                        room.estimatedMinutes ?? 0
                    )}
                    Min.
                </span>

            </div>

            <p>
                ${escapeHtml(
                    room.floor ??
                    "Keine Etage angegeben"
                )}
            </p>

            <div class="room-card-footer">

                <span>
                    ${roomTasks.length}
                    Aufgaben
                </span>

                ${
                    room.guideRequired
                        ? `
                            <span class="feature-badge">
                                Anleitung erforderlich
                            </span>
                        `
                        : ""
                }

                ${
                    room.accessRestricted
                        ? `
                            <span class="feature-badge">
                                Zugang beschränkt
                            </span>
                        `
                        : ""
                }

            </div>

        </article>
    `;
}

export function renderObjectDetailPage(
    state
) {

    const object =
        state.currentObject;

    if (!object) {

        return `
            <section class="page-section">

                <div class="page-heading">

                    <div>

                        <span class="eyebrow">
                            Facility OS
                        </span>

                        <h1>
                            Kein Objekt ausgewählt
                        </h1>

                    </div>

                </div>

                <section class="content-card">

                    <p>
                        Wähle zuerst ein Objekt aus der
                        Objektübersicht aus.
                    </p>

                    <button
                        type="button"
                        class="button button-primary"
                        data-route="/objects"
                    >
                        Zur Objektübersicht
                    </button>

                </section>

            </section>
        `;
    }

    const rooms =
        getObjectRooms(
            state,
            object.id
        );

    const tasks =
        getObjectTasks(
            state,
            object.id
        );

    const employees =
        getObjectEmployees(
            state,
            object
        );

    const tickets =
        getObjectTickets(
            state,
            object.id
        );

    const openTickets =
        getOpenTickets(
            tickets
        );

    const materialWarnings =
        getObjectMaterialWarnings(
            state,
            object.id
        );

    return `
        <section class="page-section">

            <button
                type="button"
                class="back-button"
                data-route="/objects"
            >
                ← Zurück zu den Objekten
            </button>

            <div class="object-detail-header">

                <div>

                    <span class="eyebrow">
                        ${escapeHtml(object.id)}
                    </span>

                    <h1>
                        ${escapeHtml(object.name)}
                    </h1>

                    <p>
                        ${escapeHtml(
                            object.customerName ??
                            "Kein Kunde hinterlegt"
                        )}
                    </p>

                    <p>
                        ${escapeHtml(
                            formatAddress(
                                object.address
                            )
                        )}
                    </p>

                </div>

                <span class="object-status status-active">
                    Aktiv
                </span>

            </div>

            <div class="object-detail-metrics">

                ${renderMetric(
                    rooms.length,
                    "Räume"
                )}

                ${renderMetric(
                    tasks.length,
                    "Aufgaben"
                )}

                ${renderMetric(
                    employees.length,
                    "Mitarbeiter"
                )}

                ${renderMetric(
                    openTickets.length,
                    "Offene Tickets"
                )}

                ${renderMetric(
                    materialWarnings.length,
                    "Materialwarnungen"
                )}

            </div>

            <section class="content-card">

                <h2>
                    Objektfunktionen
                </h2>

                <div class="action-grid">

                    <button
                        type="button"
                        class="action-card"
                        data-route="/tasks"
                    >
                        <strong>
                            Aufgaben
                        </strong>

                        <span>
                            Reinigungsaufgaben und Reihenfolge anzeigen
                        </span>
                    </button>

                    <button
                        type="button"
                        class="action-card"
                        data-route="/materials"
                    >
                        <strong>
                            Material
                        </strong>

                        <span>
                            Bestände und Warnungen prüfen
                        </span>
                    </button>

                    <button
                        type="button"
                        class="action-card"
                        data-route="/tickets"
                    >
                        <strong>
                            Tickets
                        </strong>

                        <span>
                            Schäden, Probleme und Meldungen anzeigen
                        </span>
                    </button>

                    <button
                        type="button"
                        class="action-card"
                        data-route="/reports"
                    >
                        <strong>
                            Berichte
                        </strong>

                        <span>
                            Arbeitszeiten und Leistung auswerten
                        </span>
                    </button>

                    <button
                        type="button"
                        class="action-card"
                        data-action="open-object-guide"
                    >
                        <strong>
                            Objektanleitung
                        </strong>

                        <span>
                            Zugang, Dosierung und Sicherheitsregeln
                        </span>
                    </button>

                    <button
                        type="button"
                        class="action-card"
                        data-action="open-keybook"
                    >
                        <strong>
                            Schlüsselbuch
                        </strong>

                        <span>
                            Schlüsselstatus und Übergaben prüfen
                        </span>
                    </button>

                </div>

            </section>

            <section class="content-card">

                <h2>
                    Räume
                </h2>

                <div class="rooms-grid">

                    ${rooms
                        .map(
                            (room) =>
                                renderRoomCard(
                                    state,
                                    room
                                )
                        )
                        .join("")}

                </div>

            </section>

            ${
                object.notes
                    ? `
                        <section class="content-card">

                            <h2>
                                Wichtiger Objekthinweis
                            </h2>

                            <p>
                                ${escapeHtml(
                                    object.notes
                                )}
                            </p>

                        </section>
                    `
                    : ""
            }

        </section>
    `;
}