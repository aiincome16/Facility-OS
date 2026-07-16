/************************************************
 * Facility OS
 * objectDetailPage.js
 *
 * Zentrale Objektdetailseite
 * - kompakte aufklappbare Bereiche
 * - für lokale JSON-Daten vorbereitet
 * - später ohne UI-Umbau an API/Sheets anbindbar
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

function asText(
    value,
    fallback = "Nicht hinterlegt"
) {

    const text =
        String(value ?? "").trim();

    return text || fallback;
}

function asNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function isActive(entry) {

    return entry?.active !== false;
}

function getStatusLabel(status) {

    const normalizedStatus =
        String(status ?? "")
            .trim()
            .toUpperCase();

    const statusLabels = {

        OPEN:
            "Offen",

        NEW:
            "Neu",

        IN_PROGRESS:
            "In Bearbeitung",

        WAITING:
            "Wartet",

        RESOLVED:
            "Gelöst",

        CLOSED:
            "Geschlossen",

        COMPLETED:
            "Abgeschlossen",

        ACTIVE:
            "Aktiv",

        INACTIVE:
            "Inaktiv",

        LOW:
            "Niedrig",

        CRITICAL:
            "Kritisch",

        OK:
            "In Ordnung",

        AVAILABLE:
            "Verfügbar",

        ASSIGNED:
            "Ausgegeben",

        RETURNED:
            "Zurückgegeben",

        PLANNED:
            "Geplant",

        RUNNING:
            "Läuft",

        FINISHED:
            "Beendet"
    };

    return (
        statusLabels[normalizedStatus] ??
        asText(status)
    );
}

function getStatusClass(status) {

    const normalizedStatus =
        String(status ?? "")
            .trim()
            .toUpperCase();

    if (
        [
            "ACTIVE",
            "OK",
            "AVAILABLE",
            "COMPLETED",
            "RESOLVED",
            "CLOSED",
            "FINISHED",
            "RETURNED"
        ].includes(normalizedStatus)
    ) {

        return "status-active";
    }

    if (
        [
            "CRITICAL",
            "OPEN",
            "NEW",
            "OVERDUE"
        ].includes(normalizedStatus)
    ) {

        return "status-critical";
    }

    if (
        [
            "LOW",
            "WAITING",
            "IN_PROGRESS",
            "RUNNING",
            "ASSIGNED",
            "PLANNED"
        ].includes(normalizedStatus)
    ) {

        return "status-warning";
    }

    return "status-neutral";
}

/************************************************
 * FORMATIERUNG
 ************************************************/

function formatAddress(address) {

    if (
        !address ||
        typeof address !== "object"
    ) {

        return "Keine Adresse hinterlegt";
    }

    const street =
        asText(
            address.street,
            ""
        );

    const houseNumber =
        asText(
            address.houseNumber,
            ""
        );

    const postalCode =
        asText(
            address.postalCode,
            ""
        );

    const city =
        asText(
            address.city,
            ""
        );

    const streetLine =
        [street, houseNumber]
            .filter(Boolean)
            .join(" ");

    const cityLine =
        [postalCode, city]
            .filter(Boolean)
            .join(" ");

    return (
        [streetLine, cityLine]
            .filter(Boolean)
            .join(", ") ||
        "Keine Adresse hinterlegt"
    );
}

function formatDate(value) {

    if (!value) {
        return "Nicht hinterlegt";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return asText(value);
    }

    return new Intl.DateTimeFormat(
        "de-DE",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"
        }
    ).format(date);
}

function formatDateTime(value) {

    if (!value) {
        return "Nicht hinterlegt";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return asText(value);
    }

    return new Intl.DateTimeFormat(
        "de-DE",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    ).format(date);
}

function formatBoolean(
    value,
    trueLabel = "Ja",
    falseLabel = "Nein"
) {

    return value === true
        ? trueLabel
        : falseLabel;
}

/************************************************
 * OBJEKTDATEN
 ************************************************/

function getObjectRooms(
    state,
    objectId
) {

    return asArray(state.rooms)
        .filter(
            (room) =>
                room.objectId === objectId &&
                isActive(room)
        )
        .sort(
            (
                firstRoom,
                secondRoom
            ) =>
                asNumber(
                    firstRoom.sequence
                ) -
                asNumber(
                    secondRoom.sequence
                )
        );
}

function getObjectTasks(
    state,
    objectId
) {

    return asArray(state.tasks)
        .filter(
            (task) =>
                task.objectId === objectId &&
                isActive(task)
        )
        .sort(
            (
                firstTask,
                secondTask
            ) =>
                asNumber(
                    firstTask.sequence
                ) -
                asNumber(
                    secondTask.sequence
                )
        );
}

