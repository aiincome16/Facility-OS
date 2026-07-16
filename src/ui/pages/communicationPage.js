/************************************************
 * Facility OS
 * communicationPage.js
 *
 * Visuelle Kommunikationszentrale
 * - offene Meldungen
 * - kritische Tickets
 * - Nachrichten
 * - Kundenanfragen
 * - neue Meldungen
 * - rollenabhängige Darstellung
 ************************************************/

import {
    USER_ROLES
} from "../../config/appConfig.js";

import {
    ROUTES
} from "../../router.js";

import {
    renderStatusGrid,
    renderAlertList
} from "../components/statusCard.js";

import {
    renderCompactModuleList
} from "../components/moduleCard.js";

import {
    renderPageTitle,
    renderSectionHeader,
    renderCollapsiblePanel,
    renderActionRows,
    renderEmptyState,
    renderTextBlock
} from "../components/sectionPanel.js";

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

function normalizeStatus(value) {

    return normalizeText(value)
        .toUpperCase();
}

function isActive(entry) {

    return entry?.active !== false;
}

/************************************************
 * BENUTZER UND ROLLE
 ************************************************/

function getRole(state) {

    return normalizeStatus(
        state.currentUser?.role
    );
}

function getUserName(user) {

    return (
        user?.name ??
        user?.fullName ??
        user?.displayName ??
        user?.email ??
        "Unbekannter Benutzer"
    );
}

function getUserById(
    state,
    userId
) {

    if (!userId) {
        return null;
    }

    return asArray(state.users)
        .find(
            (user) =>
                user.id === userId
        ) ??
        null;
}

/************************************************
 * OBJEKTE
 ************************************************/

function getObjectById(
    state,
    objectId
) {

    if (!objectId) {
        return null;
    }

    return asArray(state.objects)
        .find(
            (object) =>
                object.id === objectId
        ) ??
        null;
}

function getObjectName(
    state,
    objectId
) {

    const object =
        getObjectById(
            state,
            objectId
        );

    return (
        object?.name ??
        object?.id ??
        "Ohne Objekt"
    );
}

/************************************************
 * STATUSPRÜFUNG
 ************************************************/

function isClosedStatus(status) {

    return [
        "CLOSED",
        "COMPLETED",
        "RESOLVED",
        "ARCHIVED",
        "CANCELLED",
        "REJECTED"
    ].includes(
        normalizeStatus(status)
    );
}

function isCriticalPriority(value) {

    return [
        "CRITICAL",
        "URGENT",
        "HIGH"
    ].includes(
        normalizeStatus(value)
    );
}

/************************************************
 * TICKETS
 ************************************************/

function getOpenTickets(state) {

    return asArray(state.tickets)
        .filter(
            (ticket) =>
                isActive(ticket) &&
                !isClosedStatus(
                    ticket.status
                )
        );
}

function getClosedTickets(state) {

    return asArray(state.tickets)
        .filter(
            (ticket) =>
                isActive(ticket) &&
                isClosedStatus(
                    ticket.status
                )
        );
}

function getCriticalTickets(state) {

    return getOpenTickets(state)
        .filter(
            (ticket) =>
                isCriticalPriority(
                    ticket.priority ??
                    ticket.severity
                )
        );
}

/************************************************
 * ROLLENBASIERTE TICKETS
 ************************************************/

function isTicketRelatedToUser(
    ticket,
    userId
) {

    if (!userId) {
        return false;
    }

    return [
        ticket.userId,
        ticket.employeeId,
        ticket.createdByUserId,
        ticket.assignedUserId,
        ticket.customerUserId,
        ticket.recipientUserId
    ].includes(
        userId
    );
}

function getVisibleTickets(state) {

    const role =
        getRole(state);

    const userId =
        state.currentUser?.id;

    const tickets =
        asArray(state.tickets)
            .filter(isActive);

    if (
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN,
            USER_ROLES.OBJEKTLEITER,
            USER_ROLES.BUCHHALTUNG
        ].includes(role)
    ) {

        return tickets;
    }

    return tickets.filter(
        (ticket) =>
            isTicketRelatedToUser(
                ticket,
                userId
            )
    );
}

function getVisibleOpenTickets(state) {

    return getVisibleTickets(state)
        .filter(
            (ticket) =>
                !isClosedStatus(
                    ticket.status
                )
        );
}

function getVisibleClosedTickets(state) {

    return getVisibleTickets(state)
        .filter(
            (ticket) =>
                isClosedStatus(
                    ticket.status
                )
        );
}

/************************************************
 * NACHRICHTEN
 ************************************************/

function isMessageUnread(
    message,
    currentUserId
) {

    const status =
        normalizeStatus(
            message.status
        );

    if (
        message.read === true ||
        message.isRead === true ||
        [
            "READ",
            "ARCHIVED",
            "CLOSED"
        ].includes(status)
    ) {

        return false;
    }

    if (
        message.recipientUserId &&
        currentUserId
    ) {

        return (
            message.recipientUserId ===
            currentUserId
        );
    }

    return true;
}

function isMessageVisible(
    message,
    currentUserId,
    role
) {

    if (
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN,
            USER_ROLES.OBJEKTLEITER
        ].includes(role)
    ) {

        return true;
    }

    return [
        message.userId,
        message.senderUserId,
        message.recipientUserId,
        message.createdByUserId,
        message.customerUserId
    ].includes(
        currentUserId
    );
}

function getVisibleMessages(state) {

    const userId =
        state.currentUser?.id;

    const role =
        getRole(state);

    return asArray(state.messages)
        .filter(
            (message) =>
                isActive(message) &&
                isMessageVisible(
                    message,
                    userId,
                    role
                )
        );
}

function getUnreadMessages(state) {

    const userId =
        state.currentUser?.id;

    return getVisibleMessages(state)
        .filter(
            (message) =>
                isMessageUnread(
                    message,
                    userId
                )
        );
}

/************************************************
 * KUNDENANFRAGEN
 ************************************************/

function isCommunicationRequest(request) {

    const type =
        normalizeStatus(
            request.type ??
            request.requestType
        );

    return [
        "CUSTOMER_REQUEST",
        "REQUEST",
        "QUESTION",
        "COMPLAINT",
        "RECLAMATION",
        "SERVICE_REQUEST",
        "KUNDENANFRAGE",
        "REKLAMATION",
        "ANFRAGE"
    ].includes(type);
}

function getCustomerRequests(state) {

    const role =
        getRole(state);

    const userId =
        state.currentUser?.id;

    const requests =
        asArray(state.customerRequests)
            .filter(
                (request) =>
                    isActive(request) &&
                    isCommunicationRequest(
                        request
                    )
            );

    if (
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN,
            USER_ROLES.OBJEKTLEITER
        ].includes(role)
    ) {

        return requests;
    }

    return requests.filter(
        (request) =>
            [
                request.userId,
                request.customerUserId,
                request.createdByUserId,
                request.assignedUserId
            ].includes(
                userId
            )
    );
}

function getOpenCustomerRequests(state) {

    return getCustomerRequests(state)
        .filter(
            (request) =>
                !isClosedStatus(
                    request.status
                )
        );
}

/************************************************
 * DATUM UND ZEIT
 ************************************************/