function getObjectEmployees(
    state,
    object
) {

    const assignedEmployeeIds =
        asArray(
            object.assignedEmployeeIds ??
            object.employeeIds ??
            object.assignedUserIds
        );

    const users =
        asArray(state.users);

    if (
        assignedEmployeeIds.length > 0
    ) {

        return users.filter(
            (user) =>
                assignedEmployeeIds.includes(
                    user.id
                )
        );
    }

    return users.filter(
        (user) => {

            const assignedObjectIds =
                asArray(
                    user.assignedObjectIds ??
                    user.objectIds
                );

            return assignedObjectIds.includes(
                object.id
            );
        }
    );
}

function getObjectLeader(
    state,
    object
) {

    const leaderId =
        object.objectLeaderId ??
        object.managerId ??
        object.leaderId;

    if (!leaderId) {
        return null;
    }

    return (
        asArray(state.users)
            .find(
                (user) =>
                    user.id === leaderId
            ) ??
        null
    );
}

function getObjectTickets(
    state,
    objectId
) {

    return asArray(state.tickets)
        .filter(
            (ticket) =>
                ticket.objectId === objectId
        )
        .sort(
            (
                firstTicket,
                secondTicket
            ) =>
                String(
                    secondTicket.createdAt ??
                    secondTicket.date ??
                    ""
                ).localeCompare(
                    String(
                        firstTicket.createdAt ??
                        firstTicket.date ??
                        ""
                    )
                )
        );
}

function getOpenTickets(tickets) {

    const closedStatuses = [
        "RESOLVED",
        "CLOSED",
        "COMPLETED"
    ];

    return tickets.filter(
        (ticket) =>
            !closedStatuses.includes(
                String(
                    ticket.status ?? ""
                ).toUpperCase()
            )
    );
}

function getObjectMaterialStock(
    state,
    objectId
) {

    return asArray(
        state.materialStock
    ).filter(
        (stock) =>
            stock.objectId === objectId
    );
}

function getMaterialById(
    state,
    materialId
) {

    return (
        asArray(state.materials)
            .find(
                (material) =>
                    material.id === materialId
            ) ??
        null
    );
}

function getObjectGuide(
    state,
    objectId
) {

    return (
        asArray(state.objectGuide)
            .find(
                (guide) =>
                    guide.objectId === objectId &&
                    isActive(guide)
            ) ??
        null
    );
}

function getObjectSettings(
    state,
    objectId
) {

    return (
        asArray(state.objectSettings)
            .find(
                (settings) =>
                    settings.objectId === objectId
            ) ??
        null
    );
}

function getObjectSecurity(
    state,
    objectId
) {

    return (
        asArray(state.objectSecurity)
            .find(
                (security) =>
                    security.objectId === objectId
            ) ??
        null
    );
}

function getObjectWaste(
    state,
    objectId
) {

    return (
        asArray(state.objectWaste)
            .find(
                (waste) =>
                    waste.objectId === objectId
            ) ??
        null
    );
}

function getObjectKeyEntries(
    state,
    objectId
) {

    return asArray(state.keybook)
        .filter(
            (entry) =>
                entry.objectId === objectId
        );
}

function getObjectShifts(
    state,
    objectId
) {

    return asArray(state.shifts)
        .filter(
            (shift) =>
                shift.objectId === objectId
        )
        .sort(
            (
                firstShift,
                secondShift
            ) =>
                String(
                    secondShift.startTime ??
                    secondShift.date ??
                    ""
                ).localeCompare(
                    String(
                        firstShift.startTime ??
                        firstShift.date ??
                        ""
                    )
                )
        );
}

function getObjectCustomerAccess(
    state,
    objectId
) {

    return asArray(
        state.customerAccess
    ).filter(
        (access) =>
            access.objectId === objectId
    );
}

function getObjectCheckins(
    state,
    objectId
) {

    return asArray(state.checkins)
        .filter(
            (checkin) =>
                checkin.objectId === objectId
        );
}

function getObjectCheckouts(
    state,
    objectId
) {

    return asArray(state.checkouts)
        .filter(
            (checkout) =>
                checkout.objectId === objectId
        );
}

/************************************************
 * UI-BASISELEMENTE
 ************************************************/

function renderEmptyState(message) {

    return `
        <div class="empty-state">
            <p>
                ${escapeHtml(message)}
            </p>
        </div>
    `;
}