function formatDate(value) {

    if (!value) {
        return "";
    }

    try {

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return normalizeText(value);
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
    catch {

        return normalizeText(value);
    }
}

/************************************************
 * TICKETDARSTELLUNG
 ************************************************/

function getTicketTitle(ticket) {

    return (
        ticket.title ??
        ticket.subject ??
        ticket.category ??
        "Meldung"
    );
}

function getTicketDescription(
    state,
    ticket
) {

    const parts = [];

    if (ticket.objectId) {

        parts.push(
            getObjectName(
                state,
                ticket.objectId
            )
        );
    }

    const creator =
        getUserById(
            state,
            ticket.createdByUserId ??
            ticket.userId ??
            ticket.employeeId ??
            ticket.customerUserId
        );

    if (creator) {

        parts.push(
            getUserName(
                creator
            )
        );
    }

    const date =
        formatDate(
            ticket.createdAt ??
            ticket.timestamp ??
            ticket.date
        );

    if (date) {

        parts.push(date);
    }

    if (
        parts.length === 0
    ) {

        const description =
            normalizeText(
                ticket.description ??
                ticket.message
            );

        if (description) {

            parts.push(
                description.slice(
                    0,
                    80
                )
            );
        }
    }

    return (
        parts.join(" · ") ||
        "Keine weiteren Angaben"
    );
}

function getTicketColor(ticket) {

    if (
        isCriticalPriority(
            ticket.priority ??
            ticket.severity
        )
    ) {

        return "danger";
    }

    const priority =
        normalizeStatus(
            ticket.priority ??
            ticket.severity
        );

    if (
        [
            "MEDIUM",
            "NORMAL"
        ].includes(priority)
    ) {

        return "warning";
    }

    return "communication";
}

function getTicketStatusLabel(ticket) {

    const status =
        normalizeStatus(
            ticket.status
        );

    const labels = {

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
            "Erledigt"
    };

    return (
        labels[status] ??
        status ??
        "Offen"
    );
}

function createTicketRow(
    state,
    ticket
) {

    return {
        title:
            getTicketTitle(
                ticket
            ),

        description:
            getTicketDescription(
                state,
                ticket
            ),

        icon:
            isCriticalPriority(
                ticket.priority ??
                ticket.severity
            )
                ? "warning"
                : "communication",

        color:
            getTicketColor(
                ticket
            ),

        status:
            getTicketStatusLabel(
                ticket
            ),

        action:
            "open-ticket",

        className:
            "communication-ticket-row"
    };
}

/************************************************
 * NACHRICHTENDARSTELLUNG
 ************************************************/

function getMessageTitle(
    state,
    message
) {

    const sender =
        getUserById(
            state,
            message.senderUserId ??
            message.createdByUserId ??
            message.userId
        );

    return (
        message.subject ??
        message.title ??
        (
            sender
                ? getUserName(sender)
                : "Nachricht"
        )
    );
}

function getMessageDescription(
    state,
    message
) {

    const parts = [];

    const text =
        normalizeText(
            message.message ??
            message.body ??
            message.text
        );

    if (text) {

        parts.push(
            text.slice(
                0,
                85
            )
        );
    }

    if (
        message.objectId
    ) {

        parts.push(
            getObjectName(
                state,
                message.objectId
            )
        );
    }

    const date =
        formatDate(
            message.createdAt ??
            message.timestamp ??
            message.date
        );

    if (date) {

        parts.push(date);
    }

    return (
        parts.join(" · ") ||
        "Keine Nachrichtenvorschau"
    );
}

function createMessageRow(
    state,
    message
) {

    const unread =
        isMessageUnread(
            message,
            state.currentUser?.id
        );

    return {
        title:
            getMessageTitle(
                state,
                message
            ),

        description:
            getMessageDescription(
                state,
                message
            ),

        icon:
            "communication",

        color:
            unread
                ? "communication"
                : "neutral",

        status:
            unread
                ? "Neu"
                : "Gelesen",

        action:
            "open-message",

        className:
            unread
                ? "communication-message-unread"
                : ""
    };
}

/************************************************
 * KUNDENANFRAGEN-DARSTELLUNG
 ************************************************/

function getRequestTitle(request) {

    const type =
        normalizeStatus(
            request.type ??
            request.requestType
        );

    const labels = {

        COMPLAINT:
            "Reklamation",

        RECLAMATION:
            "Reklamation",

        REKLAMATION:
            "Reklamation",

        QUESTION:
            "Frage",

        SERVICE_REQUEST:
            "Serviceanfrage",

        CUSTOMER_REQUEST:
            "Kundenanfrage",

        REQUEST:
            "Anfrage",

        ANFRAGE:
            "Anfrage"
    };

    return (
        request.title ??
        request.subject ??
        labels[type] ??
        "Kundenanfrage"
    );
}

function getRequestDescription(
    state,
    request
) {

    const parts = [];

    if (
        request.objectId
    ) {

        parts.push(
            getObjectName(
                state,
                request.objectId
            )
        );
    }

    const customer =
        getUserById(
            state,
            request.customerUserId ??
            request.createdByUserId ??
            request.userId
        );

    if (customer) {

        parts.push(
            getUserName(
                customer
            )
        );
    }

    const date =
        formatDate(
            request.createdAt ??
            request.timestamp ??
            request.date
        );

    if (date) {

        parts.push(date);
    }

    return (
        parts.join(" · ") ||
        normalizeText(
            request.description ??
            request.message
        ) ||
        "Keine weiteren Angaben"
    );
}

function createRequestRow(
    state,
    request
) {

    return {
        title:
            getRequestTitle(
                request
            ),

        description:
            getRequestDescription(
                state,
                request
            ),

        icon:
            "communication",

        color:
            normalizeStatus(
                request.type ??
                request.requestType
            ).includes(
                "COMPLAINT"
            ) ||
            normalizeStatus(
                request.type ??
                request.requestType
            ).includes(
                "REKLAM"
            )
                ? "warning"
                : "communication",

        status:
            normalizeStatus(
                request.status
            ) || "OFFEN",

        action:
            "open-customer-request"
    };
}

/************************************************
 * STATUSKARTEN
 ************************************************/

function renderCommunicationStatus(state) {

    const openTickets =
        getVisibleOpenTickets(state);

    const criticalTickets =
        openTickets.filter(
            (ticket) =>
                isCriticalPriority(
                    ticket.priority ??
                    ticket.severity
                )
        );

    const unreadMessages =
        getUnreadMessages(state);

    const customerRequests =
        getOpenCustomerRequests(state);

    return renderStatusGrid(
        [
            {
                title:
                    "Offene Meldungen",

                value:
                    openTickets.length,

                description:
                    "zu bearbeiten",

                status:
                    openTickets.length > 0
                        ? "communication"
                        : "success",

                icon:
                    "communication"
            },
            {
                title:
                    "Kritisch",

                value:
                    criticalTickets.length,

                description:
                    "sofort prüfen",

                status:
                    criticalTickets.length > 0
                        ? "danger"
                        : "success",

                icon:
                    "warning"
            },
            {
                title:
                    "Nachrichten",

                value:
                    unreadMessages.length,

                description:
                    "ungelesen",

                status:
                    unreadMessages.length > 0
                        ? "info"
                        : "success",

                icon:
                    "communication"
            },
            {
                title:
                    "Kundenanfragen",

                value:
                    customerRequests.length,

                description:
                    "offen",

                status:
                    customerRequests.length > 0
                        ? "warning"
                        : "success",

                icon:
                    "communication"
            }
        ],
        {
            columns:
                2,

            compact:
                true
        }
    );
}

/************************************************
 * SCHNELLENTSCHEIDUNG NACH ROLLE
 ************************************************/

function getQuickActions(state) {

    const role =
        getRole(state);

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        return [
            {
                title:
                    "Problem melden",

                subtitle:
                    "Schaden oder Hindernis",

                icon:
                    "warning",

                color:
                    "communication",

                action:
                    "create-problem-ticket"
            },
            {
                title:
                    "Materialmangel",

                subtitle:
                    "Fehlendes Material melden",

                icon:
                    "materials",

                color:
                    "materials",

                action:
                    "create-material-ticket"
            },
            {
                title:
                    "Sofort-Notiz",

                subtitle:
                    "Kurzer Hinweis an die Objektleitung",

                icon:
                    "communication",

                color:
                    "communication",

                action:
                    "create-quick-note"
            },
            {
                title:
                    "Krankheit oder Urlaub",

                subtitle:
                    "Abwesenheit melden",

                icon:
                    "personnel",

                color:
                    "personnel",

                action:
                    "create-absence"
            }
        ];
    }

    if (
        role ===
        USER_ROLES.KUNDE
    ) {

        return [
            {
                title:
                    "Neue Anfrage",

                subtitle:
                    "Frage oder Wunsch senden",

                icon:
                    "communication",

                color:
                    "communication",

                action:
                    "create-customer-request"
            },
            {
                title:
                    "Reklamation",

                subtitle:
                    "Problem zur Reinigung melden",

                icon:
                    "warning",

                color:
                    "warning",

                action:
                    "create-customer-complaint"
            },
            {
                title:
                    "Nachricht",

                subtitle:
                    "Objektleitung kontaktieren",

                icon:
                    "communication",

                color:
                    "communication",

                action:
                    "create-message"
            }
        ];
    }

    return [
        {
            title:
                "Neue Meldung",

            subtitle:
                "Ticket oder Problem erfassen",

            icon:
                "communication",

            color:
                "communication",

            action:
                "create-ticket"
        },
        {
            title:
                "Nachricht senden",

            subtitle:
                "Mitarbeiter oder Kunde kontaktieren",

            icon:
                "communication",

            color:
                "communication",

            action:
                "create-message"
        },
        {
            title:
                "Kundenanfrage",

            subtitle:
                "Neue Anfrage dokumentieren",

            icon:
                "personnel",

            color:
                "personnel",

            action:
                "create-customer-request"
        },
        {
            title:
                "Sofort-Notiz",

            subtitle:
                "Kurzen internen Hinweis speichern",

            icon:
                "communication",

            color:
                "more",

            action:
                "create-quick-note"
        }
    ];
}