function renderStatusBadge(status) {

    return `
        <span
            class="object-status ${getStatusClass(status)}"
        >
            ${escapeHtml(
                getStatusLabel(status)
            )}
        </span>
    `;
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

function renderInfoRow(
    label,
    value
) {

    return `
        <div class="detail-info-row">

            <span>
                ${escapeHtml(label)}
            </span>

            <strong>
                ${escapeHtml(value)}
            </strong>

        </div>
    `;
}

function renderSection({
    title,
    subtitle,
    count = null,
    open = false,
    content
}) {

    const countBadge =
        count === null
            ? ""
            : `
                <span class="section-count">
                    ${escapeHtml(count)}
                </span>
            `;

    return `
        <details
            class="object-detail-section"
            ${open ? "open" : ""}
        >

            <summary>

                <div class="section-summary-text">

                    <strong>
                        ${escapeHtml(title)}
                    </strong>

                    ${
                        subtitle
                            ? `
                                <span>
                                    ${escapeHtml(subtitle)}
                                </span>
                            `
                            : ""
                    }

                </div>

                ${countBadge}

            </summary>

            <div class="section-content">
                ${content}
            </div>

        </details>
    `;
}

/************************************************
 * RÄUME UND AUFGABEN
 ************************************************/

function renderTaskItem(task) {

    const instructions =
        asArray(task.instructions);

    const materials =
        asArray(task.materials);

    return `
        <details class="task-detail-item">

            <summary>

                <div>

                    <strong>
                        ${escapeHtml(
                            asText(
                                task.title,
                                "Aufgabe"
                            )
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            asText(
                                task.category,
                                "Keine Kategorie"
                            )
                        )}
                        ·
                        ${escapeHtml(
                            asNumber(
                                task.estimatedMinutes
                            )
                        )}
                        Min.
                    </span>

                </div>

                ${
                    task.documentationRequired
                        ? `
                            <span class="feature-badge">
                                Nachweis
                            </span>
                        `
                        : ""
                }

            </summary>

            <div class="task-detail-content">

                <p>
                    ${escapeHtml(
                        asText(
                            task.description,
                            "Keine Beschreibung hinterlegt"
                        )
                    )}
                </p>

                ${
                    instructions.length > 0
                        ? `
                            <h4>
                                Arbeitsschritte
                            </h4>

                            <ol class="compact-list">

                                ${instructions
                                    .map(
                                        (instruction) => `
                                            <li>
                                                ${escapeHtml(
                                                    instruction
                                                )}
                                            </li>
                                        `
                                    )
                                    .join("")}

                            </ol>
                        `
                        : ""
                }

                ${
                    materials.length > 0
                        ? `
                            <div class="task-meta-row">

                                <span>
                                    Material:
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        materials.join(
                                            ", "
                                        )
                                    )}
                                </strong>

                            </div>
                        `
                        : ""
                }

                <div class="task-meta-grid">

                    ${renderInfoRow(
                        "Häufigkeit",
                        asText(
                            task.frequency
                        )
                    )}

                    ${renderInfoRow(
                        "Fotopflicht",
                        formatBoolean(
                            task.photoRequired
                        )
                    )}

                    ${renderInfoRow(
                        "Dokumentationspflicht",
                        formatBoolean(
                            task.documentationRequired
                        )
                    )}

                </div>

            </div>

        </details>
    `;
}

function renderRoomCard(
    room,
    tasks
) {

    const roomTasks =
        tasks.filter(
            (task) =>
                task.roomId === room.id
        );

    const totalMinutes =
        roomTasks.reduce(
            (
                total,
                task
            ) =>
                total +
                asNumber(
                    task.estimatedMinutes
                ),
            0
        );

    return `
        <details class="room-detail-card">

            <summary>

                <div>

                    <span class="room-sequence">
                        ${escapeHtml(
                            asText(
                                room.floor,
                                "Bereich"
                            )
                        )}
                    </span>

                    <strong>
                        ${escapeHtml(
                            asText(
                                room.name,
                                "Raum"
                            )
                        )}
                    </strong>

                    <span>
                        ${roomTasks.length}
                        Aufgaben ·
                        ${totalMinutes}
                        Min.
                    </span>

                </div>

                <span class="section-count">
                    ${roomTasks.length}
                </span>

            </summary>

            <div class="room-detail-content">

                <div class="task-meta-grid">

                    ${renderInfoRow(
                        "Raum-ID",
                        asText(room.id)
                    )}

                    ${renderInfoRow(
                        "Reihenfolge",
                        asText(
                            room.sequence
                        )
                    )}

                    ${renderInfoRow(
                        "Zugang beschränkt",
                        formatBoolean(
                            room.accessRestricted
                        )
                    )}

                    ${renderInfoRow(
                        "Anleitung erforderlich",
                        formatBoolean(
                            room.guideRequired
                        )
                    )}

                </div>

                ${
                    room.notes
                        ? `
                            <div class="object-note">
                                ${escapeHtml(
                                    room.notes
                                )}
                            </div>
                        `
                        : ""
                }

                <div class="nested-list">

                    ${
                        roomTasks.length > 0
                            ? roomTasks
                                .map(
                                    renderTaskItem
                                )
                                .join("")
                            : renderEmptyState(
                                "Für diesen Raum sind keine Aufgaben hinterlegt."
                            )
                    }

                </div>

            </div>

        </details>
    `;
}