/************************************************
 * WARNUNGEN
 ************************************************/

function getCommunicationAlerts(state) {

    const alerts = [];

    const criticalTickets =
        getVisibleOpenTickets(state)
            .filter(
                (ticket) =>
                    isCriticalPriority(
                        ticket.priority ??
                        ticket.severity
                    )
            );

    if (
        criticalTickets.length > 0
    ) {

        alerts.push({
            title:
                "Kritische Meldungen",

            message:
                `${criticalTickets.length} Vorgänge benötigen sofortige Aufmerksamkeit.`,

            status:
                "danger",

            icon:
                "warning",

            action:
                "open-critical-tickets",

            buttonLabel:
                "Jetzt prüfen"
        });
    }

    const unreadMessages =
        getUnreadMessages(state);

    if (
        unreadMessages.length > 0
    ) {

        alerts.push({
            title:
                "Ungelesene Nachrichten",

            message:
                `${unreadMessages.length} Nachrichten wurden noch nicht gelesen.`,

            status:
                "info",

            icon:
                "communication",

            action:
                "open-unread-messages",

            buttonLabel:
                "Nachrichten öffnen"
        });
    }

    const openRequests =
        getOpenCustomerRequests(state);

    if (
        openRequests.length > 0 &&
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN,
            USER_ROLES.OBJEKTLEITER
        ].includes(
            getRole(state)
        )
    ) {

        alerts.push({
            title:
                "Offene Kundenanfragen",

            message:
                `${openRequests.length} Anfragen warten auf Bearbeitung.`,

            status:
                "warning",

            icon:
                "communication",

            action:
                "open-customer-requests",

            buttonLabel:
                "Anfragen prüfen"
        });
    }

    return alerts;
}

/************************************************
 * LISTEN
 ************************************************/

function renderOpenTicketList(state) {

    const tickets =
        getVisibleOpenTickets(state);

    if (
        tickets.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine offenen Meldungen",

            description:
                "Aktuell sind keine offenen Tickets oder Probleme vorhanden.",

            icon:
                "communication",

            color:
                "success",

            actionLabel:
                "Neue Meldung",

            action:
                "create-ticket",

            compact:
                true
        });
    }

    return renderActionRows(
        tickets.map(
            (ticket) =>
                createTicketRow(
                    state,
                    ticket
                )
        )
    );
}

function renderMessageList(state) {

    const messages =
        getVisibleMessages(state);

    if (
        messages.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Nachrichten",

            description:
                "Für dieses Benutzerkonto sind noch keine Nachrichten vorhanden.",

            icon:
                "communication",

            color:
                "communication",

            actionLabel:
                "Nachricht schreiben",

            action:
                "create-message",

            compact:
                true
        });
    }

    return renderActionRows(
        messages.map(
            (message) =>
                createMessageRow(
                    state,
                    message
                )
        )
    );
}

function renderCustomerRequestList(state) {

    const requests =
        getCustomerRequests(state);

    if (
        requests.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Kundenanfragen",

            description:
                "Aktuell liegen keine Anfragen oder Reklamationen vor.",

            icon:
                "communication",

            color:
                "success",

            actionLabel:
                "Neue Anfrage",

            action:
                "create-customer-request",

            compact:
                true
        });
    }

    return renderActionRows(
        requests.map(
            (request) =>
                createRequestRow(
                    state,
                    request
                )
        )
    );
}