function renderRoomsSection(
    rooms,
    tasks
) {

    return renderSection({
        title:
            "Räume und Aufgaben",

        subtitle:
            "Reinigungsbereiche, Reihenfolge und Arbeitsschritte",

        count:
            rooms.length,

        open:
            true,

        content:
            rooms.length > 0
                ? `
                    <div class="rooms-accordion">

                        ${rooms
                            .map(
                                (room) =>
                                    renderRoomCard(
                                        room,
                                        tasks
                                    )
                            )
                            .join("")}

                    </div>
                `
                : renderEmptyState(
                    "Für dieses Objekt sind keine Räume hinterlegt."
                )
    });
}

/************************************************
 * MITARBEITER
 ************************************************/

function renderEmployeeCard(
    employee,
    objectLeader
) {

    const isLeader =
        objectLeader?.id ===
        employee.id;

    return `
        <article class="compact-item-card">

            <div>

                <strong>
                    ${escapeHtml(
                        asText(
                            employee.name,
                            employee.fullName ??
                            "Mitarbeiter"
                        )
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        asText(
                            employee.role,
                            "Keine Rolle"
                        )
                    )}
                </span>

            </div>

            ${
                isLeader
                    ? `
                        <span class="feature-badge">
                            Objektleitung
                        </span>
                    `
                    : renderStatusBadge(
                        employee.active === false
                            ? "INACTIVE"
                            : "ACTIVE"
                    )
            }

        </article>
    `;
}

function renderEmployeesSection(
    employees,
    objectLeader
) {

    return renderSection({
        title:
            "Mitarbeiter und Zuständigkeit",

        subtitle:
            "Zugeordnete Beschäftigte und Objektleitung",

        count:
            employees.length,

        content:
            `
                ${
                    objectLeader
                        ? `
                            <div class="highlight-card">

                                <span>
                                    Zuständige Objektleitung
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        asText(
                                            objectLeader.name,
                                            objectLeader.fullName
                                        )
                                    )}
                                </strong>

                                <p>
                                    ${escapeHtml(
                                        asText(
                                            objectLeader.email,
                                            objectLeader.phone ??
                                            "Keine Kontaktdaten hinterlegt"
                                        )
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }

                ${
                    employees.length > 0
                        ? `
                            <div class="compact-card-list">

                                ${employees
                                    .map(
                                        (employee) =>
                                            renderEmployeeCard(
                                                employee,
                                                objectLeader
                                            )
                                    )
                                    .join("")}

                            </div>
                        `
                        : renderEmptyState(
                            "Für dieses Objekt sind keine Mitarbeiter zugeordnet."
                        )
                }
            `
    });
}

/************************************************
 * TICKETS
 ************************************************/

function renderTicketCard(ticket) {

    return `
        <article class="compact-item-card ticket-item-card">

            <div>

                <strong>
                    ${escapeHtml(
                        asText(
                            ticket.title,
                            ticket.subject ??
                            "Ticket"
                        )
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        asText(
                            ticket.category,
                            "Keine Kategorie"
                        )
                    )}
                    ·
                    ${escapeHtml(
                        formatDateTime(
                            ticket.createdAt ??
                            ticket.date
                        )
                    )}
                </span>

                ${
                    ticket.description
                        ? `
                            <p>
                                ${escapeHtml(
                                    ticket.description
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

            ${renderStatusBadge(
                ticket.status ??
                "OPEN"
            )}

        </article>
    `;
}

function renderTicketsSection(tickets) {

    const openTickets =
        getOpenTickets(tickets);

    return renderSection({
        title:
            "Tickets und Meldungen",

        subtitle:
            `${openTickets.length} offene Vorgänge`,

        count:
            tickets.length,

        content:
            tickets.length > 0
                ? `
                    <div class="compact-card-list">

                        ${tickets
                            .map(
                                renderTicketCard
                            )
                            .join("")}

                    </div>
                `
                : renderEmptyState(
                    "Für dieses Objekt sind keine Tickets vorhanden."
                )
    });
}

/************************************************
 * MATERIAL
 ************************************************/

function renderMaterialStockCard(
    state,
    stock
) {

    const material =
        getMaterialById(
            state,
            stock.materialId
        );

    const currentAmount =
        stock.currentAmount ??
        stock.quantity ??
        stock.stock ??
        0;

    const minimumAmount =
        stock.minimumAmount ??
        stock.minimumStock ??
        stock.minStock ??
        0;

    const unit =
        material?.unit ??
        stock.unit ??
        "";

    const calculatedStatus =
        String(
            stock.status ?? ""
        ).trim() ||
        (
            asNumber(currentAmount) <=
            asNumber(minimumAmount)
                ? "LOW"
                : "OK"
        );

    return `
        <article class="compact-item-card">

            <div>

                <strong>
                    ${escapeHtml(
                        asText(
                            material?.name,
                            stock.materialName ??
                            stock.materialId ??
                            "Material"
                        )
                    )}
                </strong>

                <span>
                    Bestand:
                    ${escapeHtml(currentAmount)}
                    ${escapeHtml(unit)}
                    · Mindestbestand:
                    ${escapeHtml(minimumAmount)}
                    ${escapeHtml(unit)}
                </span>

                ${
                    stock.location
                        ? `
                            <p>
                                Standort:
                                ${escapeHtml(
                                    stock.location
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

            ${renderStatusBadge(
                calculatedStatus
            )}

        </article>
    `;
}

function renderMaterialsSection(
    state,
    materialStock
) {

    const warnings =
        materialStock.filter(
            (stock) => {

                const status =
                    String(
                        stock.status ?? ""
                    ).toUpperCase();

                if (
                    [
                        "LOW",
                        "CRITICAL"
                    ].includes(status)
                ) {

                    return true;
                }

                const current =
                    asNumber(
                        stock.currentAmount ??
                        stock.quantity ??
                        stock.stock
                    );

                const minimum =
                    asNumber(
                        stock.minimumAmount ??
                        stock.minimumStock ??
                        stock.minStock
                    );

                return current <= minimum;
            }
        );

    return renderSection({
        title:
            "Material und Bestände",

        subtitle:
            `${warnings.length} Bestandswarnungen`,

        count:
            materialStock.length,

        content:
            materialStock.length > 0
                ? `
                    <div class="compact-card-list">

                        ${materialStock
                            .map(
                                (stock) =>
                                    renderMaterialStockCard(
                                        state,
                                        stock
                                    )
                            )
                            .join("")}

                    </div>
                `
                : renderEmptyState(
                    "Für dieses Objekt sind keine Materialbestände hinterlegt."
                )
    });
}

/************************************************
 * OBJEKTANLEITUNG
 ************************************************/

function renderGuideList(
    title,
    values
) {

    const items =
        asArray(values);

    if (
        items.length === 0
    ) {

        return "";
    }

    return `
        <div class="guide-block">

            <h4>
                ${escapeHtml(title)}
            </h4>

            <ul class="compact-list">

                ${items
                    .map(
                        (item) => `
                            <li>
                                ${escapeHtml(
                                    typeof item ===
                                    "object"
                                        ? (
                                            item.text ??
                                            item.title ??
                                            item.description ??
                                            JSON.stringify(
                                                item
                                            )
                                        )
                                        : item
                                )}
                            </li>
                        `
                    )
                    .join("")}

            </ul>

        </div>
    `;
}

function renderGuideSection(guide) {

    return renderSection({
        title:
            "Objektanleitung",

        subtitle:
            "Zugang, Ablauf, Dosierung und wichtige Hinweise",

        content:
            guide
                ? `
                    ${
                        guide.description
                            ? `
                                <div class="object-note">
                                    ${escapeHtml(
                                        guide.description
                                    )}
                                </div>
                            `
                            : ""
                    }

                    ${renderGuideList(
                        "Zugang und Betreten",
                        guide.accessInstructions ??
                        guide.access
                    )}

                    ${renderGuideList(
                        "Reinigungsablauf",
                        guide.cleaningInstructions ??
                        guide.instructions
                    )}

                    ${renderGuideList(
                        "Dosierungen",
                        guide.dosageInstructions ??
                        guide.dosages
                    )}

                    ${renderGuideList(
                        "Materialstandorte",
                        guide.materialLocations
                    )}

                    ${renderGuideList(
                        "Sicherheitsregeln",
                        guide.securityInstructions ??
                        guide.security
                    )}

                    ${renderGuideList(
                        "Besondere Hinweise",
                        guide.specialInstructions ??
                        guide.notes
                    )}

                    ${
                        !guide.description &&
                        asArray(
                            guide.accessInstructions ??
                            guide.access
                        ).length === 0 &&
                        asArray(
                            guide.cleaningInstructions ??
                            guide.instructions
                        ).length === 0 &&
                        asArray(
                            guide.dosageInstructions ??
                            guide.dosages
                        ).length === 0 &&
                        asArray(
                            guide.materialLocations
                        ).length === 0 &&
                        asArray(
                            guide.securityInstructions ??
                            guide.security
                        ).length === 0 &&
                        asArray(
                            guide.specialInstructions ??
                            guide.notes
                        ).length === 0
                            ? renderEmptyState(
                                "Die Objektanleitung enthält derzeit keine Detailangaben."
                            )
                            : ""
                    }
                `
                : renderEmptyState(
                    "Für dieses Objekt ist keine Objektanleitung hinterlegt."
                )
    });
}

/************************************************
 * SICHERHEIT UND MÜLL
 ************************************************/

function renderSecuritySection(
    security,
    waste,
    settings
) {

    return renderSection({
        title:
            "Sicherheit, Schließung und Entsorgung",

        subtitle:
            "Pflichtprüfungen und objektspezifische Vorgaben",

        content:
            `
                <div class="detail-info-grid">

                    ${renderInfoRow(
                        "QR-Check-in erforderlich",
                        formatBoolean(
                            settings?.qrRequired
                        )
                    )}

                    ${renderInfoRow(
                        "GPS erforderlich",
                        formatBoolean(
                            settings?.gpsRequired
                        )
                    )}

                    ${renderInfoRow(
                        "Objekt sichern",
                        formatBoolean(
                            settings?.securityCheckRequired ??
                            security?.securityCheckRequired
                        )
                    )}

                    ${renderInfoRow(
                        "Müllkontrolle erforderlich",
                        formatBoolean(
                            settings?.wasteCheckRequired ??
                            waste?.wasteCheckRequired
                        )
                    )}

                    ${renderInfoRow(
                        "Materialkontrolle erforderlich",
                        formatBoolean(
                            settings?.materialCheckRequired
                        )
                    )}

                    ${renderInfoRow(
                        "Problemprüfung erforderlich",
                        formatBoolean(
                            settings?.problemCheckRequired
                        )
                    )}

                </div>

                ${
                    security
                        ? `
                            <div class="guide-block">

                                <h4>
                                    Sicherheits- und Schließhinweise
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        asText(
                                            security.instructions ??
                                            security.description ??
                                            security.notes,
                                            "Keine zusätzlichen Sicherheitshinweise hinterlegt."
                                        )
                                    )}
                                </p>

                                ${
                                    security.alarmCodeLocation
                                        ? `
                                            <p>
                                                <strong>
                                                    Alarmhinweis:
                                                </strong>
                                                ${escapeHtml(
                                                    security.alarmCodeLocation
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                                ${
                                    security.securityService
                                        ? `
                                            <p>
                                                <strong>
                                                    Wachdienst:
                                                </strong>
                                                ${escapeHtml(
                                                    security.securityService
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                            </div>
                        `
                        : ""
                }

                ${
                    waste
                        ? `
                            <div class="guide-block">

                                <h4>
                                    Müll und Entsorgung
                                </h4>

                                <p>
                                    ${escapeHtml(
                                        asText(
                                            waste.instructions ??
                                            waste.description ??
                                            waste.notes,
                                            "Keine zusätzlichen Entsorgungshinweise hinterlegt."
                                        )
                                    )}
                                </p>

                                ${
                                    waste.collectionDays
                                        ? `
                                            <p>
                                                <strong>
                                                    Abholtage:
                                                </strong>
                                                ${escapeHtml(
                                                    asArray(
                                                        waste.collectionDays
                                                    ).join(
                                                        ", "
                                                    ) ||
                                                    waste.collectionDays
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                            </div>
                        `
                        : ""
                }
            `
    });
}

/************************************************
 * SCHLÜSSELBUCH
 ************************************************/

function renderKeyEntry(entry) {

    return `
        <article class="compact-item-card">

            <div>

                <strong>
                    ${escapeHtml(
                        asText(
                            entry.keyName,
                            entry.name ??
                            entry.keyId ??
                            "Schlüssel"
                        )
                    )}
                </strong>

                <span>
                    ${
                        entry.holderName
                            ? `
                                Inhaber:
                                ${escapeHtml(
                                    entry.holderName
                                )}
                                ·
                            `
                            : ""
                    }

                    ${escapeHtml(
                        formatDateTime(
                            entry.updatedAt ??
                            entry.handoverAt ??
                            entry.date
                        )
                    )}
                </span>

                ${
                    entry.notes
                        ? `
                            <p>
                                ${escapeHtml(
                                    entry.notes
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

            ${renderStatusBadge(
                entry.status ??
                "AVAILABLE"
            )}

        </article>
    `;
}

function renderKeybookSection(
    keyEntries
) {

    return renderSection({
        title:
            "Schlüsselbuch",

        subtitle:
            "Schlüsselstatus, Ausgabe und Rückgabe",

        count:
            keyEntries.length,

        content:
            keyEntries.length > 0
                ? `
                    <div class="compact-card-list">

                        ${keyEntries
                            .map(
                                renderKeyEntry
                            )
                            .join("")}

                    </div>
                `
                : renderEmptyState(
                    "Für dieses Objekt sind keine Schlüsselbucheinträge vorhanden."
                )
    });
}

/************************************************
 * SCHICHTEN UND ZEITERFASSUNG
 ************************************************/

function renderShiftCard(shift) {

    return `
        <article class="compact-item-card">

            <div>

                <strong>
                    ${escapeHtml(
                        asText(
                            shift.employeeName,
                            shift.userName ??
                            shift.userId ??
                            "Schicht"
                        )
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        formatDateTime(
                            shift.startTime ??
                            shift.date
                        )
                    )}
                    ${
                        shift.endTime
                            ? `
                                bis
                                ${escapeHtml(
                                    formatDateTime(
                                        shift.endTime
                                    )
                                )}
                            `
                            : ""
                    }
                </span>

                ${
                    shift.notes
                        ? `
                            <p>
                                ${escapeHtml(
                                    shift.notes
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

            ${renderStatusBadge(
                shift.status ??
                "PLANNED"
            )}

        </article>
    `;
}

function renderShiftsSection(
    shifts,
    checkins,
    checkouts
) {

    return renderSection({
        title:
            "Schichten und Zeiterfassung",

        subtitle:
            `${checkins.length} Check-ins · ${checkouts.length} Check-outs`,

        count:
            shifts.length,

        content:
            `
                <div class="detail-info-grid">

                    ${renderInfoRow(
                        "Erfasste Schichten",
                        shifts.length
                    )}

                    ${renderInfoRow(
                        "Check-ins",
                        checkins.length
                    )}

                    ${renderInfoRow(
                        "Check-outs",
                        checkouts.length
                    )}

                    ${renderInfoRow(
                        "Offene Schichten",
                        shifts.filter(
                            (shift) =>
                                !shift.endTime &&
                                ![
                                    "FINISHED",
                                    "COMPLETED"
                                ].includes(
                                    String(
                                        shift.status ??
                                        ""
                                    ).toUpperCase()
                                )
                        ).length
                    )}

                </div>

                ${
                    shifts.length > 0
                        ? `
                            <div class="compact-card-list">

                                ${shifts
                                    .map(
                                        renderShiftCard
                                    )
                                    .join("")}

                            </div>
                        `
                        : renderEmptyState(
                            "Für dieses Objekt sind keine Schichten hinterlegt."
                        )
                }
            `
    });
}

/************************************************
 * KUNDENFREIGABEN
 ************************************************/

function getEnabledAccessLabels(access) {

    const accessSettings =
        access.access &&
        typeof access.access === "object"
            ? access.access
            : access;

    const accessLabels = {

        objectOverview:
            "Objektübersicht",

        taskOverview:
            "Aufgaben",

        reports:
            "Berichte",

        tickets:
            "Tickets",

        messages:
            "Nachrichten",

        documents:
            "Dokumente",

        performance:
            "Leistungsdaten",

        materialStatus:
            "Materialstatus",

        employeeNames:
            "Mitarbeiternamen",

        photos:
            "Fotos"
    };

    return Object.entries(
        accessLabels
    )
        .filter(
            ([key]) =>
                accessSettings?.[key] === true
        )
        .map(
            ([, label]) =>
                label
        );
}

function renderCustomerAccessSection(
    customerAccess
) {

    return renderSection({
        title:
            "Kundenfreigaben",

        subtitle:
            "Sichtbare Inhalte im Kundenportal",

        count:
            customerAccess.length,

        content:
            customerAccess.length > 0
                ? `
                    <div class="compact-card-list">

                        ${customerAccess
                            .map(
                                (access) => {

                                    const enabledAccess =
                                        getEnabledAccessLabels(
                                            access
                                        );

                                    return `
                                        <article class="compact-item-card">

                                            <div>

                                                <strong>
                                                    ${escapeHtml(
                                                        asText(
                                                            access.customerName,
                                                            access.customerUserId ??
                                                            "Kundenzugang"
                                                        )
                                                    )}
                                                </strong>

                                                <span>
                                                    ${enabledAccess.length > 0
                                                        ? escapeHtml(
                                                            enabledAccess.join(
                                                                ", "
                                                            )
                                                        )
                                                        : "Keine Detailfreigaben"}
                                                </span>

                                            </div>

                                            ${renderStatusBadge(
                                                access.active === false
                                                    ? "INACTIVE"
                                                    : "ACTIVE"
                                            )}

                                        </article>
                                    `;
                                }
                            )
                            .join("")}

                    </div>
                `
                : renderEmptyState(
                    "Für dieses Objekt sind keine Kundenfreigaben hinterlegt."
                )
    });
}

/************************************************
 * STAMMDATEN
 ************************************************/

function renderMasterDataSection(
    object,
    settings
) {

    return renderSection({
        title:
            "Stammdaten und Einstellungen",

        subtitle:
            "Adresse, Kunde, Vertrags- und Funktionsdaten",

        content:
            `
                <div class="detail-info-grid">

                    ${renderInfoRow(
                        "Objekt-ID",
                        asText(object.id)
                    )}

                    ${renderInfoRow(
                        "Kunde",
                        asText(
                            object.customerName,
                            object.customerId
                        )
                    )}

                    ${renderInfoRow(
                        "Adresse",
                        formatAddress(
                            object.address
                        )
                    )}

                    ${renderInfoRow(
                        "Status",
                        object.active === false
                            ? "Inaktiv"
                            : "Aktiv"
                    )}

                    ${renderInfoRow(
                        "Objektart",
                        asText(
                            object.type ??
                            object.objectType
                        )
                    )}

                    ${renderInfoRow(
                        "Vertragsbeginn",
                        formatDate(
                            object.contractStart ??
                            object.startDate
                        )
                    )}

                    ${renderInfoRow(
                        "QR-Check-in",
                        formatBoolean(
                            object.qrRequired ??
                            settings?.qrRequired
                        )
                    )}

                    ${renderInfoRow(
                        "GPS-Prüfung",
                        formatBoolean(
                            object.gpsRequired ??
                            settings?.gpsRequired
                        )
                    )}

                    ${renderInfoRow(
                        "Objektanleitung",
                        formatBoolean(
                            object.guideEnabled ??
                            settings?.guideEnabled
                        )
                    )}

                    ${renderInfoRow(
                        "Kundenportal",
                        formatBoolean(
                            object.customerPortalEnabled ??
                            settings?.customerPortalEnabled
                        )
                    )}

                </div>

                ${
                    object.notes
                        ? `
                            <div class="object-note">

                                <strong>
                                    Wichtiger Objekthinweis
                                </strong>

                                <p>
                                    ${escapeHtml(
                                        object.notes
                                    )}
                                </p>

                            </div>
                        `
                        : ""
                }
            `
    });
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderObjectDetailPage(
    state
) {

    const object =
        state.currentObject;

    if (!object) {

        return `
            <section class="page-section">

                <button
                    type="button"
                    class="back-button"
                    data-route="/objects"
                >
                    ← Zur Objektübersicht
                </button>

                <section class="content-card">

                    <h1>
                        Kein Objekt ausgewählt
                    </h1>

                    <p>
                        Wähle zuerst ein Objekt aus der
                        Objektübersicht aus.
                    </p>

                    <button
                        type="button"
                        class="button button-primary"
                        data-route="/objects"
                    >
                        Objekte anzeigen
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

    const objectLeader =
        getObjectLeader(
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

    const materialStock =
        getObjectMaterialStock(
            state,
            object.id
        );

    const materialWarnings =
        materialStock.filter(
            (stock) =>
                [
                    "LOW",
                    "CRITICAL"
                ].includes(
                    String(
                        stock.status ?? ""
                    ).toUpperCase()
                ) ||
                asNumber(
                    stock.currentAmount ??
                    stock.quantity ??
                    stock.stock
                ) <=
                asNumber(
                    stock.minimumAmount ??
                    stock.minimumStock ??
                    stock.minStock
                )
        );

    const guide =
        getObjectGuide(
            state,
            object.id
        );

    const settings =
        getObjectSettings(
            state,
            object.id
        );

    const security =
        getObjectSecurity(
            state,
            object.id
        );

    const waste =
        getObjectWaste(
            state,
            object.id
        );

    const keyEntries =
        getObjectKeyEntries(
            state,
            object.id
        );

    const shifts =
        getObjectShifts(
            state,
            object.id
        );

    const customerAccess =
        getObjectCustomerAccess(
            state,
            object.id
        );

    const checkins =
        getObjectCheckins(
            state,
            object.id
        );

    const checkouts =
        getObjectCheckouts(
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

            <header class="object-detail-header">

                <div>

                    <span class="eyebrow">
                        ${escapeHtml(
                            object.id
                        )}
                    </span>

                    <h1>
                        ${escapeHtml(
                            asText(
                                object.name,
                                "Objekt"
                            )
                        )}
                    </h1>

                    <p class="object-detail-customer">
                        ${escapeHtml(
                            asText(
                                object.customerName,
                                "Kein Kunde hinterlegt"
                            )
                        )}
                    </p>

                    <p class="object-detail-address">
                        ${escapeHtml(
                            formatAddress(
                                object.address
                            )
                        )}
                    </p>

                </div>

                ${renderStatusBadge(
                    object.active === false
                        ? "INACTIVE"
                        : "ACTIVE"
                )}

            </header>

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

            <section class="object-detail-quick-actions">

                <button
                    type="button"
                    class="button button-primary"
                    data-route="/tasks"
                >
                    Aufgaben
                </button>

                <button
                    type="button"
                    class="button button-secondary"
                    data-route="/tickets"
                >
                    Meldung erstellen
                </button>

                <button
                    type="button"
                    class="button button-secondary"
                    data-route="/materials"
                >
                    Material
                </button>

                <button
                    type="button"
                    class="button button-secondary"
                    data-route="/reports"
                >
                    Berichte
                </button>

            </section>

            <div class="object-detail-sections">

                ${renderRoomsSection(
                    rooms,
                    tasks
                )}

                ${renderEmployeesSection(
                    employees,
                    objectLeader
                )}

                ${renderTicketsSection(
                    tickets
                )}

                ${renderMaterialsSection(
                    state,
                    materialStock
                )}

                ${renderGuideSection(
                    guide
                )}

                ${renderSecuritySection(
                    security,
                    waste,
                    settings
                )}

                ${renderKeybookSection(
                    keyEntries
                )}

                ${renderShiftsSection(
                    shifts,
                    checkins,
                    checkouts
                )}

                ${renderCustomerAccessSection(
                    customerAccess
                )}

                ${renderMasterDataSection(
                    object,
                    settings
                )}

            </div>

        </section>
    `;
}