function renderArchiveList(state) {

    const tickets =
        getVisibleClosedTickets(state);

    if (
        tickets.length === 0
    ) {

        return renderEmptyState({
            title:
                "Archiv ist leer",

            description:
                "Es sind noch keine abgeschlossenen Meldungen vorhanden.",

            icon:
                "communication",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        tickets.map(
            (ticket) =>
                createTicketRow(
                    state,
                    ticket
                )
        )
    );
}

/************************************************
 * SEITENINFORMATION
 ************************************************/

function getPageTitle(state) {

    const role =
        getRole(state);

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        return {
            title:
                "Meldungen",

            description:
                "Probleme, Materialmangel und Nachrichten."
        };
    }

    if (
        role ===
        USER_ROLES.KUNDE
    ) {

        return {
            title:
                "Anfragen",

            description:
                "Fragen, Wünsche und Reklamationen."
        };
    }

    return {
        title:
            "Kommunikation",

        description:
            "Tickets, Nachrichten und Kundenanfragen."
    };
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderCommunicationPage(state) {

    const page =
        getPageTitle(state);

    const openTickets =
        getVisibleOpenTickets(state);

    const messages =
        getVisibleMessages(state);

    const requests =
        getCustomerRequests(state);

    const archivedTickets =
        getVisibleClosedTickets(state);

    const alerts =
        getCommunicationAlerts(state);

    return `
        <section class="app-communication-page">

            ${renderPageTitle({
                eyebrow:
                    "Kommunikation",

                title:
                    page.title,

                description:
                    page.description,

                color:
                    "communication",

                actionLabel:
                    "Neu",

                action:
                    getRole(state) ===
                    USER_ROLES.KUNDE
                        ? "create-customer-request"
                        : "create-ticket",

                compact:
                    true
            })}

            <section class="app-communication-status">

                ${renderCommunicationStatus(
                    state
                )}

            </section>

            ${
                alerts.length > 0
                    ? `
                        <section class="app-communication-alerts">

                            ${renderSectionHeader({
                                title:
                                    "Wichtig",

                                count:
                                    alerts.length,

                                compact:
                                    true
                            })}

                            ${renderAlertList(
                                alerts,
                                {
                                    maximum:
                                        3
                                }
                            )}

                        </section>
                    `
                    : ""
            }

            <section class="app-communication-create">

                ${renderSectionHeader({
                    title:
                        "Neue Nachricht oder Meldung",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getQuickActions(
                        state
                    )
                )}

            </section>

            <section class="app-communication-content">

                ${renderCollapsiblePanel({
                    title:
                        "Offene Meldungen",

                    description:
                        "Probleme, Schäden und Hinweise",

                    icon:
                        "communication",

                    color:
                        "communication",

                    count:
                        openTickets.length,

                    open:
                        true,

                    content:
                        renderOpenTicketList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Nachrichten",

                    description:
                        "Interne und externe Kommunikation",

                    icon:
                        "communication",

                    color:
                        "info",

                    count:
                        messages.length,

                    content:
                        renderMessageList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Kundenanfragen",

                    description:
                        "Anfragen, Wünsche und Reklamationen",

                    icon:
                        "personnel",

                    color:
                        "personnel",

                    count:
                        requests.length,

                    content:
                        renderCustomerRequestList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Archiv",

                    description:
                        "Abgeschlossene Vorgänge",

                    icon:
                        "reports",

                    color:
                        "more",

                    count:
                        archivedTickets.length,

                    content:
                        renderArchiveList(
                            state
                        )
                })}

            </section>

            ${renderTextBlock({
                title:
                    "Gemeinsamer Kommunikationsbereich",

                text:
                    "Tickets, Sofort-Notizen, Nachrichten und Kundenanfragen werden in Facility OS an einer Stelle zusammengeführt.",

                color:
                    "communication",

                icon:
                    "communication"
            })}

        </section>
    `;
}