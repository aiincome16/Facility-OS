import { ROUTES } from "../router.js";
import {
    addCollectionEntry,
    updateCollectionEntry
} from "../appState.js";
import { renderDashboardPage } from "./pages/dashboardPage.js";
import { renderObjectDetailPage } from "./pages/objectDetailPage.js";
import { renderObjectSectionPage } from "./pages/objectSectionPage.js";

const runtime = {
    route: ROUTES.LOGIN,
    state: {},
    objectSection: "",
    materialDraft: {
        objectId: "",
        materialId: "",
        unit: "",
        quantity: ""
    },
    materialConfirmation: null,
    moreSection: "",
    absenceDraft: {
        type: "VACATION_REQUEST",
        objectId: "",
        startOffset: 1,
        durationDays: 1,
        certificateStatus: "UNKNOWN"
    },
    absenceConfirmation: null,
    absenceNotice: null,
    replacementSearchRequestId: "",
    taskObjectId: "",
    taskRoomId: "",
    taskExpandedId: "",
    taskNotice: null,
    communicationTab: "INBOX",
    communicationExpandedTicketId: "",
    communicationNotice: null,
    communicationConfirmation: null,
    communicationDraft: {
        objectId: "",
        roomId: "",
        type: "",
        priority: "MEDIUM",
        quickText: "",
        customText: ""
    },
    communicationReplyDraft: {
        ticketId: "",
        preset: "",
        customText: ""
    },
    onNavigate: null,
    onLogin: null,
    onLogout: null,
    onCheckin: null,
    onCheckout: null,
    onSelectObject: null
};

let eventsBound = false;
let liveTimerId = null;

const arr = (value) =>
    Array.isArray(value)
        ? value
        : [];

const txt = (value) =>
    String(value ?? "").trim();

const esc = (value) =>
    String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

const root = () =>
    document.getElementById("app");

const userName = (user) =>
    txt(
        user?.displayName ??
        user?.fullName ??
        user?.name ??
        user?.email
    ) || "Benutzer";

const roleLabel = (role) => ({
    SUPER_ADMIN: "Super-Admin",
    ADMIN: "Administrator",
    OBJEKTLEITER: "Objektleiter",
    MITARBEITER: "Mitarbeiter",
    BUCHHALTUNG: "Buchhaltung",
    KUNDE: "Kunde"
}[txt(role).toUpperCase()] ?? "Benutzer");

const objectId = (object) =>
    txt(
        object?.id ??
        object?.objectId ??
        object?.ID
    );

const objectName = (object) =>
    txt(
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name
    ) || "Objekt";

const materialId = (material) =>
    txt(
        material?.id ??
        material?.materialId
    );

const materialName = (material) =>
    txt(
        material?.name ??
        material?.Name
    ) || "Material";

const icon = (name) => ({
    logo: '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    tasks: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
    message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
    logout: '<svg viewBox="0 0 24 24"><path d="M10 5H5v14h5"/><path d="m15 8 4 4-4 4M19 12H9"/></svg>'
}[name] ?? "");

function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;
}

function formatClock(startTime) {
    const start = new Date(startTime);

    if (Number.isNaN(start.getTime())) {
        return "00:00:00";
    }

    const totalSeconds = Math.max(
        0,
        Math.floor(
            (
                Date.now() -
                start.getTime()
            ) / 1000
        )
    );

    const hours =
        Math.floor(totalSeconds / 3600);

    const minutes =
        Math.floor(
            (
                totalSeconds %
                3600
            ) / 60
        );

    const seconds =
        totalSeconds % 60;

    return [
        hours,
        minutes,
        seconds
    ]
        .map((value) =>
            String(value)
                .padStart(2, "0")
        )
        .join(":");
}

function syncLiveTimer() {
    if (liveTimerId) {
        window.clearInterval(
            liveTimerId
        );

        liveTimerId = null;
    }

    const update = () => {
        const timer =
            document.getElementById(
                "employee-live-timer"
            );

        if (!timer) {
            return;
        }

        timer.textContent =
            formatClock(
                timer.getAttribute(
                    "data-start-time"
                )
            );
    };

    update();

    if (
        document.getElementById(
            "employee-live-timer"
        )
    ) {
        liveTimerId =
            window.setInterval(
                update,
                1000
            );
    }
}

function renderLogin(state) {
    const users =
        arr(state?.users)
            .filter(
                (user) =>
                    user?.active !== false
            );

    return `
        <main class="login-page">
            <section class="login-card">
                <div class="brand">
                    <span class="brand-logo">
                        ${icon("logo")}
                    </span>

                    <div>
                        <strong>
                            FACILITY OS
                        </strong>

                        <small>
                            Digitale Objektverwaltung
                        </small>
                    </div>
                </div>

                <div class="login-copy">
                    <span>
                        TESTMODUS
                    </span>

                    <h1>
                        Anmelden
                    </h1>

                    <p>
                        W&auml;hle einen Testbenutzer.
                    </p>
                </div>

                <form id="login-form">
                    <label>
                        Benutzer

                        <select
                            name="identifier"
                            required
                        >
                            <option value="">
                                Benutzer ausw&auml;hlen
                            </option>

                            ${users.map(
                                (user) => `
                                    <option
                                        value="${esc(
                                            user?.email ??
                                            user?.id ??
                                            ""
                                        )}"
                                    >
                                        ${esc(
                                            userName(user)
                                        )}
                                        &middot;
                                        ${esc(
                                            roleLabel(
                                                user?.role
                                            )
                                        )}
                                    </option>
                                `
                            ).join("")}
                        </select>
                    </label>

                    <label>
                        Passwort

                        <input
                            name="password"
                            type="password"
                            placeholder="Im Testmodus leer lassen"
                        >
                    </label>

                    <div
                        id="login-message"
                        class="message"
                    ></div>

                    <button
                        type="submit"
                        class="primary"
                    >
                        Anmelden
                    </button>
                </form>
            </section>
        </main>
    `;
}

function assignedObjects(state) {
    const user =
        state?.currentUser ?? {};

    const userId =
        txt(
            user?.id ??
            user?.userId
        );

    const ids =
        arr(
            user?.assignedObjectIds ??
            user?.objectIds
        ).map(String);

    const allObjects =
        arr(state?.objects)
            .filter(
                (object) =>
                    object?.active !== false
            );

    const assigned =
        allObjects.filter(
            (object) =>
                ids.includes(
                    objectId(object)
                ) ||
                arr(
                    object?.assignedEmployeeIds ??
                    object?.employeeIds ??
                    object?.assignedUserIds
                )
                    .map(String)
                    .includes(userId)
        );

    return assigned.length
        ? assigned
        : allObjects;
}

function activeMaterials(state) {
    return arr(state?.materials)
        .filter(
            (material) =>
                material?.active !== false
        );
}

function formatDateTime(value) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "de-DE",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    ).format(date);
}

function renderMaterialConfirmation(order) {
    const quantity =
        Number.parseInt(
            order?.quantity,
            10
        );

    const amount =
        [
            Number.isInteger(quantity)
                ? String(quantity)
                : "",

            txt(order?.unit)
        ]
            .filter(Boolean)
            .join(" ");

    return `
        <section class="content-page">
            <style>
                .material-confirmation-card {
                    display: grid;
                    gap: 20px;
                    padding: 24px;
                    border: 1px solid
                        rgba(92, 226, 157, .45);
                    border-radius: 18px;
                    background:
                        linear-gradient(
                            180deg,
                            rgba(39, 174, 96, .16),
                            rgba(8, 23, 43, .98)
                        );
                    box-shadow:
                        0 18px 50px
                        rgba(0, 0, 0, .2);
                }

                .material-confirmation-symbol {
                    display: grid;
                    width: 68px;
                    height: 68px;
                    place-items: center;
                    border: 2px solid
                        rgba(92, 226, 157, .8);
                    border-radius: 50%;
                    background:
                        rgba(39, 174, 96, .2);
                    color: #7df0b1;
                    font-size: 34px;
                    font-weight: 900;
                }

                .material-confirmation-card h1,
                .material-confirmation-card p {
                    margin: 0;
                }

                .material-confirmation-card p {
                    color: var(--soft);
                    line-height: 1.55;
                }

                .material-confirmation-details {
                    display: grid;
                    gap: 0;
                    overflow: hidden;
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    background: #08172b;
                }

                .material-confirmation-row {
                    display: grid;
                    grid-template-columns:
                        minmax(105px, .8fr)
                        minmax(0, 1.4fr);
                    gap: 14px;
                    padding: 14px;
                    border-bottom:
                        1px solid var(--border);
                }

                .material-confirmation-row:last-child {
                    border-bottom: 0;
                }

                .material-confirmation-row span {
                    color: var(--soft);
                    font-size: 14px;
                    font-weight: 700;
                }

                .material-confirmation-row strong {
                    min-width: 0;
                    overflow-wrap: anywhere;
                    color: var(--text);
                    text-align: right;
                }

                .material-confirmation-status {
                    color: #7df0b1 !important;
                }

                .material-confirmation-actions {
                    display: grid;
                    gap: 10px;
                }

                .material-confirmation-actions
                button {
                    width: 100%;
                }

                .material-confirmation-actions
                .secondary {
                    border: 1px solid var(--border);
                    background: #08172b;
                    color: var(--text);
                }

                @media (max-width: 420px) {
                    .material-confirmation-card {
                        padding: 20px 16px;
                    }

                    .material-confirmation-row {
                        grid-template-columns: 1fr;
                        gap: 5px;
                    }

                    .material-confirmation-row strong {
                        text-align: left;
                    }
                }
            </style>

            <article
                class="material-confirmation-card"
                aria-live="polite"
            >
                <div
                    class="material-confirmation-symbol"
                    aria-hidden="true"
                >
                    &#10003;
                </div>

                <div>
                    <span class="eyebrow">
                        BESTELLBESTÄTIGUNG
                    </span>

                    <h1>
                        Bestellung gespeichert
                    </h1>

                    <p>
                        Die Materialbestellung wurde
                        erfolgreich erfasst und hat den
                        Status „Offen“.
                    </p>
                </div>

                <div
                    class="material-confirmation-details"
                >
                    <div
                        class="material-confirmation-row"
                    >
                        <span>
                            Bestellnummer
                        </span>

                        <strong>
                            ${esc(order?.id)}
                        </strong>
                    </div>

                    <div
                        class="material-confirmation-row"
                    >
                        <span>
                            Objekt
                        </span>

                        <strong>
                            ${esc(order?.objectName)}
                        </strong>
                    </div>

                    <div
                        class="material-confirmation-row"
                    >
                        <span>
                            Material
                        </span>

                        <strong>
                            ${esc(order?.materialName)}
                        </strong>
                    </div>

                    <div
                        class="material-confirmation-row"
                    >
                        <span>
                            Bestellmenge
                        </span>

                        <strong>
                            ${esc(amount)}
                        </strong>
                    </div>

                    <div
                        class="material-confirmation-row"
                    >
                        <span>
                            Status
                        </span>

                        <strong
                            class="material-confirmation-status"
                        >
                            Offen
                        </strong>
                    </div>

                    <div
                        class="material-confirmation-row"
                    >
                        <span>
                            Gespeichert
                        </span>

                        <strong>
                            ${esc(
                                formatDateTime(
                                    order?.createdAt
                                )
                            )}
                        </strong>
                    </div>
                </div>

                <div
                    class="material-confirmation-actions"
                >
                    <button
                        type="button"
                        class="primary"
                        data-material-confirmation-action="new-order"
                    >
                        Weitere Bestellung
                    </button>

                    <button
                        type="button"
                        class="secondary"
                        data-material-confirmation-action="overview"
                    >
                        Zur Startseite
                    </button>
                </div>
            </article>
        </section>
    `;
}

function renderMaterials(state) {
    if (
        runtime.materialConfirmation
    ) {
        return renderMaterialConfirmation(
            runtime.materialConfirmation
        );
    }

    const objects =
        assignedObjects(state);

    const materials =
        activeMaterials(state);

    const selectedObjectId =
        runtime.materialDraft.objectId ||
        objectId(
            state?.currentObject
        );

    const selectedMaterialId =
        runtime.materialDraft.materialId;

    const selectedMaterial =
        materials.find(
            (material) =>
                materialId(material) ===
                selectedMaterialId
        );

    const unit =
        runtime.materialDraft.unit ||
        txt(
            selectedMaterial?.unit
        );

    const quantity =
        txt(
            runtime.materialDraft.quantity
        );

    runtime.materialDraft.objectId =
        selectedObjectId;

    runtime.materialDraft.unit =
        unit;

    return `
        <section class="content-page">
            <style>
                .material-quantity-section {
                    display: grid;
                    gap: 10px;
                }

                .material-quantity-section > strong {
                    color: var(--soft);
                    font-weight: 700;
                }

                .material-quantity-display {
                    display: grid;
                    min-height: 62px;
                    place-items: center;
                    padding: 8px 14px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #08172b;
                    color: var(--text);
                    font-size: 28px;
                    font-weight: 900;
                    letter-spacing: 0.04em;
                    text-align: center;
                }

                .material-quantity-display.empty {
                    color: var(--soft);
                    font-size: 17px;
                    font-weight: 700;
                    letter-spacing: 0;
                }

                .material-quantity-keypad {
                    display: grid;
                    grid-template-columns:
                        repeat(3, minmax(0, 1fr));
                    gap: 9px;
                }

                .material-quantity-key {
                    min-width: 0;
                    min-height: 54px;
                    padding: 8px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #10233f;
                    color: var(--text);
                    font-size: 21px;
                    font-weight: 900;
                    line-height: 1;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color:
                        transparent;
                    user-select: none;
                    -webkit-user-select: none;
                }

                .material-quantity-key:active {
                    transform: scale(0.97);
                }

                .material-quantity-key.secondary-key {
                    background: #08172b;
                    color: var(--soft);
                    font-size: 16px;
                }

                .material-quantity-help {
                    margin: 0;
                    color: var(--soft);
                    font-size: 14px;
                    line-height: 1.4;
                }
            </style>

            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">
                        MATERIALMELDUNG
                    </span>

                    <h1>
                        Material bestellen
                    </h1>

                    <p>
                        Objekt und Material direkt antippen.
                        Die Einheit wird automatisch
                        &uuml;bernommen.
                    </p>
                </div>
            </header>

            <form
                id="material-order-form"
                class="material-order-form"
            >
                <input
                    id="material-object"
                    name="objectId"
                    type="hidden"
                    value="${esc(
                        selectedObjectId
                    )}"
                >

                <input
                    id="material-select"
                    name="materialId"
                    type="hidden"
                    value="${esc(
                        selectedMaterialId
                    )}"
                >

                <input
                    id="material-unit"
                    name="unit"
                    type="hidden"
                    value="${esc(unit)}"
                >

                <section
                    class="material-choice-section"
                >
                    <strong>
                        1. Objekt ausw&auml;hlen
                    </strong>

                    <div
                        class="material-choice-grid"
                    >
                        ${objects.map(
                            (object) => {
                                const id =
                                    objectId(object);

                                const selected =
                                    id ===
                                    selectedObjectId;

                                return `
                                    <button
                                        type="button"
                                        class="material-choice-button ${selected ? "selected" : ""}"
                                        data-material-object-id="${esc(id)}"
                                        aria-pressed="${selected ? "true" : "false"}"
                                    >
                                        ${esc(
                                            objectName(
                                                object
                                            )
                                        )}
                                    </button>
                                `;
                            }
                        ).join("") || `
                            <div
                                class="material-choice-empty"
                            >
                                Keine Objekte verf&uuml;gbar.
                            </div>
                        `}
                    </div>
                </section>

                <section
                    class="material-choice-section"
                >
                    <strong>
                        2. Material ausw&auml;hlen
                    </strong>

                    <div
                        class="material-choice-grid"
                    >
                        ${selectedObjectId
                            ? materials.map(
                                (material) => {
                                    const id =
                                        materialId(
                                            material
                                        );

                                    const selected =
                                        id ===
                                        selectedMaterialId;

                                    return `
                                        <button
                                            type="button"
                                            class="material-choice-button ${selected ? "selected" : ""}"
                                            data-material-id="${esc(id)}"
                                            data-material-unit="${esc(
                                                material?.unit ??
                                                ""
                                            )}"
                                            aria-pressed="${selected ? "true" : "false"}"
                                        >
                                            ${esc(
                                                materialName(
                                                    material
                                                )
                                            )}
                                        </button>
                                    `;
                                }
                            ).join("")
                            : `
                                <div
                                    class="material-choice-empty"
                                >
                                    Zuerst ein Objekt ausw&auml;hlen.
                                </div>
                            `
                        }
                    </div>
                </section>

                <label>
                    Einheit

                    <input
                        id="material-unit-display"
                        type="text"
                        readonly
                        value="${esc(unit)}"
                        placeholder="Wird automatisch gesetzt"
                    >
                </label>

                <section
                    class="material-quantity-section"
                >
                    <strong>
                        Anzahl
                    </strong>

                    <input
                        id="material-quantity"
                        name="quantity"
                        type="hidden"
                        value="${esc(quantity)}"
                    >

                    <div
                        id="material-quantity-display"
                        class="material-quantity-display ${quantity ? "" : "empty"}"
                        aria-live="polite"
                    >
                        ${quantity || "Noch keine Anzahl"}
                    </div>

                    <div
                        class="material-quantity-keypad"
                        aria-label="Anzahl eingeben"
                    >
                        ${[
                            "1",
                            "2",
                            "3",
                            "4",
                            "5",
                            "6",
                            "7",
                            "8",
                            "9"
                        ].map((digit) => `
                            <button
                                type="button"
                                class="material-quantity-key"
                                data-material-quantity-key="${digit}"
                            >
                                ${digit}
                            </button>
                        `).join("")}

                        <button
                            type="button"
                            class="material-quantity-key secondary-key"
                            data-material-quantity-key="clear"
                        >
                            Löschen
                        </button>

                        <button
                            type="button"
                            class="material-quantity-key"
                            data-material-quantity-key="0"
                        >
                            0
                        </button>

                        <button
                            type="button"
                            class="material-quantity-key secondary-key"
                            data-material-quantity-key="backspace"
                            aria-label="Letzte Ziffer löschen"
                        >
                            ⌫
                        </button>
                    </div>

                    <p
                        id="material-quantity-help"
                        class="material-quantity-help"
                    >
                        Zahl direkt über die Tasten eingeben.
                        Maximal 999.
                    </p>
                </section>

                <button
                    id="material-submit"
                    type="submit"
                    class="primary"
                    disabled
                >
                    Bestellung absenden
                </button>

                <div
                    id="material-order-message"
                    class="message"
                    aria-live="polite"
                ></div>
            </form>
        </section>
    `;
}


function normalizedRole(state = runtime.state) {
    return txt(
        state?.currentUser?.role
    ).toUpperCase();
}

function currentUserId(state = runtime.state) {
    return txt(
        state?.currentUser?.id ??
        state?.currentUser?.userId
    );
}

function isAbsenceEntry(entry) {
    const type =
        txt(entry?.type)
            .toUpperCase();

    return (
        txt(entry?.category)
            .toUpperCase() ===
            "ABSENCE" ||
        [
            "VACATION_REQUEST",
            "SICK_REPORT"
        ].includes(type)
    );
}

function absenceEntries(state) {
    return arr(state?.tickets)
        .filter(isAbsenceEntry);
}

function absenceTypeLabel(type) {
    return txt(type)
        .toUpperCase() ===
        "SICK_REPORT"
            ? "Krankmeldung"
            : "Urlaubsantrag";
}

function absenceStatusLabel(status) {
    return ({
        PENDING_APPROVAL:
            "Wartet auf Freigabe",

        APPROVED:
            "Genehmigt",

        REJECTED:
            "Abgelehnt",

        REPORTED:
            "Gemeldet",

        ACKNOWLEDGED:
            "Zur Kenntnis genommen",

        CANCELLED:
            "Zurückgezogen"
    }[
        txt(status)
            .toUpperCase()
    ] ?? "Offen");
}

function absenceStatusTone(status) {
    return ({
        PENDING_APPROVAL:
            "warning",

        APPROVED:
            "success",

        REJECTED:
            "danger",

        REPORTED:
            "warning",

        ACKNOWLEDGED:
            "success",

        CANCELLED:
            "muted"
    }[
        txt(status)
            .toUpperCase()
    ] ?? "warning");
}

function replacementStatusLabel(request) {
    if (
        txt(
            request?.replacementStatus
        ).toUpperCase() ===
        "ASSIGNED" &&
        request?.replacementEmployeeName
    ) {
        return `Vertretung: ${txt(
            request.replacementEmployeeName
        )}`;
    }

    return "Vertretung noch offen";
}

function localDateFromIso(value) {
    const normalized =
        txt(value);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            normalized
        )
    ) {
        return null;
    }

    const date =
        new Date(
            `${normalized}T12:00:00`
        );

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}

function isoDateFromLocal(date) {
    if (
        !(date instanceof Date) ||
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function dateWithOffset(offset = 0) {
    const date =
        new Date();

    date.setHours(
        12,
        0,
        0,
        0
    );

    date.setDate(
        date.getDate() +
        Number(offset || 0)
    );

    return isoDateFromLocal(
        date
    );
}

function addDaysToIso(
    value,
    amount
) {
    const date =
        localDateFromIso(value);

    if (!date) {
        return "";
    }

    date.setDate(
        date.getDate() +
        Number(amount || 0)
    );

    return isoDateFromLocal(
        date
    );
}

function formatDateOnly(value) {
    const date =
        localDateFromIso(value);

    if (!date) {
        return "–";
    }

    return new Intl.DateTimeFormat(
        "de-DE",
        {
            weekday:
                "short",

            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric"
        }
    ).format(date);
}

function absencePeriodLabel(request) {
    const start =
        formatDateOnly(
            request?.startDate
        );

    const end =
        formatDateOnly(
            request?.endDate
        );

    return start === end
        ? start
        : `${start} bis ${end}`;
}

function dateRangesOverlap(
    firstStart,
    firstEnd,
    secondStart,
    secondEnd
) {
    const startA =
        localDateFromIso(
            firstStart
        );

    const endA =
        localDateFromIso(
            firstEnd
        );

    const startB =
        localDateFromIso(
            secondStart
        );

    const endB =
        localDateFromIso(
            secondEnd
        );

    if (
        !startA ||
        !endA ||
        !startB ||
        !endB
    ) {
        return false;
    }

    return (
        startA.getTime() <=
            endB.getTime() &&
        startB.getTime() <=
            endA.getTime()
    );
}

function employeeObjectIds(
    state,
    employee
) {
    const employeeId =
        txt(
            employee?.id ??
            employee?.userId
        );

    const directIds =
        arr(
            employee
                ?.assignedObjectIds ??
            employee
                ?.objectIds
        ).map(String);

    const objectIds =
        arr(state?.objects)
            .filter(
                (object) =>
                    object?.active !== false
            )
            .filter(
                (object) =>
                    directIds.includes(
                        objectId(object)
                    ) ||
                    arr(
                        object
                            ?.assignedEmployeeIds ??
                        object
                            ?.employeeIds ??
                        object
                            ?.assignedUserIds
                    )
                        .map(String)
                        .includes(
                            employeeId
                        )
            )
            .map(objectId)
            .filter(Boolean);

    return [
        ...new Set(
            objectIds
        )
    ];
}

function absenceObjectsForUser(state) {
    const user =
        state?.currentUser ?? {};

    const allowedIds =
        employeeObjectIds(
            state,
            user
        );

    return arr(state?.objects)
        .filter(
            (object) =>
                object?.active !== false &&
                allowedIds.includes(
                    objectId(object)
                )
        );
}

function managedAbsenceObjectIds(
    state
) {
    const role =
        normalizedRole(state);

    const user =
        state?.currentUser ?? {};

    if (
        [
            "SUPER_ADMIN",
            "ADMIN",
            "BUCHHALTUNG"
        ].includes(role)
    ) {
        return arr(state?.objects)
            .filter(
                (object) =>
                    object?.active !== false
            )
            .map(objectId)
            .filter(Boolean);
    }

    if (
        role !==
        "OBJEKTLEITER"
    ) {
        return [];
    }

    const managerId =
        currentUserId(state);

    const directIds =
        arr(
            user?.assignedObjectIds ??
            user?.objectIds ??
            user?.managedObjectIds
        ).map(String);

    return [
        ...new Set(
            arr(state?.objects)
                .filter(
                    (object) =>
                        object?.active !== false
                )
                .filter(
                    (object) =>
                        directIds.includes(
                            objectId(object)
                        ) ||
                        [
                            object?.objectLeaderId,
                            object?.managerId,
                            object?.leaderId
                        ]
                            .map(String)
                            .includes(
                                managerId
                            )
                )
                .map(objectId)
                .filter(Boolean)
        )
    ];
}

function visibleAbsenceRequests(
    state
) {
    const role =
        normalizedRole(state);

    const requests =
        absenceEntries(state);

    if (
        role ===
        "MITARBEITER"
    ) {
        const employeeId =
            currentUserId(state);

        return requests.filter(
            (request) =>
                txt(
                    request?.employeeId
                ) === employeeId
        );
    }

    if (
        [
            "SUPER_ADMIN",
            "ADMIN",
            "BUCHHALTUNG"
        ].includes(role)
    ) {
        return requests;
    }

    if (
        role ===
        "OBJEKTLEITER"
    ) {
        const objectIds =
            managedAbsenceObjectIds(
                state
            );

        return requests.filter(
            (request) =>
                objectIds.includes(
                    txt(
                        request?.objectId
                    )
                )
        );
    }

    return [];
}

function requestBlocksAvailability(
    request
) {
    return ![
        "REJECTED",
        "CANCELLED",
        "DECLINED"
    ].includes(
        txt(request?.status)
            .toUpperCase()
    );
}

function replacementCandidates(
    state,
    request
) {
    const employees =
        arr(state?.users)
            .filter(
                (user) =>
                    user?.active !== false &&
                    txt(user?.role)
                        .toUpperCase() ===
                        "MITARBEITER" &&
                    txt(
                        user?.id ??
                        user?.userId
                    ) !==
                    txt(
                        request?.employeeId
                    )
            );

    return employees
        .filter(
            (candidate) => {
                const candidateId =
                    txt(
                        candidate?.id ??
                        candidate?.userId
                    );

                return !absenceEntries(
                    state
                ).some(
                    (absence) =>
                        txt(
                            absence?.id
                        ) !==
                            txt(
                                request?.id
                            ) &&
                        txt(
                            absence
                                ?.employeeId
                        ) ===
                            candidateId &&
                        requestBlocksAvailability(
                            absence
                        ) &&
                        dateRangesOverlap(
                            absence
                                ?.startDate,
                            absence
                                ?.endDate,
                            request
                                ?.startDate,
                            request
                                ?.endDate
                        )
                );
            }
        )
        .map(
            (candidate) => {
                const candidateObjects =
                    employeeObjectIds(
                        state,
                        candidate
                    );

                const knowsObject =
                    candidateObjects.includes(
                        txt(
                            request?.objectId
                        )
                    );

                const runningShift =
                    arr(state?.shifts)
                        .some(
                            (shift) => {
                                const status =
                                    txt(
                                        shift
                                            ?.status
                                    )
                                        .toUpperCase();

                                const belongs =
                                    [
                                        shift
                                            ?.employeeId,
                                        shift
                                            ?.userId
                                    ]
                                        .map(String)
                                        .includes(
                                            txt(
                                                candidate
                                                    ?.id ??
                                                candidate
                                                    ?.userId
                                            )
                                        );

                                const running =
                                    [
                                        "RUNNING",
                                        "ACTIVE"
                                    ].includes(
                                        status
                                    ) ||
                                    (
                                        Boolean(
                                            shift
                                                ?.startTime ??
                                            shift
                                                ?.checkinTime
                                        ) &&
                                        !Boolean(
                                            shift
                                                ?.endTime ??
                                            shift
                                                ?.checkoutTime
                                        )
                                    );

                                return (
                                    belongs &&
                                    running
                                );
                            }
                        );

                const score =
                    (
                        knowsObject
                            ? 100
                            : 60
                    ) +
                    (
                        runningShift
                            ? -10
                            : 10
                    );

                return {
                    user:
                        candidate,

                    score,

                    knowsObject,

                    runningShift,

                    reason:
                        knowsObject
                            ? "Kennt das Objekt bereits."
                            : "Aktiver Mitarbeiter aus einem anderen Objekt."
                };
            }
        )
        .sort(
            (first, second) =>
                second.score -
                    first.score ||
                userName(
                    first.user
                ).localeCompare(
                    userName(
                        second.user
                    ),
                    "de"
                )
        );
}

function ensureAbsenceDraft(state) {
    const objects =
        absenceObjectsForUser(
            state
        );

    const availableObjectIds =
        objects
            .map(objectId);

    const currentObjectId =
        objectId(
            state?.currentObject
        );

    if (
        ![
            "VACATION_REQUEST",
            "SICK_REPORT"
        ].includes(
            txt(
                runtime
                    .absenceDraft
                    .type
            ).toUpperCase()
        )
    ) {
        runtime.absenceDraft.type =
            "VACATION_REQUEST";
    }

    if (
        !availableObjectIds.includes(
            txt(
                runtime
                    .absenceDraft
                    .objectId
            )
        )
    ) {
        runtime.absenceDraft.objectId =
            availableObjectIds.includes(
                currentObjectId
            )
                ? currentObjectId
                : (
                    availableObjectIds[0] ??
                    ""
                );
    }

    runtime.absenceDraft.startOffset =
        Number.isInteger(
            Number(
                runtime
                    .absenceDraft
                    .startOffset
            )
        )
            ? Number(
                runtime
                    .absenceDraft
                    .startOffset
            )
            : (
                runtime
                    .absenceDraft
                    .type ===
                    "SICK_REPORT"
                    ? 0
                    : 1
            );

    runtime.absenceDraft.durationDays =
        Math.max(
            1,
            Math.min(
                30,
                Number(
                    runtime
                        .absenceDraft
                        .durationDays
                ) || 1
            )
        );

    return {
        draft:
            runtime.absenceDraft,

        objects
    };
}

function absenceDraftDates() {
    const startDate =
        dateWithOffset(
            runtime
                .absenceDraft
                .startOffset
        );

    const endDate =
        addDaysToIso(
            startDate,
            runtime
                .absenceDraft
                .durationDays -
                1
        );

    return {
        startDate,
        endDate
    };
}

function notificationEntry({
    recipientUserId,
    type,
    title,
    message,
    request,
    createdByUser
}) {
    const timestamp =
        new Date()
            .toISOString();

    return {
        id:
            createId(
                "NOTIFICATION"
            ),

        type,

        status:
            "UNREAD",

        recipientUserId:
            txt(
                recipientUserId
            ),

        title:
            txt(title),

        message:
            txt(message),

        requestId:
            txt(request?.id),

        objectId:
            txt(
                request?.objectId
            ),

        createdByUserId:
            txt(
                createdByUser?.id ??
                createdByUser?.userId
            ),

        createdAt:
            timestamp,

        updatedAt:
            timestamp,

        source:
            "LOCAL_TEST"
    };
}

function notifyUser(options) {
    if (
        !txt(
            options
                ?.recipientUserId
        )
    ) {
        return null;
    }

    return addCollectionEntry(
        "notifications",
        notificationEntry(
            options
        ),
        {
            notify:
                false,

            persist:
                true
        }
    );
}

function createAbsenceRequest(state) {
    if (
        normalizedRole(state) !==
        "MITARBEITER"
    ) {
        throw new Error(
            "Nur Mitarbeiter können eine Abwesenheit melden."
        );
    }

    const {
        draft,
        objects
    } =
        ensureAbsenceDraft(
            state
        );

    const selectedObject =
        objects.find(
            (object) =>
                objectId(object) ===
                txt(
                    draft.objectId
                )
        );

    if (!selectedObject) {
        throw new Error(
            "Bitte wähle ein gültiges Objekt aus."
        );
    }

    const {
        startDate,
        endDate
    } =
        absenceDraftDates();

    const timestamp =
        new Date()
            .toISOString();

    const user =
        state?.currentUser ?? {};

    const type =
        txt(draft.type)
            .toUpperCase();

    const request = {
        id:
            createId(
                "ABSENCE"
            ),

        category:
            "ABSENCE",

        type,

        status:
            type ===
            "SICK_REPORT"
                ? "REPORTED"
                : "PENDING_APPROVAL",

        priority:
            type ===
            "SICK_REPORT"
                ? "HIGH"
                : "NORMAL",

        employeeId:
            currentUserId(state),

        employeeName:
            userName(user),

        objectId:
            objectId(
                selectedObject
            ),

        objectName:
            objectName(
                selectedObject
            ),

        objectLeaderId:
            txt(
                selectedObject
                    ?.objectLeaderId ??
                selectedObject
                    ?.managerId ??
                selectedObject
                    ?.leaderId
            ),

        startDate,

        endDate,

        durationDays:
            Number(
                draft.durationDays
            ),

        certificateStatus:
            type ===
            "SICK_REPORT"
                ? txt(
                    draft
                        .certificateStatus
                ) ||
                    "UNKNOWN"
                : "",

        replacementStatus:
            "OPEN",

        replacementEmployeeId:
            "",

        replacementEmployeeName:
            "",

        createdAt:
            timestamp,

        updatedAt:
            timestamp,

        source:
            "LOCAL_TEST"
    };

    addCollectionEntry(
        "tickets",
        request,
        {
            notify:
                false,

            persist:
                true
        }
    );

    notifyUser({
        recipientUserId:
            request
                .objectLeaderId,

        type:
            "ABSENCE_REPORTED",

        title:
            absenceTypeLabel(
                request.type
            ),

        message:
            `${request.employeeName}: ${absencePeriodLabel(
                request
            )} · ${request.objectName}`,

        request,

        createdByUser:
            user
    });

    runtime.absenceConfirmation =
        request;

    runtime.absenceNotice =
        null;

    runtime.replacementSearchRequestId =
        "";

    renderApp(runtime);

    return request;
}

function canManageAbsence(
    state,
    request
) {
    const role =
        normalizedRole(state);

    if (
        [
            "SUPER_ADMIN",
            "ADMIN"
        ].includes(role)
    ) {
        return true;
    }

    if (
        role !==
        "OBJEKTLEITER"
    ) {
        return false;
    }

    return managedAbsenceObjectIds(
        state
    ).includes(
        txt(
            request?.objectId
        )
    );
}

function findAbsenceRequest(
    state,
    requestId
) {
    return absenceEntries(
        state
    ).find(
        (request) =>
            txt(
                request?.id
            ) ===
            txt(requestId)
    ) ?? null;
}

function updateAbsenceRequest(
    state,
    requestId,
    changes
) {
    const request =
        findAbsenceRequest(
            state,
            requestId
        );

    if (!request) {
        throw new Error(
            "Die Abwesenheitsmeldung wurde nicht gefunden."
        );
    }

    if (
        !canManageAbsence(
            state,
            request
        )
    ) {
        throw new Error(
            "Für diese Abwesenheitsmeldung fehlt die Berechtigung."
        );
    }

    const timestamp =
        new Date()
            .toISOString();

    return updateCollectionEntry(
        "tickets",
        requestId,
        {
            ...changes,

            updatedAt:
                timestamp,

            reviewedByUserId:
                currentUserId(
                    state
                ),

            reviewedByUserName:
                userName(
                    state
                        ?.currentUser
                )
        },
        {
            notify:
                false,

            persist:
                true
        }
    );
}

function handleAbsenceManagerAction(
    state,
    requestId,
    action
) {
    const request =
        findAbsenceRequest(
            state,
            requestId
        );

    if (!request) {
        throw new Error(
            "Die Abwesenheitsmeldung wurde nicht gefunden."
        );
    }

    if (
        !canManageAbsence(
            state,
            request
        )
    ) {
        throw new Error(
            "Für diese Abwesenheitsmeldung fehlt die Berechtigung."
        );
    }

    if (
        action ===
        "search"
    ) {
        runtime
            .replacementSearchRequestId =
            txt(requestId);

        runtime.absenceNotice =
            null;

        renderApp(runtime);
        return;
    }

    const actionConfig = {
        approve: {
            allowedType:
                "VACATION_REQUEST",

            allowedStatuses: [
                "PENDING_APPROVAL"
            ],

            status:
                "APPROVED",

            notice:
                "Der Urlaubsantrag wurde genehmigt.",

            notificationTitle:
                "Urlaub genehmigt",

            notificationMessage:
                `Dein Urlaubsantrag für ${absencePeriodLabel(
                    request
                )} wurde genehmigt.`
        },

        reject: {
            allowedType:
                "VACATION_REQUEST",

            allowedStatuses: [
                "PENDING_APPROVAL"
            ],

            status:
                "REJECTED",

            notice:
                "Der Urlaubsantrag wurde abgelehnt.",

            notificationTitle:
                "Urlaubsantrag abgelehnt",

            notificationMessage:
                `Dein Urlaubsantrag für ${absencePeriodLabel(
                    request
                )} wurde abgelehnt.`
        },

        acknowledge: {
            allowedType:
                "SICK_REPORT",

            allowedStatuses: [
                "REPORTED"
            ],

            status:
                "ACKNOWLEDGED",

            notice:
                "Die Krankmeldung wurde zur Kenntnis genommen.",

            notificationTitle:
                "Krankmeldung bestätigt",

            notificationMessage:
                `Deine Krankmeldung für ${absencePeriodLabel(
                    request
                )} wurde zur Kenntnis genommen.`
        }
    }[action];

    if (!actionConfig) {
        throw new Error(
            "Unbekannte Bearbeitungsaktion."
        );
    }

    if (
        txt(request?.type)
            .toUpperCase() !==
            actionConfig
                .allowedType ||
        !actionConfig
            .allowedStatuses
            .includes(
                txt(
                    request?.status
                ).toUpperCase()
            )
    ) {
        throw new Error(
            "Diese Aktion ist für den aktuellen Vorgang nicht zulässig."
        );
    }

    const updated =
        updateAbsenceRequest(
            state,
            requestId,
            {
                status:
                    actionConfig
                        .status,

                reviewedAt:
                    new Date()
                        .toISOString()
            }
        );

    notifyUser({
        recipientUserId:
            request.employeeId,

        type:
            "ABSENCE_STATUS_CHANGED",

        title:
            actionConfig
                .notificationTitle,

        message:
            actionConfig
                .notificationMessage,

        request:
            updated,

        createdByUser:
            state?.currentUser
    });

    runtime.absenceNotice = {
        tone:
            action ===
            "reject"
                ? "danger"
                : "success",

        text:
            actionConfig
                .notice
    };

    runtime
        .replacementSearchRequestId =
        "";

    renderApp(runtime);
}

function assignReplacement(
    state,
    requestId,
    candidateId
) {
    const request =
        findAbsenceRequest(
            state,
            requestId
        );

    if (!request) {
        throw new Error(
            "Die Abwesenheitsmeldung wurde nicht gefunden."
        );
    }

    if (
        !canManageAbsence(
            state,
            request
        )
    ) {
        throw new Error(
            "Für diese Vertretungszuordnung fehlt die Berechtigung."
        );
    }

    const candidate =
        replacementCandidates(
            state,
            request
        ).find(
            (entry) =>
                txt(
                    entry?.user?.id ??
                    entry?.user?.userId
                ) ===
                txt(candidateId)
        )?.user;

    if (!candidate) {
        throw new Error(
            "Der ausgewählte Mitarbeiter ist für diesen Zeitraum nicht verfügbar."
        );
    }

    const timestamp =
        new Date()
            .toISOString();

    const updated =
        updateAbsenceRequest(
            state,
            requestId,
            {
                replacementStatus:
                    "ASSIGNED",

                replacementEmployeeId:
                    txt(
                        candidate?.id ??
                        candidate?.userId
                    ),

                replacementEmployeeName:
                    userName(
                        candidate
                    ),

                replacementAssignedAt:
                    timestamp,

                replacementAssignedByUserId:
                    currentUserId(
                        state
                    ),

                replacementAssignedByUserName:
                    userName(
                        state
                            ?.currentUser
                    )
            }
        );

    notifyUser({
        recipientUserId:
            updated
                .replacementEmployeeId,

        type:
            "REPLACEMENT_ASSIGNMENT",

        title:
            "Vertretung zugeordnet",

        message:
            `${updated.objectName}: ${absencePeriodLabel(
                updated
            )}. Du wurdest als Vertretung eingetragen.`,

        request:
            updated,

        createdByUser:
            state?.currentUser
    });

    notifyUser({
        recipientUserId:
            updated.employeeId,

        type:
            "REPLACEMENT_FOUND",

        title:
            "Vertretung gefunden",

        message:
            `${updated.replacementEmployeeName} übernimmt die Vertretung für ${updated.objectName}.`,

        request:
            updated,

        createdByUser:
            state?.currentUser
    });

    runtime.absenceNotice = {
        tone:
            "success",

        text:
            `${updated.replacementEmployeeName} wurde als Vertretung eingetragen.`
    };

    runtime
        .replacementSearchRequestId =
        "";

    renderApp(runtime);
}

function certificateLabel(value) {
    return ({
        AVAILABLE:
            "AU / eAU vorhanden",

        UNKNOWN:
            "AU-Status noch offen",

        NOT_REQUIRED:
            "Keine AU erforderlich"
    }[
        txt(value)
            .toUpperCase()
    ] ?? "AU-Status noch offen");
}

function renderAbsenceNotice() {
    const notice =
        runtime.absenceNotice;

    if (!notice?.text) {
        return "";
    }

    return `
        <div
            class="absence-notice ${esc(
                notice.tone ??
                "success"
            )}"
            role="status"
        >
            ${esc(
                notice.text
            )}
        </div>
    `;
}

function renderEmployeeAbsenceConfirmation(
    request
) {
    return `
        <article
            class="absence-confirmation-card"
            aria-live="polite"
        >
            <div
                class="absence-confirmation-symbol"
                aria-hidden="true"
            >
                &#10003;
            </div>

            <div>
                <span class="eyebrow">
                    MELDUNG GESPEICHERT
                </span>

                <h2>
                    ${esc(
                        absenceTypeLabel(
                            request?.type
                        )
                    )} wurde erfasst
                </h2>

                <p>
                    Die zuständige Objektleitung wurde
                    über den Vorgang informiert.
                </p>
            </div>

            <div
                class="absence-detail-list"
            >
                <div>
                    <span>Vorgangsnummer</span>
                    <strong>
                        ${esc(
                            request?.id
                        )}
                    </strong>
                </div>

                <div>
                    <span>Objekt</span>
                    <strong>
                        ${esc(
                            request
                                ?.objectName
                        )}
                    </strong>
                </div>

                <div>
                    <span>Zeitraum</span>
                    <strong>
                        ${esc(
                            absencePeriodLabel(
                                request
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <span>Status</span>
                    <strong>
                        ${esc(
                            absenceStatusLabel(
                                request
                                    ?.status
                            )
                        )}
                    </strong>
                </div>
            </div>

            <div
                class="absence-action-grid"
            >
                <button
                    type="button"
                    class="primary"
                    data-absence-confirmation-action="new"
                >
                    Weitere Meldung
                </button>

                <button
                    type="button"
                    class="secondary"
                    data-absence-confirmation-action="overview"
                >
                    Zur Übersicht
                </button>
            </div>
        </article>
    `;
}

function renderAbsenceDraftPanel(
    state
) {
    const {
        draft,
        objects
    } =
        ensureAbsenceDraft(
            state
        );

    const isSick =
        draft.type ===
        "SICK_REPORT";

    const startOptions =
        isSick
            ? [
                [
                    -1,
                    "Gestern"
                ],
                [
                    0,
                    "Heute"
                ]
            ]
            : [
                [
                    1,
                    "Morgen"
                ],
                [
                    7,
                    "In 1 Woche"
                ],
                [
                    14,
                    "In 2 Wochen"
                ],
                [
                    30,
                    "In 30 Tagen"
                ]
            ];

    const durationOptions =
        isSick
            ? [
                1,
                2,
                3,
                5,
                7
            ]
            : [
                1,
                2,
                3,
                5,
                7,
                10,
                14
            ];

    const {
        startDate,
        endDate
    } =
        absenceDraftDates();

    return `
        <section
            class="absence-form-card"
        >
            <div
                class="absence-section-heading"
            >
                <div>
                    <h2>
                        Abwesenheit melden
                    </h2>

                    <p>
                        Ohne Freitext und ohne medizinische
                        Diagnose. Alle Angaben erfolgen über
                        große, mobile Schaltflächen.
                    </p>
                </div>
            </div>

            <div
                class="absence-field-group"
            >
                <strong>
                    1. Art auswählen
                </strong>

                <div
                    class="absence-choice-grid two"
                >
                    <button
                        type="button"
                        class="${draft.type === "VACATION_REQUEST" ? "selected" : ""}"
                        data-absence-mode="VACATION_REQUEST"
                    >
                        Urlaub beantragen
                    </button>

                    <button
                        type="button"
                        class="${draft.type === "SICK_REPORT" ? "selected" : ""}"
                        data-absence-mode="SICK_REPORT"
                    >
                        Krankmelden
                    </button>
                </div>
            </div>

            <div
                class="absence-field-group"
            >
                <strong>
                    2. Objekt auswählen
                </strong>

                <div
                    class="absence-choice-grid"
                >
                    ${objects.map(
                        (object) => {
                            const id =
                                objectId(
                                    object
                                );

                            return `
                                <button
                                    type="button"
                                    class="${draft.objectId === id ? "selected" : ""}"
                                    data-absence-object-id="${esc(
                                        id
                                    )}"
                                >
                                    ${esc(
                                        objectName(
                                            object
                                        )
                                    )}
                                </button>
                            `;
                        }
                    ).join("") || `
                        <div
                            class="absence-empty"
                        >
                            Für diesen Mitarbeiter ist kein
                            Objekt zugewiesen.
                        </div>
                    `}
                </div>
            </div>

            <div
                class="absence-field-group"
            >
                <strong>
                    3. Beginn
                </strong>

                <div
                    class="absence-choice-grid"
                >
                    ${startOptions.map(
                        ([
                            offset,
                            label
                        ]) => `
                            <button
                                type="button"
                                class="${Number(draft.startOffset) === Number(offset) ? "selected" : ""}"
                                data-absence-start-offset="${offset}"
                            >
                                ${esc(label)}
                            </button>
                        `
                    ).join("")}
                </div>

                <div
                    class="absence-date-stepper"
                >
                    <button
                        type="button"
                        data-absence-start-shift="-1"
                        ${(
                            isSick &&
                            Number(draft.startOffset) <= -7
                        ) || (
                            !isSick &&
                            Number(draft.startOffset) <= 1
                        )
                            ? "disabled"
                            : ""
                        }
                    >
                        &minus; 1 Tag
                    </button>

                    <strong>
                        ${esc(
                            formatDateOnly(
                                startDate
                            )
                        )}
                    </strong>

                    <button
                        type="button"
                        data-absence-start-shift="1"
                        ${(
                            isSick &&
                            Number(draft.startOffset) >= 0
                        ) || (
                            !isSick &&
                            Number(draft.startOffset) >= 365
                        )
                            ? "disabled"
                            : ""
                        }
                    >
                        + 1 Tag
                    </button>
                </div>
            </div>

            <div
                class="absence-field-group"
            >
                <strong>
                    4. Dauer in Kalendertagen
                </strong>

                <div
                    class="absence-choice-grid compact"
                >
                    ${durationOptions.map(
                        (days) => `
                            <button
                                type="button"
                                class="${Number(draft.durationDays) === days ? "selected" : ""}"
                                data-absence-duration="${days}"
                            >
                                ${days}
                            </button>
                        `
                    ).join("")}
                </div>

                <div
                    class="absence-date-stepper"
                >
                    <button
                        type="button"
                        data-absence-duration-shift="-1"
                        ${Number(draft.durationDays) <= 1
                            ? "disabled"
                            : ""
                        }
                    >
                        &minus; 1 Tag
                    </button>

                    <strong>
                        ${Number(
                            draft.durationDays
                        )}
                        Tag${Number(
                            draft.durationDays
                        ) === 1 ? "" : "e"}
                    </strong>

                    <button
                        type="button"
                        data-absence-duration-shift="1"
                        ${Number(draft.durationDays) >= 30
                            ? "disabled"
                            : ""
                        }
                    >
                        + 1 Tag
                    </button>
                </div>
            </div>

            ${isSick
                ? `
                    <div
                        class="absence-field-group"
                    >
                        <strong>
                            5. AU-Status
                        </strong>

                        <div
                            class="absence-choice-grid"
                        >
                            ${[
                                [
                                    "UNKNOWN",
                                    "Noch offen"
                                ],
                                [
                                    "AVAILABLE",
                                    "AU / eAU vorhanden"
                                ],
                                [
                                    "NOT_REQUIRED",
                                    "Keine AU erforderlich"
                                ]
                            ].map(
                                ([
                                    value,
                                    label
                                ]) => `
                                    <button
                                        type="button"
                                        class="${draft.certificateStatus === value ? "selected" : ""}"
                                        data-absence-certificate="${value}"
                                    >
                                        ${esc(label)}
                                    </button>
                                `
                            ).join("")}
                        </div>
                    </div>
                `
                : ""
            }

            <div
                class="absence-period-preview"
            >
                <span>
                    Gewählter Zeitraum
                </span>

                <strong>
                    ${esc(
                        formatDateOnly(
                            startDate
                        )
                    )}
                    ${startDate === endDate
                        ? ""
                        : ` bis ${esc(
                            formatDateOnly(
                                endDate
                            )
                        )}`
                    }
                </strong>

                <small>
                    ${Number(
                        draft.durationDays
                    )} Kalendertag${Number(
                        draft.durationDays
                    ) === 1 ? "" : "e"}
                    ·
                    ${esc(
                        absenceTypeLabel(
                            draft.type
                        )
                    )}
                </small>
            </div>

            <button
                type="button"
                class="primary absence-submit-button"
                data-absence-submit
                ${objects.length
                    ? ""
                    : "disabled"
                }
            >
                ${isSick
                    ? "Krankmeldung absenden"
                    : "Urlaubsantrag absenden"
                }
            </button>

            <div
                id="absence-form-message"
                class="message"
                aria-live="polite"
            ></div>
        </section>
    `;
}

function renderReplacementCandidates(
    state,
    request
) {
    const candidates =
        replacementCandidates(
            state,
            request
        );

    return `
        <div
            class="replacement-search-panel"
        >
            <div>
                <strong>
                    Automatische Vorschläge
                </strong>

                <p>
                    Geprüft werden aktive Mitarbeiter,
                    Objektzuordnung und überschneidende
                    Abwesenheiten.
                </p>
            </div>

            ${candidates.length
                ? candidates.map(
                    (
                        candidate,
                        index
                    ) => `
                        <article
                            class="replacement-candidate"
                        >
                            <div>
                                <small>
                                    Vorschlag
                                    ${index + 1}
                                </small>

                                <strong>
                                    ${esc(
                                        userName(
                                            candidate
                                                .user
                                        )
                                    )}
                                </strong>

                                <span>
                                    ${esc(
                                        candidate
                                            .reason
                                    )}
                                    ${candidate.runningShift
                                        ? " Aktuell läuft eine Schicht."
                                        : ""
                                    }
                                </span>
                            </div>

                            <button
                                type="button"
                                class="primary"
                                data-replacement-request-id="${esc(
                                    request?.id
                                )}"
                                data-replacement-candidate-id="${esc(
                                    candidate
                                        ?.user
                                        ?.id ??
                                    candidate
                                        ?.user
                                        ?.userId
                                )}"
                            >
                                Als Vertretung eintragen
                            </button>
                        </article>
                    `
                ).join("")
                : `
                    <div
                        class="absence-empty"
                    >
                        Für diesen Zeitraum wurde kein
                        verfügbarer Mitarbeiter gefunden.
                    </div>
                `
            }
        </div>
    `;
}

function renderAbsenceRequestCard(
    state,
    request,
    {
        management = false,
        accounting = false
    } = {}
) {
    const type =
        txt(request?.type)
            .toUpperCase();

    const status =
        txt(request?.status)
            .toUpperCase();

    const searchOpen =
        runtime
            .replacementSearchRequestId ===
        txt(request?.id);

    const replacementAssigned =
        txt(
            request
                ?.replacementStatus
        ).toUpperCase() ===
        "ASSIGNED";

    const canSearch =
        management &&
        ![
            "REJECTED",
            "CANCELLED"
        ].includes(status) &&
        !replacementAssigned;

    return `
        <article
            class="absence-request-card"
        >
            <div
                class="absence-request-topline"
            >
                <span
                    class="absence-type-badge"
                >
                    ${esc(
                        absenceTypeLabel(
                            type
                        )
                    )}
                </span>

                <span
                    class="absence-status-badge ${esc(
                        absenceStatusTone(
                            status
                        )
                    )}"
                >
                    ${esc(
                        absenceStatusLabel(
                            status
                        )
                    )}
                </span>
            </div>

            <h3>
                ${management || accounting
                    ? esc(
                        request
                            ?.employeeName
                    )
                    : esc(
                        request
                            ?.objectName
                    )
                }
            </h3>

            <div
                class="absence-detail-list"
            >
                ${(management || accounting)
                    ? `
                        <div>
                            <span>Objekt</span>
                            <strong>
                                ${esc(
                                    request
                                        ?.objectName
                                )}
                            </strong>
                        </div>
                    `
                    : ""
                }

                <div>
                    <span>Zeitraum</span>
                    <strong>
                        ${esc(
                            absencePeriodLabel(
                                request
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <span>Dauer</span>
                    <strong>
                        ${Number(
                            request
                                ?.durationDays
                        ) || 1}
                        Kalendertag${Number(
                            request
                                ?.durationDays
                        ) === 1
                            ? ""
                            : "e"
                        }
                    </strong>
                </div>

                ${type ===
                    "SICK_REPORT"
                    ? `
                        <div>
                            <span>AU-Status</span>
                            <strong>
                                ${esc(
                                    certificateLabel(
                                        request
                                            ?.certificateStatus
                                    )
                                )}
                            </strong>
                        </div>
                    `
                    : ""
                }

                <div>
                    <span>Vertretung</span>
                    <strong>
                        ${esc(
                            replacementStatusLabel(
                                request
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <span>Vorgang</span>
                    <strong>
                        ${esc(
                            request?.id
                        )}
                    </strong>
                </div>
            </div>

            ${management
                ? `
                    <div
                        class="absence-manager-actions"
                    >
                        ${type ===
                            "VACATION_REQUEST" &&
                            status ===
                            "PENDING_APPROVAL"
                            ? `
                                <button
                                    type="button"
                                    class="primary"
                                    data-absence-manager-action="approve"
                                    data-absence-request-id="${esc(
                                        request?.id
                                    )}"
                                >
                                    Genehmigen
                                </button>

                                <button
                                    type="button"
                                    class="danger-button"
                                    data-absence-manager-action="reject"
                                    data-absence-request-id="${esc(
                                        request?.id
                                    )}"
                                >
                                    Ablehnen
                                </button>
                            `
                            : ""
                        }

                        ${type ===
                            "SICK_REPORT" &&
                            status ===
                            "REPORTED"
                            ? `
                                <button
                                    type="button"
                                    class="primary"
                                    data-absence-manager-action="acknowledge"
                                    data-absence-request-id="${esc(
                                        request?.id
                                    )}"
                                >
                                    Zur Kenntnis nehmen
                                </button>
                            `
                            : ""
                        }

                        ${canSearch
                            ? `
                                <button
                                    type="button"
                                    class="secondary"
                                    data-absence-manager-action="search"
                                    data-absence-request-id="${esc(
                                        request?.id
                                    )}"
                                >
                                    Vertretung suchen
                                </button>
                            `
                            : ""
                        }
                    </div>
                `
                : ""
            }

            ${searchOpen
                ? renderReplacementCandidates(
                    state,
                    request
                )
                : ""
            }
        </article>
    `;
}

function renderEmployeeAbsencePage(
    state
) {
    const requests =
        visibleAbsenceRequests(
            state
        )
            .sort(
                (first, second) =>
                    String(
                        second?.createdAt ??
                        ""
                    ).localeCompare(
                        String(
                            first?.createdAt ??
                            ""
                        )
                    )
            );

    if (
        runtime
            .absenceConfirmation
    ) {
        return renderEmployeeAbsenceConfirmation(
            runtime
                .absenceConfirmation
        );
    }

    return `
        ${renderAbsenceDraftPanel(
            state
        )}

        <section
            class="absence-list-section"
        >
            <div
                class="absence-section-heading"
            >
                <div>
                    <h2>
                        Meine Meldungen
                    </h2>

                    <p>
                        Status, Zeitraum und eingetragene
                        Vertretung.
                    </p>
                </div>

                <strong>
                    ${requests.length}
                </strong>
            </div>

            <div
                class="absence-request-list"
            >
                ${requests.length
                    ? requests.map(
                        (request) =>
                            renderAbsenceRequestCard(
                                state,
                                request
                            )
                    ).join("")
                    : `
                        <div
                            class="absence-empty"
                        >
                            Noch keine Urlaubsanträge oder
                            Krankmeldungen vorhanden.
                        </div>
                    `
                }
            </div>
        </section>
    `;
}

function renderManagerAbsencePage(
    state
) {
    const requests =
        visibleAbsenceRequests(
            state
        )
            .sort(
                (first, second) =>
                    String(
                        first?.startDate ??
                        ""
                    ).localeCompare(
                        String(
                            second?.startDate ??
                            ""
                        )
                    )
            );

    const pendingVacation =
        requests.filter(
            (request) =>
                txt(
                    request?.type
                ).toUpperCase() ===
                    "VACATION_REQUEST" &&
                txt(
                    request?.status
                ).toUpperCase() ===
                    "PENDING_APPROVAL"
        ).length;

    const sickReports =
        requests.filter(
            (request) =>
                txt(
                    request?.type
                ).toUpperCase() ===
                    "SICK_REPORT" &&
                ![
                    "REJECTED",
                    "CANCELLED"
                ].includes(
                    txt(
                        request?.status
                    ).toUpperCase()
                )
        ).length;

    const openReplacements =
        requests.filter(
            (request) =>
                ![
                    "REJECTED",
                    "CANCELLED"
                ].includes(
                    txt(
                        request?.status
                    ).toUpperCase()
                ) &&
                txt(
                    request
                        ?.replacementStatus
                ).toUpperCase() !==
                    "ASSIGNED"
        ).length;

    return `
        ${renderAbsenceNotice()}

        <section
            class="absence-summary-grid"
        >
            <article>
                <span>
                    Urlaubsanträge offen
                </span>
                <strong>
                    ${pendingVacation}
                </strong>
            </article>

            <article>
                <span>
                    Krankmeldungen
                </span>
                <strong>
                    ${sickReports}
                </strong>
            </article>

            <article>
                <span>
                    Vertretung offen
                </span>
                <strong>
                    ${openReplacements}
                </strong>
            </article>
        </section>

        <section
            class="absence-list-section"
        >
            <div
                class="absence-section-heading"
            >
                <div>
                    <h2>
                        Abwesenheiten bearbeiten
                    </h2>

                    <p>
                        Genehmigung, Bestätigung und
                        automatische Vertretungssuche.
                    </p>
                </div>

                <strong>
                    ${requests.length}
                </strong>
            </div>

            <div
                class="absence-request-list"
            >
                ${requests.length
                    ? requests.map(
                        (request) =>
                            renderAbsenceRequestCard(
                                state,
                                request,
                                {
                                    management:
                                        true
                                }
                            )
                    ).join("")
                    : `
                        <div
                            class="absence-empty"
                        >
                            Im Zuständigkeitsbereich sind
                            keine Abwesenheiten vorhanden.
                        </div>
                    `
                }
            </div>
        </section>
    `;
}

function renderAccountingAbsencePage(
    state
) {
    const requests =
        visibleAbsenceRequests(
            state
        )
            .sort(
                (first, second) =>
                    String(
                        second?.startDate ??
                        ""
                    ).localeCompare(
                        String(
                            first?.startDate ??
                            ""
                        )
                    )
            );

    return `
        <section
            class="absence-list-section"
        >
            <div
                class="absence-section-heading"
            >
                <div>
                    <h2>
                        Abwesenheitsübersicht
                    </h2>

                    <p>
                        Schreibgeschützte Ansicht für die
                        Abrechnung und Zeitprüfung.
                    </p>
                </div>

                <strong>
                    ${requests.length}
                </strong>
            </div>

            <div
                class="absence-request-list"
            >
                ${requests.length
                    ? requests.map(
                        (request) =>
                            renderAbsenceRequestCard(
                                state,
                                request,
                                {
                                    accounting:
                                        true
                                }
                            )
                    ).join("")
                    : `
                        <div
                            class="absence-empty"
                        >
                            Keine Abwesenheitsdaten vorhanden.
                        </div>
                    `
                }
            </div>
        </section>
    `;
}

function renderAbsencePage(state) {
    const role =
        normalizedRole(state);

    const allowed =
        [
            "SUPER_ADMIN",
            "ADMIN",
            "OBJEKTLEITER",
            "MITARBEITER",
            "BUCHHALTUNG"
        ].includes(role);

    return `
        <section
            class="content-page absence-page"
        >
            <style>
                .absence-page {
                    display: grid;
                    gap: 18px;
                }

                .absence-back-button {
                    justify-self: start;
                    min-height: 44px;
                    padding: 8px 14px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #08172b;
                    color: var(--text);
                    font-weight: 800;
                }

                .absence-form-card,
                .absence-list-section,
                .absence-confirmation-card {
                    display: grid;
                    gap: 18px;
                    padding: 20px;
                    border: 1px solid var(--border);
                    border-radius: 18px;
                    background: var(--panel);
                    box-shadow:
                        0 16px 45px
                        rgba(0, 0, 0, .14);
                }

                .absence-section-heading {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 16px;
                }

                .absence-section-heading h2,
                .absence-section-heading p,
                .absence-confirmation-card h2,
                .absence-confirmation-card p {
                    margin: 0;
                }

                .absence-section-heading p,
                .absence-confirmation-card p {
                    margin-top: 5px;
                    color: var(--soft);
                    line-height: 1.5;
                }

                .absence-section-heading > strong {
                    display: grid;
                    min-width: 42px;
                    min-height: 42px;
                    place-items: center;
                    border-radius: 12px;
                    background: #10233f;
                    color: var(--text);
                }

                .absence-field-group {
                    display: grid;
                    gap: 10px;
                }

                .absence-field-group > strong {
                    color: var(--soft);
                }

                .absence-choice-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 9px;
                }

                .absence-choice-grid.compact {
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                }

                .absence-choice-grid button {
                    min-width: 0;
                    min-height: 50px;
                    padding: 10px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #08172b;
                    color: var(--text);
                    font-weight: 800;
                    line-height: 1.25;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color:
                        transparent;
                }

                .absence-choice-grid button.selected {
                    border-color: var(--blue);
                    background:
                        rgba(95, 127, 255, .25);
                    box-shadow:
                        0 0 0 2px var(--blue);
                }

                .absence-date-stepper {
                    display: grid;
                    grid-template-columns:
                        minmax(92px, auto)
                        minmax(0, 1fr)
                        minmax(92px, auto);
                    align-items: center;
                    gap: 9px;
                }

                .absence-date-stepper button {
                    min-height: 46px;
                    padding: 8px 10px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #10233f;
                    color: var(--text);
                    font-weight: 800;
                    touch-action: manipulation;
                }

                .absence-date-stepper button:disabled {
                    opacity: .42;
                }

                .absence-date-stepper strong {
                    display: grid;
                    min-height: 46px;
                    place-items: center;
                    padding: 8px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #08172b;
                    text-align: center;
                }

                .absence-period-preview {
                    display: grid;
                    gap: 5px;
                    padding: 16px;
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    background: #08172b;
                }

                .absence-period-preview span,
                .absence-period-preview small {
                    color: var(--soft);
                }

                .absence-period-preview strong {
                    font-size: 18px;
                }

                .absence-submit-button {
                    width: 100%;
                    min-height: 54px;
                }

                .absence-summary-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(3, minmax(0, 1fr));
                    gap: 10px;
                }

                .absence-summary-grid article {
                    display: grid;
                    gap: 8px;
                    padding: 16px;
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    background: var(--panel);
                }

                .absence-summary-grid span {
                    color: var(--soft);
                    font-size: 14px;
                    font-weight: 700;
                }

                .absence-summary-grid strong {
                    font-size: 26px;
                }

                .absence-request-list {
                    display: grid;
                    gap: 12px;
                }

                .absence-request-card {
                    display: grid;
                    gap: 14px;
                    padding: 16px;
                    border: 1px solid var(--border);
                    border-radius: 15px;
                    background: #08172b;
                }

                .absence-request-card h3 {
                    margin: 0;
                    font-size: 19px;
                }

                .absence-request-topline {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                }

                .absence-type-badge,
                .absence-status-badge {
                    display: inline-flex;
                    min-height: 30px;
                    align-items: center;
                    padding: 5px 10px;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 900;
                }

                .absence-type-badge {
                    background:
                        rgba(95, 127, 255, .2);
                    color: #aebeff;
                }

                .absence-status-badge.warning {
                    background:
                        rgba(255, 171, 64, .16);
                    color: #ffc56f;
                }

                .absence-status-badge.success {
                    background:
                        rgba(39, 174, 96, .18);
                    color: #7df0b1;
                }

                .absence-status-badge.danger {
                    background:
                        rgba(235, 87, 87, .18);
                    color: #ff9c9c;
                }

                .absence-status-badge.muted {
                    background:
                        rgba(255, 255, 255, .08);
                    color: var(--soft);
                }

                .absence-detail-list {
                    display: grid;
                    overflow: hidden;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                }

                .absence-detail-list > div {
                    display: grid;
                    grid-template-columns:
                        minmax(105px, .8fr)
                        minmax(0, 1.4fr);
                    gap: 12px;
                    padding: 11px 12px;
                    border-bottom:
                        1px solid var(--border);
                }

                .absence-detail-list > div:last-child {
                    border-bottom: 0;
                }

                .absence-detail-list span {
                    color: var(--soft);
                    font-size: 13px;
                    font-weight: 700;
                }

                .absence-detail-list strong {
                    min-width: 0;
                    overflow-wrap: anywhere;
                    text-align: right;
                }

                .absence-manager-actions,
                .absence-action-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 9px;
                }

                .absence-manager-actions button,
                .absence-action-grid button {
                    min-height: 48px;
                    padding: 9px 12px;
                    border-radius: 12px;
                    font-weight: 800;
                }

                .absence-manager-actions .secondary,
                .absence-action-grid .secondary {
                    border: 1px solid var(--border);
                    background: #10233f;
                    color: var(--text);
                }

                .danger-button {
                    border: 1px solid
                        rgba(235, 87, 87, .55);
                    background:
                        rgba(235, 87, 87, .14);
                    color: #ff9c9c;
                }

                .replacement-search-panel {
                    display: grid;
                    gap: 12px;
                    padding: 14px;
                    border: 1px solid
                        rgba(95, 127, 255, .45);
                    border-radius: 14px;
                    background:
                        rgba(95, 127, 255, .08);
                }

                .replacement-search-panel p {
                    margin: 4px 0 0;
                    color: var(--soft);
                    line-height: 1.45;
                }

                .replacement-candidate {
                    display: grid;
                    grid-template-columns:
                        minmax(0, 1fr)
                        minmax(145px, auto);
                    align-items: center;
                    gap: 12px;
                    padding: 13px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #08172b;
                }

                .replacement-candidate div {
                    display: grid;
                    gap: 3px;
                }

                .replacement-candidate small,
                .replacement-candidate span {
                    color: var(--soft);
                }

                .replacement-candidate button {
                    min-height: 44px;
                }

                .absence-notice {
                    padding: 14px 16px;
                    border-radius: 13px;
                    font-weight: 800;
                }

                .absence-notice.success {
                    border: 1px solid
                        rgba(39, 174, 96, .45);
                    background:
                        rgba(39, 174, 96, .14);
                    color: #7df0b1;
                }

                .absence-notice.danger {
                    border: 1px solid
                        rgba(235, 87, 87, .45);
                    background:
                        rgba(235, 87, 87, .14);
                    color: #ff9c9c;
                }

                .absence-confirmation-card {
                    border-color:
                        rgba(39, 174, 96, .45);
                    background:
                        linear-gradient(
                            180deg,
                            rgba(39, 174, 96, .14),
                            var(--panel)
                        );
                }

                .absence-confirmation-symbol {
                    display: grid;
                    width: 64px;
                    height: 64px;
                    place-items: center;
                    border: 2px solid
                        rgba(39, 174, 96, .8);
                    border-radius: 50%;
                    color: #7df0b1;
                    font-size: 32px;
                    font-weight: 900;
                }

                .absence-empty {
                    padding: 16px;
                    border: 1px dashed var(--border);
                    border-radius: 12px;
                    color: var(--soft);
                    line-height: 1.5;
                }

                @media (max-width: 640px) {
                    .absence-summary-grid {
                        grid-template-columns: 1fr;
                    }

                    .absence-choice-grid,
                    .absence-choice-grid.compact,
                    .absence-manager-actions,
                    .absence-action-grid {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }

                    .replacement-candidate {
                        grid-template-columns: 1fr;
                    }

                    .absence-date-stepper {
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                    }

                    .absence-date-stepper strong {
                        grid-column: 1 / -1;
                        grid-row: 1;
                    }
                }

                @media (max-width: 390px) {
                    .absence-form-card,
                    .absence-list-section,
                    .absence-confirmation-card {
                        padding: 16px 13px;
                    }

                    .absence-detail-list > div {
                        grid-template-columns: 1fr;
                        gap: 4px;
                    }

                    .absence-detail-list strong {
                        text-align: left;
                    }
                }
            </style>

            <button
                type="button"
                class="absence-back-button"
                data-more-section-back
            >
                &larr; Zurück
            </button>

            <header
                class="dashboard-heading"
            >
                <div>
                    <span class="eyebrow">
                        ABWESENHEIT
                    </span>

                    <h1>
                        Urlaub, Krankmeldung und Vertretung
                    </h1>

                    <p>
                        ${role === "MITARBEITER"
                            ? "Abwesenheit melden und den Bearbeitungsstatus verfolgen."
                            : role === "BUCHHALTUNG"
                                ? "Abwesenheiten in einer schreibgeschützten Übersicht prüfen."
                                : "Anträge bearbeiten und passende Vertretungen zuordnen."
                        }
                    </p>
                </div>
            </header>

            ${allowed
                ? (
                    role ===
                    "MITARBEITER"
                        ? renderEmployeeAbsencePage(
                            state
                        )
                        : role ===
                            "BUCHHALTUNG"
                            ? renderAccountingAbsencePage(
                                state
                            )
                            : renderManagerAbsencePage(
                                state
                            )
                )
                : `
                    <div
                        class="absence-empty"
                    >
                        Für diese Rolle ist der
                        Abwesenheitsbereich nicht freigegeben.
                    </div>
                `
            }
        </section>
    `;
}

function renderMorePage(state) {
    if (
        runtime.moreSection ===
        "ABSENCE"
    ) {
        return renderAbsencePage(
            state
        );
    }

    const user =
        state?.currentUser ?? {};

    const role =
        normalizedRole(state);

    const absenceAllowed =
        [
            "SUPER_ADMIN",
            "ADMIN",
            "OBJEKTLEITER",
            "MITARBEITER",
            "BUCHHALTUNG"
        ].includes(role);

    const openAbsences =
        visibleAbsenceRequests(
            state
        ).filter(
            (request) =>
                ![
                    "REJECTED",
                    "CANCELLED"
                ].includes(
                    txt(
                        request?.status
                    ).toUpperCase()
                )
        ).length;

    const absenceDescription =
        role ===
        "MITARBEITER"
            ? "Urlaub beantragen oder Krankmeldung absenden"
            : role ===
                "BUCHHALTUNG"
                ? "Abwesenheiten für Zeitprüfung und Abrechnung"
                : "Anträge prüfen und Vertretung organisieren";

    return `
        <section
            class="content-page more-page"
        >
            <header
                class="dashboard-heading"
            >
                <div>
                    <span class="eyebrow">
                        BENUTZERKONTO
                    </span>

                    <h1>
                        Mehr
                    </h1>

                    <p>
                        Profil, Hilfe und weitere Bereiche.
                    </p>
                </div>
            </header>

            <section
                class="dashboard-panel"
            >
                <div
                    class="account-summary"
                >
                    <span
                        class="profile-avatar"
                    >
                        ${esc(
                            userName(user)
                                .slice(0, 2)
                                .toUpperCase()
                        )}
                    </span>

                    <div>
                        <strong>
                            ${esc(
                                userName(user)
                            )}
                        </strong>

                        <small>
                            ${esc(
                                roleLabel(
                                    user?.role
                                )
                            )}
                        </small>
                    </div>
                </div>
            </section>

            <section
                class="dashboard-panel"
            >
                <div
                    class="section-list"
                >
                    ${absenceAllowed
                        ? `
                            <button
                                class="settings-row"
                                data-more-section="ABSENCE"
                                type="button"
                            >
                                <span>
                                    Urlaub, Krankmeldung und Vertretung
                                </span>

                                <small>
                                    ${esc(
                                        absenceDescription
                                    )}
                                    · ${openAbsences} Vorgang${openAbsences === 1 ? "" : "e"}
                                </small>
                            </button>
                        `
                        : ""
                    }

                    <button
                        class="settings-row"
                        data-route="${ROUTES.HELP}"
                        type="button"
                    >
                        <span>
                            Hilfe und Support
                        </span>

                        <small>
                            Objekt-Guide und Hilfebereich
                        </small>
                    </button>

                    <button
                        class="settings-row"
                        data-route="${ROUTES.SETTINGS}"
                        type="button"
                    >
                        <span>
                            Einstellungen
                        </span>

                        <small>
                            Benutzer- und App-Einstellungen
                        </small>
                    </button>
                </div>
            </section>

            <button
                class="mobile-logout-button"
                data-action="logout"
                type="button"
            >
                <span>
                    ${icon("logout")}
                </span>

                Abmelden
            </button>
        </section>
    `;
}


function taskDateKey(value = new Date()) {
    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function taskRole(state) {
    return txt(
        state?.currentUser?.role
    ).toUpperCase();
}

function taskCurrentUserId(state) {
    return txt(
        state?.currentUser?.id ??
        state?.currentUser?.userId
    );
}

function taskObjectsForRole(state) {
    const role =
        taskRole(state);

    const allObjects =
        arr(state?.objects)
            .filter(
                (object) =>
                    object?.active !== false
            );

    if (
        [
            "SUPER_ADMIN",
            "ADMIN"
        ].includes(role)
    ) {
        return allObjects;
    }

    if (
        role ===
        "OBJEKTLEITER"
    ) {
        const allowedIds =
            managedAbsenceObjectIds(
                state
            );

        return allObjects.filter(
            (object) =>
                allowedIds.includes(
                    objectId(object)
                )
        );
    }

    if (
        role ===
        "MITARBEITER"
    ) {
        return assignedObjects(
            state
        );
    }

    return [];
}

function taskRoomsForObject(
    state,
    selectedObjectId
) {
    return arr(state?.rooms)
        .filter(
            (room) =>
                room?.active !== false &&
                txt(
                    room?.objectId
                ) ===
                txt(
                    selectedObjectId
                )
        )
        .sort(
            (first, second) =>
                Number(
                    first?.sequence ??
                    0
                ) -
                Number(
                    second?.sequence ??
                    0
                )
        );
}

function tasksForRoom(
    state,
    selectedObjectId,
    selectedRoomId
) {
    return arr(state?.tasks)
        .filter(
            (task) =>
                task?.active !== false &&
                txt(
                    task?.objectId
                ) ===
                    txt(
                        selectedObjectId
                    ) &&
                txt(
                    task?.roomId
                ) ===
                    txt(
                        selectedRoomId
                    )
        )
        .sort(
            (first, second) =>
                Number(
                    first?.sequence ??
                    0
                ) -
                Number(
                    second?.sequence ??
                    0
                )
        );
}

function allTasksForObject(
    state,
    selectedObjectId
) {
    return arr(state?.tasks)
        .filter(
            (task) =>
                task?.active !== false &&
                txt(
                    task?.objectId
                ) ===
                txt(
                    selectedObjectId
                )
        );
}

function taskLogDateKey(log) {
    return txt(
        log?.workDate
    ) || taskDateKey(
        log?.completedAt ??
        log?.startedAt ??
        log?.createdAt
    );
}

function activeTaskLogsForToday(
    state,
    selectedObjectId
) {
    const today =
        taskDateKey();

    return arr(state?.taskLogs)
        .filter(
            (log) =>
                txt(
                    log?.objectId
                ) ===
                    txt(
                        selectedObjectId
                    ) &&
                taskLogDateKey(
                    log
                ) ===
                    today &&
                ![
                    "CANCELLED",
                    "DELETED"
                ].includes(
                    txt(
                        log?.status
                    ).toUpperCase()
                )
        );
}

function completedTaskLog(
    state,
    taskId,
    {
        employeeOnly = false
    } = {}
) {
    const employeeId =
        taskCurrentUserId(
            state
        );

    return activeTaskLogsForToday(
        state,
        runtime.taskObjectId
    )
        .filter(
            (log) =>
                txt(
                    log?.taskId
                ) ===
                    txt(taskId) &&
                txt(
                    log?.status
                ).toUpperCase() ===
                    "COMPLETED" &&
                (
                    !employeeOnly ||
                    [
                        log?.userId,
                        log?.employeeId
                    ]
                        .map(String)
                        .includes(
                            employeeId
                        )
                )
        )
        .sort(
            (first, second) =>
                String(
                    second?.completedAt ??
                    ""
                ).localeCompare(
                    String(
                        first?.completedAt ??
                        ""
                    )
                )
        )[0] ?? null;
}

function currentRunningShiftForTasks(
    state
) {
    const employeeId =
        taskCurrentUserId(
            state
        );

    const candidates = [
        state?.currentShift,
        ...arr(
            state?.shifts
        )
    ].filter(Boolean);

    return candidates.find(
        (shift) => {
            const belongs =
                [
                    shift?.userId,
                    shift?.employeeId
                ]
                    .map(String)
                    .includes(
                        employeeId
                    );

            const status =
                txt(
                    shift?.status
                ).toUpperCase();

            const running =
                [
                    "RUNNING",
                    "ACTIVE"
                ].includes(
                    status
                ) ||
                (
                    Boolean(
                        shift?.startTime ??
                        shift?.checkinTime
                    ) &&
                    !Boolean(
                        shift?.endTime ??
                        shift?.checkoutTime
                    ) &&
                    ![
                        "FINISHED",
                        "COMPLETED",
                        "CANCELLED",
                        "CLOSED"
                    ].includes(
                        status
                    )
                );

            return (
                belongs &&
                running
            );
        }
    ) ?? null;
}

function taskEmployeeName(
    state,
    log
) {
    const storedName =
        txt(
            log?.employeeName
        );

    if (storedName) {
        return storedName;
    }

    const employeeId =
        txt(
            log?.employeeId ??
            log?.userId
        );

    const employee =
        arr(state?.users)
            .find(
                (user) =>
                    txt(
                        user?.id ??
                        user?.userId
                    ) ===
                    employeeId
            );

    return employee
        ? userName(employee)
        : "Mitarbeiter";
}

function formatTaskCompletionTime(
    value
) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "de-DE",
        {
            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    ).format(date);
}

function ensureTaskSelection(state) {
    const objects =
        taskObjectsForRole(
            state
        );

    const availableObjectIds =
        objects
            .map(objectId);

    const role =
        taskRole(state);

    const shift =
        role ===
        "MITARBEITER"
            ? currentRunningShiftForTasks(
                state
            )
            : null;

    const preferredObjectId =
        txt(
            shift?.objectId
        ) ||
        objectId(
            state?.currentObject
        );

    if (
        !availableObjectIds.includes(
            txt(
                runtime
                    .taskObjectId
            )
        )
    ) {
        runtime.taskObjectId =
            availableObjectIds.includes(
                preferredObjectId
            )
                ? preferredObjectId
                : (
                    availableObjectIds[0] ??
                    ""
                );
    }

    const rooms =
        taskRoomsForObject(
            state,
            runtime.taskObjectId
        );

    const availableRoomIds =
        rooms
            .map(
                (room) =>
                    txt(room?.id)
            );

    if (
        !availableRoomIds.includes(
            txt(
                runtime
                    .taskRoomId
            )
        )
    ) {
        runtime.taskRoomId =
            availableRoomIds[0] ??
            "";
    }

    return {
        objects,
        rooms,
        shift
    };
}

function taskProgressForRoom(
    state,
    room,
    role
) {
    const tasks =
        tasksForRoom(
            state,
            runtime.taskObjectId,
            room?.id
        );

    const completed =
        tasks.filter(
            (task) =>
                Boolean(
                    completedTaskLog(
                        state,
                        task?.id,
                        {
                            employeeOnly:
                                role ===
                                "MITARBEITER"
                        }
                    )
                )
        ).length;

    return {
        total:
            tasks.length,

        completed
    };
}

function renderTaskNotice() {
    const notice =
        runtime.taskNotice;

    if (!notice?.text) {
        return "";
    }

    return `
        <div
            class="task-notice ${esc(
                notice.tone ??
                "success"
            )}"
            role="status"
        >
            ${esc(
                notice.text
            )}
        </div>
    `;
}

function renderTaskCard(
    state,
    task,
    role,
    shift
) {
    const employeeView =
        role ===
        "MITARBEITER";

    const completedLog =
        completedTaskLog(
            state,
            task?.id,
            {
                employeeOnly:
                    employeeView
            }
        );

    const expanded =
        runtime.taskExpandedId ===
        txt(task?.id);

    const shiftMatchesObject =
        Boolean(
            shift &&
            txt(
                shift?.objectId
            ) ===
            txt(
                runtime.taskObjectId
            )
        );

    const canComplete =
        employeeView &&
        shiftMatchesObject;

    return `
        <article
            class="task-card ${completedLog ? "completed" : ""}"
        >
            <div
                class="task-card-topline"
            >
                <span
                    class="task-category"
                >
                    ${esc(
                        txt(
                            task?.category
                        )
                            .replaceAll(
                                "_",
                                " "
                            ) ||
                        "AUFGABE"
                    )}
                </span>

                <span
                    class="task-status ${completedLog ? "success" : "open"}"
                >
                    ${completedLog
                        ? "Erledigt"
                        : "Offen"
                    }
                </span>
            </div>

            <div
                class="task-card-heading"
            >
                <div>
                    <h3>
                        ${esc(
                            task?.title
                        )}
                    </h3>

                    <p>
                        ${esc(
                            task
                                ?.description
                        )}
                    </p>
                </div>

                <span
                    class="task-minutes"
                >
                    ${Number(
                        task
                            ?.estimatedMinutes
                    ) || 0}
                    Min.
                </span>
            </div>

            ${completedLog
                ? `
                    <div
                        class="task-completion-info"
                    >
                        <strong>
                            ${employeeView
                                ? "Heute erledigt"
                                : esc(
                                    taskEmployeeName(
                                        state,
                                        completedLog
                                    )
                                )
                            }
                        </strong>

                        <span>
                            ${esc(
                                formatTaskCompletionTime(
                                    completedLog
                                        ?.completedAt
                                )
                            )} Uhr
                        </span>
                    </div>
                `
                : ""
            }

            <button
                type="button"
                class="task-detail-toggle"
                data-task-toggle-id="${esc(
                    task?.id
                )}"
                aria-expanded="${expanded ? "true" : "false"}"
            >
                ${expanded
                    ? "Anleitung schließen"
                    : "Anleitung anzeigen"
                }
            </button>

            ${expanded
                ? `
                    <div
                        class="task-instructions"
                    >
                        ${arr(
                            task
                                ?.instructions
                        ).length
                            ? `
                                <ol>
                                    ${arr(
                                        task
                                            ?.instructions
                                    ).map(
                                        (
                                            instruction
                                        ) => `
                                            <li>
                                                ${esc(
                                                    instruction
                                                )}
                                            </li>
                                        `
                                    ).join("")}
                                </ol>
                            `
                            : `
                                <p>
                                    Keine zusätzlichen
                                    Arbeitsschritte hinterlegt.
                                </p>
                            `
                        }

                        ${task?.documentationRequired === true
                            ? `
                                <small>
                                    Hinweis: Bei Abweichungen
                                    oder Problemen ist eine
                                    Dokumentation erforderlich.
                                </small>
                            `
                            : ""
                        }
                    </div>
                `
                : ""
            }

            ${employeeView
                ? `
                    <div
                        class="task-card-actions"
                    >
                        ${completedLog
                            ? `
                                <button
                                    type="button"
                                    class="task-undo-button"
                                    data-task-undo-log-id="${esc(
                                        completedLog?.id
                                    )}"
                                >
                                    Rückgängig
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="primary"
                                    data-task-complete-id="${esc(
                                        task?.id
                                    )}"
                                    ${canComplete
                                        ? ""
                                        : "disabled"
                                    }
                                >
                                    Als erledigt markieren
                                </button>
                            `
                        }
                    </div>
                `
                : ""
            }
        </article>
    `;
}

function renderTaskPage(state) {
    const role =
        taskRole(state);

    const allowed =
        [
            "SUPER_ADMIN",
            "ADMIN",
            "OBJEKTLEITER",
            "MITARBEITER"
        ].includes(role);

    const {
        objects,
        rooms,
        shift
    } =
        ensureTaskSelection(
            state
        );

    const selectedObject =
        objects.find(
            (object) =>
                objectId(object) ===
                runtime.taskObjectId
        );

    const selectedRoom =
        rooms.find(
            (room) =>
                txt(room?.id) ===
                runtime.taskRoomId
        );

    const roomTasks =
        tasksForRoom(
            state,
            runtime.taskObjectId,
            runtime.taskRoomId
        );

    const objectTasks =
        allTasksForObject(
            state,
            runtime.taskObjectId
        );

    const employeeOnly =
        role ===
        "MITARBEITER";

    const completedCount =
        objectTasks.filter(
            (task) =>
                Boolean(
                    completedTaskLog(
                        state,
                        task?.id,
                        {
                            employeeOnly
                        }
                    )
                )
        ).length;

    const remainingCount =
        Math.max(
            0,
            objectTasks.length -
                completedCount
        );

    const completionPercent =
        objectTasks.length
            ? Math.round(
                (
                    completedCount /
                    objectTasks.length
                ) * 100
            )
            : 0;

    const shiftMatchesObject =
        role !==
        "MITARBEITER" ||
        (
            shift &&
            txt(
                shift?.objectId
            ) ===
            txt(
                runtime.taskObjectId
            )
        );

    return `
        <section
            class="content-page task-page"
        >
            <style>
                .task-page {
                    display: grid;
                    gap: 18px;
                }

                .task-page h1,
                .task-page h2,
                .task-page h3,
                .task-page p {
                    margin: 0;
                }

                .task-summary-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(3, minmax(0, 1fr));
                    gap: 10px;
                }

                .task-summary-card {
                    display: grid;
                    gap: 7px;
                    padding: 15px;
                    border: 1px solid var(--border);
                    border-radius: 14px;
                    background: var(--panel);
                }

                .task-summary-card span {
                    color: var(--soft);
                    font-size: 13px;
                    font-weight: 700;
                }

                .task-summary-card strong {
                    font-size: 24px;
                }

                .task-progress-card {
                    display: grid;
                    gap: 10px;
                    padding: 17px;
                    border: 1px solid var(--border);
                    border-radius: 16px;
                    background: var(--panel);
                }

                .task-progress-heading {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }

                .task-progress-track {
                    overflow: hidden;
                    height: 11px;
                    border-radius: 999px;
                    background: #08172b;
                }

                .task-progress-track span {
                    display: block;
                    width: var(--task-progress);
                    height: 100%;
                    border-radius: inherit;
                    background:
                        linear-gradient(
                            90deg,
                            #5f7fff,
                            #5ce29d
                        );
                }

                .task-panel {
                    display: grid;
                    gap: 15px;
                    padding: 18px;
                    border: 1px solid var(--border);
                    border-radius: 17px;
                    background: var(--panel);
                }

                .task-section-heading {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 14px;
                }

                .task-section-heading p {
                    margin-top: 5px;
                    color: var(--soft);
                    line-height: 1.45;
                }

                .task-object-grid,
                .task-room-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 9px;
                }

                .task-object-grid button,
                .task-room-grid button {
                    min-width: 0;
                    min-height: 52px;
                    padding: 10px 12px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #08172b;
                    color: var(--text);
                    text-align: left;
                    font-weight: 800;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color:
                        transparent;
                }

                .task-object-grid button.selected,
                .task-room-grid button.selected {
                    border-color: var(--blue);
                    background:
                        rgba(95, 127, 255, .22);
                    box-shadow:
                        0 0 0 2px var(--blue);
                }

                .task-room-grid button {
                    display: grid;
                    gap: 4px;
                }

                .task-room-grid small {
                    color: var(--soft);
                }

                .task-shift-warning {
                    padding: 14px 16px;
                    border: 1px solid
                        rgba(255, 171, 64, .48);
                    border-radius: 13px;
                    background:
                        rgba(255, 171, 64, .12);
                    color: #ffd18d;
                    font-weight: 800;
                    line-height: 1.45;
                }

                .task-notice {
                    padding: 14px 16px;
                    border-radius: 13px;
                    font-weight: 800;
                }

                .task-notice.success {
                    border: 1px solid
                        rgba(39, 174, 96, .48);
                    background:
                        rgba(39, 174, 96, .14);
                    color: #7df0b1;
                }

                .task-notice.warning {
                    border: 1px solid
                        rgba(255, 171, 64, .48);
                    background:
                        rgba(255, 171, 64, .12);
                    color: #ffd18d;
                }

                .task-list {
                    display: grid;
                    gap: 12px;
                }

                .task-card {
                    display: grid;
                    gap: 13px;
                    padding: 16px;
                    border: 1px solid var(--border);
                    border-radius: 15px;
                    background: #08172b;
                }

                .task-card.completed {
                    border-color:
                        rgba(39, 174, 96, .42);
                    background:
                        linear-gradient(
                            180deg,
                            rgba(39, 174, 96, .09),
                            #08172b
                        );
                }

                .task-card-topline,
                .task-card-heading,
                .task-completion-info {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 12px;
                }

                .task-category,
                .task-status {
                    display: inline-flex;
                    min-height: 29px;
                    align-items: center;
                    padding: 5px 9px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 900;
                }

                .task-category {
                    background:
                        rgba(95, 127, 255, .18);
                    color: #b9c5ff;
                }

                .task-status.open {
                    background:
                        rgba(255, 171, 64, .14);
                    color: #ffd18d;
                }

                .task-status.success {
                    background:
                        rgba(39, 174, 96, .16);
                    color: #7df0b1;
                }

                .task-card-heading h3 {
                    font-size: 18px;
                }

                .task-card-heading p {
                    margin-top: 5px;
                    color: var(--soft);
                    line-height: 1.45;
                }

                .task-minutes {
                    flex: 0 0 auto;
                    padding: 6px 9px;
                    border-radius: 10px;
                    background: #10233f;
                    color: var(--soft);
                    font-size: 12px;
                    font-weight: 800;
                }

                .task-completion-info {
                    padding: 11px 12px;
                    border: 1px solid
                        rgba(39, 174, 96, .34);
                    border-radius: 12px;
                    background:
                        rgba(39, 174, 96, .08);
                }

                .task-completion-info span {
                    color: var(--soft);
                }

                .task-detail-toggle {
                    min-height: 43px;
                    padding: 8px 11px;
                    border: 1px solid var(--border);
                    border-radius: 11px;
                    background: #10233f;
                    color: var(--text);
                    font-weight: 800;
                }

                .task-instructions {
                    display: grid;
                    gap: 10px;
                    padding: 13px;
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    background: #061326;
                }

                .task-instructions ol {
                    display: grid;
                    gap: 8px;
                    margin: 0;
                    padding-left: 22px;
                }

                .task-instructions small {
                    color: #ffd18d;
                    line-height: 1.45;
                }

                .task-card-actions {
                    display: grid;
                }

                .task-card-actions button {
                    min-height: 50px;
                    border-radius: 12px;
                    font-weight: 900;
                }

                .task-card-actions button:disabled {
                    opacity: .45;
                }

                .task-undo-button {
                    border: 1px solid var(--border);
                    background: #10233f;
                    color: var(--text);
                }

                .task-empty {
                    padding: 16px;
                    border: 1px dashed var(--border);
                    border-radius: 12px;
                    color: var(--soft);
                    line-height: 1.5;
                }

                @media (max-width: 640px) {
                    .task-summary-grid {
                        grid-template-columns: 1fr;
                    }

                    .task-object-grid,
                    .task-room-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 390px) {
                    .task-panel,
                    .task-card {
                        padding: 14px 12px;
                    }

                    .task-card-heading {
                        display: grid;
                    }

                    .task-minutes {
                        justify-self: start;
                    }
                }
            </style>

            <header
                class="dashboard-heading"
            >
                <div>
                    <span class="eyebrow">
                        TAGESAUFGABEN
                    </span>

                    <h1>
                        Aufgaben und Räume
                    </h1>

                    <p>
                        ${role === "MITARBEITER"
                            ? "Tagesaufgaben nach Objekt und Raum abarbeiten."
                            : "Aufgabenfortschritt der Objekte für heute prüfen."
                        }
                    </p>
                </div>
            </header>

            ${allowed
                ? ""
                : `
                    <div
                        class="task-empty"
                    >
                        Für diese Rolle ist der
                        Aufgabenbereich nicht freigegeben.
                    </div>
                `
            }

            ${allowed
                ? `
                    ${renderTaskNotice()}

                    ${role === "MITARBEITER" &&
                        !shiftMatchesObject
                        ? `
                            <div
                                class="task-shift-warning"
                            >
                                Zum Abschließen von Aufgaben
                                muss eine laufende Schicht im
                                ausgewählten Objekt vorhanden
                                sein. Aufgaben und Anleitungen
                                können trotzdem angesehen werden.
                            </div>
                        `
                        : ""
                    }

                    <section
                        class="task-summary-grid"
                    >
                        <article
                            class="task-summary-card"
                        >
                            <span>
                                Aufgaben gesamt
                            </span>

                            <strong>
                                ${objectTasks.length}
                            </strong>
                        </article>

                        <article
                            class="task-summary-card"
                        >
                            <span>
                                Heute erledigt
                            </span>

                            <strong>
                                ${completedCount}
                            </strong>
                        </article>

                        <article
                            class="task-summary-card"
                        >
                            <span>
                                Noch offen
                            </span>

                            <strong>
                                ${remainingCount}
                            </strong>
                        </article>
                    </section>

                    <section
                        class="task-progress-card"
                    >
                        <div
                            class="task-progress-heading"
                        >
                            <strong>
                                Tagesfortschritt
                            </strong>

                            <span>
                                ${completionPercent} %
                            </span>
                        </div>

                        <div
                            class="task-progress-track"
                            style="--task-progress: ${completionPercent}%"
                            aria-label="${completionPercent} Prozent erledigt"
                        >
                            <span></span>
                        </div>
                    </section>

                    <section
                        class="task-panel"
                    >
                        <div
                            class="task-section-heading"
                        >
                            <div>
                                <h2>
                                    1. Objekt
                                </h2>

                                <p>
                                    Objekt für die Aufgabenliste auswählen.
                                </p>
                            </div>
                        </div>

                        <div
                            class="task-object-grid"
                        >
                            ${objects.map(
                                (object) => {
                                    const id =
                                        objectId(object);

                                    return `
                                        <button
                                            type="button"
                                            class="${runtime.taskObjectId === id ? "selected" : ""}"
                                            data-task-object-id="${esc(
                                                id
                                            )}"
                                        >
                                            ${esc(
                                                objectName(
                                                    object
                                                )
                                            )}
                                        </button>
                                    `;
                                }
                            ).join("") || `
                                <div
                                    class="task-empty"
                                >
                                    Keine Objekte verfügbar.
                                </div>
                            `}
                        </div>
                    </section>

                    <section
                        class="task-panel"
                    >
                        <div
                            class="task-section-heading"
                        >
                            <div>
                                <h2>
                                    2. Raum
                                </h2>

                                <p>
                                    Raum auswählen und Fortschritt prüfen.
                                </p>
                            </div>
                        </div>

                        <div
                            class="task-room-grid"
                        >
                            ${rooms.map(
                                (room) => {
                                    const progress =
                                        taskProgressForRoom(
                                            state,
                                            room,
                                            role
                                        );

                                    return `
                                        <button
                                            type="button"
                                            class="${runtime.taskRoomId === txt(room?.id) ? "selected" : ""}"
                                            data-task-room-id="${esc(
                                                room?.id
                                            )}"
                                        >
                                            <strong>
                                                ${esc(
                                                    room?.name
                                                )}
                                            </strong>

                                            <small>
                                                ${progress.completed}
                                                von
                                                ${progress.total}
                                                erledigt
                                            </small>
                                        </button>
                                    `;
                                }
                            ).join("") || `
                                <div
                                    class="task-empty"
                                >
                                    Für dieses Objekt wurden
                                    keine Räume gefunden.
                                </div>
                            `}
                        </div>
                    </section>

                    <section
                        class="task-panel"
                    >
                        <div
                            class="task-section-heading"
                        >
                            <div>
                                <h2>
                                    ${esc(
                                        selectedRoom
                                            ?.name ??
                                        "Aufgaben"
                                    )}
                                </h2>

                                <p>
                                    ${esc(
                                        selectedRoom
                                            ?.notes ??
                                        selectedObject
                                            ?.notes ??
                                        "Aufgaben für den ausgewählten Raum."
                                    )}
                                </p>
                            </div>
                        </div>

                        <div
                            class="task-list"
                        >
                            ${roomTasks.length
                                ? roomTasks.map(
                                    (task) =>
                                        renderTaskCard(
                                            state,
                                            task,
                                            role,
                                            shift
                                        )
                                ).join("")
                                : `
                                    <div
                                        class="task-empty"
                                    >
                                        Für diesen Raum sind
                                        keine aktiven Aufgaben
                                        hinterlegt.
                                    </div>
                                `
                            }
                        </div>
                    </section>
                `
                : ""
            }
        </section>
    `;
}

function completeTask(
    state,
    taskId
) {
    if (
        taskRole(state) !==
        "MITARBEITER"
    ) {
        throw new Error(
            "Nur Mitarbeiter können Aufgaben abschließen."
        );
    }

    const task =
        arr(state?.tasks)
            .find(
                (entry) =>
                    txt(
                        entry?.id
                    ) ===
                    txt(taskId)
            );

    if (
        !task ||
        task?.active === false
    ) {
        throw new Error(
            "Die Aufgabe wurde nicht gefunden."
        );
    }

    const shift =
        currentRunningShiftForTasks(
            state
        );

    if (!shift) {
        throw new Error(
            "Bitte zuerst eine Schicht starten."
        );
    }

    if (
        txt(
            shift?.objectId
        ) !==
        txt(
            task?.objectId
        )
    ) {
        throw new Error(
            "Die laufende Schicht gehört zu einem anderen Objekt."
        );
    }

    if (
        completedTaskLog(
            state,
            taskId,
            {
                employeeOnly:
                    true
            }
        )
    ) {
        runtime.taskNotice = {
            tone:
                "warning",

            text:
                "Diese Aufgabe wurde heute bereits erledigt."
        };

        renderApp(runtime);
        return;
    }

    const timestamp =
        new Date()
            .toISOString();

    addCollectionEntry(
        "taskLogs",
        {
            id:
                createId(
                    "TASKLOG"
                ),

            shiftId:
                txt(
                    shift?.id
                ),

            taskId:
                txt(
                    task?.id
                ),

            userId:
                taskCurrentUserId(
                    state
                ),

            employeeId:
                taskCurrentUserId(
                    state
                ),

            employeeName:
                userName(
                    state
                        ?.currentUser
                ),

            objectId:
                txt(
                    task?.objectId
                ),

            roomId:
                txt(
                    task?.roomId
                ),

            status:
                "COMPLETED",

            workDate:
                taskDateKey(),

            startedAt:
                null,

            completedAt:
                timestamp,

            actualMinutes:
                null,

            estimatedMinutes:
                Number(
                    task
                        ?.estimatedMinutes
                ) || 0,

            deviationMinutes:
                null,

            documentationRequired:
                false,

            documentationProvided:
                false,

            documentationType:
                null,

            notes:
                "",

            attachments:
                [],

            issueReported:
                false,

            ticketId:
                null,

            offlineCreated:
                true,

            synced:
                false,

            createdAt:
                timestamp,

            updatedAt:
                timestamp,

            source:
                "LOCAL_TEST"
        },
        {
            notify:
                false,

            persist:
                true
        }
    );

    runtime.taskNotice = {
        tone:
            "success",

        text:
            `${txt(
                task?.title
            )} wurde als erledigt gespeichert.`
    };

    renderApp(runtime);
}

function undoTaskCompletion(
    state,
    logId
) {
    if (
        taskRole(state) !==
        "MITARBEITER"
    ) {
        throw new Error(
            "Nur Mitarbeiter können eigene Aufgaben zurücksetzen."
        );
    }

    const employeeId =
        taskCurrentUserId(
            state
        );

    const log =
        arr(state?.taskLogs)
            .find(
                (entry) =>
                    txt(
                        entry?.id
                    ) ===
                        txt(logId) &&
                    [
                        entry?.userId,
                        entry?.employeeId
                    ]
                        .map(String)
                        .includes(
                            employeeId
                        ) &&
                    txt(
                        entry?.status
                    ).toUpperCase() ===
                        "COMPLETED"
            );

    if (!log) {
        throw new Error(
            "Der Aufgabenabschluss wurde nicht gefunden."
        );
    }

    updateCollectionEntry(
        "taskLogs",
        logId,
        {
            status:
                "CANCELLED",

            cancelledAt:
                new Date()
                    .toISOString(),

            updatedAt:
                new Date()
                    .toISOString()
        },
        {
            notify:
                false,

            persist:
                true
        }
    );

    runtime.taskNotice = {
        tone:
            "warning",

        text:
            "Der Aufgabenabschluss wurde zurückgesetzt."
    };

    renderApp(runtime);
}


function communicationRole(state) {
    return txt(
        state?.currentUser?.role
    ).toUpperCase();
}

function communicationUserId(state) {
    return txt(
        state?.currentUser?.id ??
        state?.currentUser?.userId
    );
}

function communicationObjectIds(state) {
    const role =
        communicationRole(state);

    if (
        [
            "SUPER_ADMIN",
            "ADMIN",
            "BUCHHALTUNG"
        ].includes(role)
    ) {
        return arr(state?.objects)
            .filter(
                (object) =>
                    object?.active !== false
            )
            .map(objectId)
            .filter(Boolean);
    }

    if (
        role ===
        "OBJEKTLEITER"
    ) {
        return managedAbsenceObjectIds(
            state
        );
    }

    if (
        [
            "MITARBEITER",
            "KUNDE"
        ].includes(role)
    ) {
        return assignedObjects(
            state
        )
            .map(objectId)
            .filter(Boolean);
    }

    return [];
}

function communicationObjects(state) {
    const allowedIds =
        communicationObjectIds(
            state
        );

    return arr(state?.objects)
        .filter(
            (object) =>
                object?.active !== false &&
                allowedIds.includes(
                    objectId(object)
                )
        );
}

function communicationRooms(
    state,
    selectedObjectId
) {
    return arr(state?.rooms)
        .filter(
            (room) =>
                room?.active !== false &&
                txt(room?.objectId) ===
                    txt(
                        selectedObjectId
                    )
        )
        .sort(
            (first, second) =>
                Number(
                    first?.sequence ??
                    0
                ) -
                Number(
                    second?.sequence ??
                    0
                )
        );
}

function communicationTicketTypeOptions(
    role
) {
    if (
        role ===
        "KUNDE"
    ) {
        return [
            [
                "ADDITIONAL_SERVICE",
                "Zusatzleistung"
            ],
            [
                "COMPLAINT",
                "Beschwerde"
            ],
            [
                "CHANGE_REQUEST",
                "Änderungswunsch"
            ],
            [
                "INFORMATION",
                "Information anfordern"
            ]
        ];
    }

    return [
        [
            "DAMAGE",
            "Schaden"
        ],
        [
            "TASK_NOT_COMPLETED",
            "Aufgabe nicht erledigt"
        ],
        [
            "COMPLAINT",
            "Beschwerde"
        ],
        [
            "IMPORTANT_INFO",
            "Wichtige Mitteilung"
        ],
        [
            "ACCESS",
            "Zugang nicht möglich"
        ],
        [
            "QUALITY",
            "Qualitätsproblem"
        ],
        [
            "SAFETY",
            "Sicherheitsproblem"
        ],
        [
            "MATERIAL",
            "Materialproblem"
        ],
        [
            "OTHER",
            "Sonstige Meldung"
        ]
    ];
}

function communicationTypeLabel(
    type
) {
    const labels = {
        DAMAGE:
            "Schaden",
        TASK_NOT_COMPLETED:
            "Aufgabe nicht erledigt",
        IMPORTANT_INFO:
            "Wichtige Mitteilung",
        ACCESS:
            "Zugang",
        QUALITY:
            "Qualitätsproblem",
        SAFETY:
            "Sicherheitsproblem",
        MATERIAL:
            "Materialproblem",
        OTHER:
            "Sonstige Meldung",
        CUSTOMER_REQUEST:
            "Kundenanfrage",
        ADDITIONAL_SERVICE:
            "Zusatzleistung",
        COMPLAINT:
            "Beschwerde",
        CHANGE_REQUEST:
            "Änderungswunsch",
        INFORMATION:
            "Information"
    };

    return labels[
        txt(type).toUpperCase()
    ] ?? (
        txt(type)
            .replaceAll(
                "_",
                " "
            ) ||
        "Meldung"
    );
}

function communicationQuickOptions(
    type
) {
    const options = {
        DAMAGE: [
            "Ausstattung oder Gegenstand ist beschädigt.",
            "Ein Defekt beeinträchtigt die Arbeit.",
            "Eine Reparatur oder Prüfung ist erforderlich."
        ],
        TASK_NOT_COMPLETED: [
            "Eine geplante Aufgabe konnte nicht erledigt werden.",
            "Eine Aufgabe wurde ausgelassen oder ist noch offen.",
            "Die Aufgabe muss nachgeholt oder neu zugeteilt werden."
        ],
        IMPORTANT_INFO: [
            "Es gibt eine wichtige Information zum Objekt oder Arbeitsablauf.",
            "Die Objektleitung muss über eine Änderung informiert werden.",
            "Der Hinweis soll dokumentiert und weitergeleitet werden."
        ],
        ACCESS: [
            "Ein Raum ist verschlossen oder nicht zugänglich.",
            "Schlüssel oder Zugangsmittel fehlen.",
            "Der Zugang ist nur eingeschränkt möglich."
        ],
        QUALITY: [
            "Die vereinbarte Reinigungsqualität konnte nicht eingehalten werden.",
            "Eine Nachreinigung ist erforderlich.",
            "Vorhandene Verschmutzung benötigt zusätzliche Zeit."
        ],
        SAFETY: [
            "Es besteht eine mögliche Unfall- oder Sicherheitsgefahr.",
            "Ein Bereich muss vorerst abgesichert werden.",
            "Eine dringende Prüfung ist erforderlich."
        ],
        MATERIAL: [
            "Benötigtes Material fehlt.",
            "Der Materialbestand ist kritisch niedrig.",
            "Falsches oder ungeeignetes Material wurde bereitgestellt."
        ],
        OTHER: [
            "Es liegt eine sonstige betriebliche Meldung vor.",
            "Eine Rückmeldung der Objektleitung wird benötigt.",
            "Der Vorgang soll dokumentiert und geprüft werden."
        ],
        ADDITIONAL_SERVICE: [
            "Eine zusätzliche Reinigungsleistung wird benötigt.",
            "Eine einmalige Sonderleistung wird angefragt.",
            "Der bestehende Leistungsumfang soll erweitert werden."
        ],
        COMPLAINT: [
            "Eine vereinbarte Leistung wurde nicht zufriedenstellend ausgeführt.",
            "Ein Bereich weist weiterhin Verschmutzungen auf.",
            "Eine zeitnahe Rückmeldung und Prüfung wird erbeten."
        ],
        CHANGE_REQUEST: [
            "Der bestehende Reinigungsplan soll angepasst werden.",
            "Ein Raum oder Termin soll geändert werden.",
            "Der Leistungsumfang soll dauerhaft verändert werden."
        ],
        INFORMATION: [
            "Es werden Informationen zum aktuellen Leistungsstand benötigt.",
            "Eine Rückmeldung zum Reinigungsplan wird benötigt.",
            "Ein Nachweis oder Bericht wird angefragt."
        ]
    };

    return options[
        txt(type).toUpperCase()
    ] ?? options.OTHER;
}

function communicationPriorityLabel(
    priority
) {
    return ({
        LOW:
            "Niedrig",
        MEDIUM:
            "Normal",
        HIGH:
            "Dringend"
    }[
        txt(priority).toUpperCase()
    ] ?? "Normal");
}

function communicationStatusLabel(
    status
) {
    return ({
        OPEN:
            "Offen",
        IN_PROGRESS:
            "In Bearbeitung",
        RESOLVED:
            "Erledigt",
        CLOSED:
            "Geschlossen",
        COMPLETED:
            "Erledigt",
        APPROVED:
            "Genehmigt",
        PENDING_CUSTOMER_APPROVAL:
            "Wartet auf Kundenfreigabe"
    }[
        txt(status).toUpperCase()
    ] ?? "Offen");
}

function communicationStatusTone(
    status
) {
    const normalized =
        txt(status).toUpperCase();

    if (
        [
            "RESOLVED",
            "CLOSED",
            "COMPLETED",
            "APPROVED"
        ].includes(normalized)
    ) {
        return "success";
    }

    if (
        normalized ===
        "IN_PROGRESS"
    ) {
        return "progress";
    }

    return "open";
}

function communicationPriorityTone(
    priority
) {
    return ({
        HIGH:
            "high",
        MEDIUM:
            "medium",
        LOW:
            "low"
    }[
        txt(priority).toUpperCase()
    ] ?? "medium");
}

function communicationDateTime(value) {
    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "de-DE",
        {
            dateStyle:
                "short",
            timeStyle:
                "short"
        }
    ).format(date);
}

function communicationUserById(
    state,
    userId
) {
    return arr(state?.users)
        .find(
            (user) =>
                txt(
                    user?.id ??
                    user?.userId
                ) ===
                txt(userId)
        ) ?? null;
}

function communicationObjectById(
    state,
    selectedObjectId
) {
    return arr(state?.objects)
        .find(
            (object) =>
                objectId(object) ===
                txt(
                    selectedObjectId
                )
        ) ?? null;
}

function communicationRoomById(
    state,
    selectedRoomId
) {
    return arr(state?.rooms)
        .find(
            (room) =>
                txt(room?.id) ===
                txt(selectedRoomId)
        ) ?? null;
}

function isCommunicationTicket(
    ticket
) {
    const type =
        txt(ticket?.type)
            .toUpperCase();

    return (
        !isAbsenceEntry(ticket) &&
        type !==
            "ABSENCE"
    );
}

function visibleCommunicationTickets(
    state
) {
    const role =
        communicationRole(state);

    const userId =
        communicationUserId(state);

    const objectIds =
        communicationObjectIds(
            state
        );

    return arr(state?.tickets)
        .filter(
            isCommunicationTicket
        )
        .filter(
            (ticket) => {
                const createdBy =
                    txt(
                        ticket?.createdByUserId ??
                        ticket?.employeeId
                    );

                const assignedTo =
                    txt(
                        ticket?.assignedToUserId
                    );

                if (
                    [
                        "SUPER_ADMIN",
                        "ADMIN"
                    ].includes(role)
                ) {
                    return true;
                }

                if (
                    role ===
                    "OBJEKTLEITER"
                ) {
                    return objectIds.includes(
                        txt(
                            ticket?.objectId
                        )
                    );
                }

                if (
                    role ===
                    "MITARBEITER"
                ) {
                    return (
                        createdBy ===
                            userId ||
                        assignedTo ===
                            userId
                    );
                }

                if (
                    role ===
                    "KUNDE"
                ) {
                    return (
                        ticket?.customerVisible ===
                            true &&
                        (
                            createdBy ===
                                userId ||
                            objectIds.includes(
                                txt(
                                    ticket?.objectId
                                )
                            )
                        )
                    );
                }

                if (
                    role ===
                    "BUCHHALTUNG"
                ) {
                    return (
                        createdBy ===
                            userId ||
                        assignedTo ===
                            userId
                    );
                }

                return false;
            }
        );
}

function visibleCommunicationCustomerRequests(
    state,
    tickets
) {
    const role =
        communicationRole(state);

    const userId =
        communicationUserId(state);

    const objectIds =
        communicationObjectIds(
            state
        );

    const linkedTicketIds =
        new Set(
            tickets
                .map(
                    (ticket) =>
                        txt(ticket?.id)
                )
        );

    return arr(
        state?.customerRequests
    )
        .filter(
            (request) =>
                !linkedTicketIds.has(
                    txt(
                        request?.relatedTicketId
                    )
                )
        )
        .filter(
            (request) => {
                if (
                    [
                        "SUPER_ADMIN",
                        "ADMIN"
                    ].includes(role)
                ) {
                    return true;
                }

                if (
                    role ===
                    "OBJEKTLEITER"
                ) {
                    return objectIds.includes(
                        txt(
                            request?.objectId
                        )
                    );
                }

                if (
                    role ===
                    "KUNDE"
                ) {
                    return (
                        txt(
                            request?.customerUserId
                        ) ===
                            userId ||
                        objectIds.includes(
                            txt(
                                request?.objectId
                            )
                        )
                    );
                }

                if (
                    role ===
                    "BUCHHALTUNG"
                ) {
                    return true;
                }

                return false;
            }
        );
}

function visibleCommunicationMessages(
    state
) {
    const userId =
        communicationUserId(
            state
        );

    return arr(state?.messages)
        .filter(
            (message) =>
                txt(
                    message?.senderUserId
                ) ===
                    userId ||
                arr(
                    message?.recipientUserIds
                )
                    .map(String)
                    .includes(
                        userId
                    )
        );
}

function communicationNotificationRecipientId(
    notification
) {
    return txt(
        notification?.recipientUserId ??
        notification?.userId
    );
}

function visibleCommunicationNotifications(
    state
) {
    const userId =
        communicationUserId(
            state
        );

    return arr(state?.notifications)
        .filter(
            (notification) =>
                communicationNotificationRecipientId(
                    notification
                ) ===
                userId
        );
}

function communicationMessageUnread(
    state,
    message
) {
    const userId =
        communicationUserId(
            state
        );

    const incoming =
        arr(
            message?.recipientUserIds
        )
            .map(String)
            .includes(
                userId
            );

    return (
        incoming &&
        !arr(
            message?.readByUserIds
        )
            .map(String)
            .includes(
                userId
            )
    );
}

function communicationNotificationUnread(
    notification
) {
    return (
        notification?.read !==
            true &&
        txt(
            notification?.status
        ).toUpperCase() !==
            "READ"
    );
}

function communicationUnreadCount(
    state
) {
    const messageCount =
        visibleCommunicationMessages(
            state
        )
            .filter(
                (message) =>
                    communicationMessageUnread(
                        state,
                        message
                    )
            ).length;

    const notificationCount =
        visibleCommunicationNotifications(
            state
        )
            .filter(
                communicationNotificationUnread
            ).length;

    return (
        messageCount +
        notificationCount
    );
}

function communicationOpenTicketCount(
    state
) {
    return visibleCommunicationTickets(
        state
    ).filter(
        (ticket) =>
            ![
                "RESOLVED",
                "CLOSED",
                "COMPLETED"
            ].includes(
                txt(
                    ticket?.status
                ).toUpperCase()
            )
    ).length;
}

function ensureCommunicationDraft(
    state
) {
    const role =
        communicationRole(state);

    const objects =
        communicationObjects(
            state
        );

    const objectIds =
        objects
            .map(objectId);

    const currentObjectId =
        objectId(
            state?.currentObject
        );

    if (
        !objectIds.includes(
            txt(
                runtime
                    .communicationDraft
                    .objectId
            )
        )
    ) {
        runtime.communicationDraft.objectId =
            objectIds.includes(
                currentObjectId
            )
                ? currentObjectId
                : (
                    objectIds[0] ??
                    ""
                );
    }

    const rooms =
        communicationRooms(
            state,
            runtime
                .communicationDraft
                .objectId
        );

    const roomIds =
        rooms.map(
            (room) =>
                txt(room?.id)
        );

    if (
        runtime
            .communicationDraft
            .roomId &&
        !roomIds.includes(
            txt(
                runtime
                    .communicationDraft
                    .roomId
            )
        )
    ) {
        runtime.communicationDraft.roomId =
            "";
    }

    const typeOptions =
        communicationTicketTypeOptions(
            role
        );

    const validTypes =
        typeOptions.map(
            ([
                value
            ]) => value
        );

    if (
        !validTypes.includes(
            txt(
                runtime
                    .communicationDraft
                    .type
            ).toUpperCase()
        )
    ) {
        runtime.communicationDraft.type =
            validTypes[0] ??
            "OTHER";
    }

    if (
        ![
            "LOW",
            "MEDIUM",
            "HIGH"
        ].includes(
            txt(
                runtime
                    .communicationDraft
                    .priority
            ).toUpperCase()
        )
    ) {
        runtime.communicationDraft.priority =
            "MEDIUM";
    }

    const quickOptions =
        communicationQuickOptions(
            runtime
                .communicationDraft
                .type
        );

    if (
        !quickOptions.includes(
            txt(
                runtime
                    .communicationDraft
                    .quickText
            )
        )
    ) {
        runtime.communicationDraft.quickText =
            quickOptions[0] ??
            "";
    }

    return {
        role,
        objects,
        rooms,
        typeOptions,
        quickOptions,
        draft:
            runtime.communicationDraft
    };
}

function communicationManagerId(
    state,
    selectedObject
) {
    const directManagerId =
        txt(
            selectedObject?.objectLeaderId ??
            selectedObject?.managerId ??
            selectedObject?.leaderId
        );

    if (directManagerId) {
        return directManagerId;
    }

    return txt(
        arr(state?.users)
            .find(
                (user) =>
                    [
                        "OBJEKTLEITER",
                        "ADMIN",
                        "SUPER_ADMIN"
                    ].includes(
                        txt(
                            user?.role
                        ).toUpperCase()
                    )
            )?.id
    );
}

function createCommunicationNotification({
    recipientUserId,
    objectId: relatedObjectId,
    type,
    priority,
    title,
    message,
    relatedEntityType,
    relatedEntityId
}) {
    const recipientId =
        txt(recipientUserId);

    if (!recipientId) {
        return null;
    }

    const timestamp =
        new Date()
            .toISOString();

    return addCollectionEntry(
        "notifications",
        {
            id:
                createId(
                    "NOTIFICATION"
                ),
            userId:
                recipientId,
            recipientUserId:
                recipientId,
            objectId:
                txt(
                    relatedObjectId
                ),
            type:
                txt(type),
            priority:
                txt(priority) ||
                "MEDIUM",
            title:
                txt(title),
            message:
                txt(message),
            relatedEntityType:
                txt(
                    relatedEntityType
                ),
            relatedEntityId:
                txt(
                    relatedEntityId
                ),
            read:
                false,
            status:
                "UNREAD",
            actionRequired:
                true,
            actionRoute:
                ROUTES.COMMUNICATION,
            createdAt:
                timestamp,
            updatedAt:
                timestamp,
            readAt:
                null,
            source:
                "LOCAL_TEST"
        },
        {
            notify:
                false,
            persist:
                true
        }
    );
}

function renderCommunicationNotice() {
    const notice =
        runtime.communicationNotice;

    if (!notice?.text) {
        return "";
    }

    return `
        <div
            class="communication-notice ${esc(
                notice.tone ??
                "success"
            )}"
            role="status"
        >
            ${esc(
                notice.text
            )}
        </div>
    `;
}

function renderCommunicationConfirmation(
    confirmation
) {
    return `
        <article
            class="communication-confirmation"
            aria-live="polite"
        >
            <div
                class="communication-confirmation-symbol"
                aria-hidden="true"
            >
                &#10003;
            </div>

            <div>
                <span class="eyebrow">
                    MELDUNG GESPEICHERT
                </span>

                <h2>
                    ${esc(
                        confirmation?.heading ??
                        "Vorgang wurde erfasst"
                    )}
                </h2>

                <p>
                    ${esc(
                        confirmation?.message ??
                        "Die zuständige Stelle wurde informiert."
                    )}
                </p>
            </div>

            <div
                class="communication-detail-list"
            >
                <div>
                    <span>Vorgangsnummer</span>
                    <strong>
                        ${esc(
                            confirmation?.id
                        )}
                    </strong>
                </div>

                <div>
                    <span>Objekt</span>
                    <strong>
                        ${esc(
                            confirmation?.objectName
                        )}
                    </strong>
                </div>

                <div>
                    <span>Art</span>
                    <strong>
                        ${esc(
                            confirmation?.typeLabel
                        )}
                    </strong>
                </div>

                <div>
                    <span>Status</span>
                    <strong>
                        ${esc(
                            confirmation?.statusLabel ??
                            "Offen"
                        )}
                    </strong>
                </div>
            </div>

            <div
                class="communication-confirmation-actions"
            >
                <button
                    type="button"
                    class="primary"
                    data-communication-confirmation-action="overview"
                >
                    Zur Übersicht
                </button>

                <button
                    type="button"
                    class="secondary"
                    data-communication-confirmation-action="new"
                >
                    Weitere Meldung
                </button>
            </div>
        </article>
    `;
}

function renderCommunicationInbox(
    state
) {
    const userId =
        communicationUserId(
            state
        );

    const messages =
        visibleCommunicationMessages(
            state
        ).map(
            (message) => ({
                kind:
                    "MESSAGE",
                id:
                    txt(message?.id),
                createdAt:
                    message?.createdAt,
                unread:
                    communicationMessageUnread(
                        state,
                        message
                    ),
                data:
                    message
            })
        );

    const notifications =
        visibleCommunicationNotifications(
            state
        ).map(
            (notification) => ({
                kind:
                    "NOTIFICATION",
                id:
                    txt(
                        notification?.id
                    ),
                createdAt:
                    notification
                        ?.createdAt,
                unread:
                    communicationNotificationUnread(
                        notification
                    ),
                data:
                    notification
            })
        );

    const items = [
        ...messages,
        ...notifications
    ].sort(
        (first, second) =>
            String(
                second?.createdAt ??
                ""
            ).localeCompare(
                String(
                    first?.createdAt ??
                    ""
                )
            )
    );

    return `
        <section
            class="communication-panel"
        >
            <div
                class="communication-section-heading"
            >
                <div>
                    <h2>
                        Eingang
                    </h2>

                    <p>
                        Nachrichten und Systemhinweise für
                        dein Benutzerkonto.
                    </p>
                </div>

                ${items.some(
                    (item) =>
                        item.unread
                )
                    ? `
                        <button
                            type="button"
                            class="communication-small-button"
                            data-communication-mark-all-read
                        >
                            Alle gelesen
                        </button>
                    `
                    : ""
                }
            </div>

            <div
                class="communication-inbox-list"
            >
                ${items.length
                    ? items.map(
                        (item) => {
                            const entry =
                                item.data;

                            if (
                                item.kind ===
                                "NOTIFICATION"
                            ) {
                                return `
                                    <article
                                        class="communication-inbox-card ${item.unread ? "unread" : ""}"
                                    >
                                        <div
                                            class="communication-inbox-topline"
                                        >
                                            <span
                                                class="communication-kind-badge"
                                            >
                                                Hinweis
                                            </span>

                                            <span>
                                                ${esc(
                                                    communicationDateTime(
                                                        entry
                                                            ?.createdAt
                                                    )
                                                )}
                                            </span>
                                        </div>

                                        <h3>
                                            ${esc(
                                                entry?.title
                                            )}
                                        </h3>

                                        <p>
                                            ${esc(
                                                entry?.message
                                            )}
                                        </p>

                                        ${item.unread
                                            ? `
                                                <button
                                                    type="button"
                                                    class="communication-read-button"
                                                    data-communication-notification-read-id="${esc(
                                                        entry?.id
                                                    )}"
                                                >
                                                    Als gelesen markieren
                                                </button>
                                            `
                                            : ""
                                        }
                                    </article>
                                `;
                            }

                            const senderId =
                                txt(
                                    entry?.senderUserId
                                );

                            const outgoing =
                                senderId ===
                                userId;

                            const sender =
                                communicationUserById(
                                    state,
                                    senderId
                                );

                            return `
                                <article
                                    class="communication-inbox-card ${item.unread ? "unread" : ""}"
                                >
                                    <div
                                        class="communication-inbox-topline"
                                    >
                                        <span
                                            class="communication-kind-badge"
                                        >
                                            ${outgoing
                                                ? "Gesendet"
                                                : "Nachricht"
                                            }
                                        </span>

                                        <span>
                                            ${esc(
                                                communicationDateTime(
                                                    entry
                                                        ?.createdAt
                                                )
                                            )}
                                        </span>
                                    </div>

                                    <h3>
                                        ${esc(
                                            entry?.subject ??
                                            "Nachricht"
                                        )}
                                    </h3>

                                    <p>
                                        ${esc(
                                            entry?.message
                                        )}
                                    </p>

                                    <small>
                                        ${outgoing
                                            ? "Von dir gesendet"
                                            : `Von ${esc(
                                                userName(
                                                    sender
                                                )
                                            )}`
                                        }
                                    </small>

                                    ${item.unread
                                        ? `
                                            <button
                                                type="button"
                                                class="communication-read-button"
                                                data-communication-message-read-id="${esc(
                                                    entry?.id
                                                )}"
                                            >
                                                Als gelesen markieren
                                            </button>
                                        `
                                        : ""
                                    }
                                </article>
                            `;
                        }
                    ).join("")
                    : `
                        <div
                            class="communication-empty"
                        >
                            Keine Nachrichten oder Hinweise
                            vorhanden.
                        </div>
                    `
                }
            </div>
        </section>
    `;
}

function communicationCanManageTicket(
    state,
    ticket
) {
    const role =
        communicationRole(state);

    if (
        [
            "SUPER_ADMIN",
            "ADMIN"
        ].includes(role)
    ) {
        return true;
    }

    if (
        role !==
        "OBJEKTLEITER"
    ) {
        return false;
    }

    return communicationObjectIds(
        state
    ).includes(
        txt(
            ticket?.objectId
        )
    );
}

function communicationTicketThread(
    state,
    ticketId
) {
    return arr(state?.messages)
        .filter(
            (message) =>
                txt(
                    message?.relatedTicketId
                ) ===
                txt(ticketId)
        )
        .sort(
            (first, second) =>
                String(
                    first?.createdAt ??
                    ""
                ).localeCompare(
                    String(
                        second?.createdAt ??
                        ""
                    )
                )
        );
}

function renderCommunicationThread(
    state,
    ticket
) {
    const messages =
        communicationTicketThread(
            state,
            ticket?.id
        );

    const replyDraft =
        runtime.communicationReplyDraft;

    const presets = [
        "Wird geprüft.",
        "Der Vorgang ist in Bearbeitung.",
        "Bitte weitere Informationen senden.",
        "Vielen Dank für die Rückmeldung."
    ];

    return `
        <div
            class="communication-thread"
        >
            <div>
                <strong>
                    Verlauf
                </strong>

                <p>
                    Antworten werden direkt diesem Ticket
                    zugeordnet.
                </p>
            </div>

            <div
                class="communication-thread-list"
            >
                ${messages.length
                    ? messages.map(
                        (message) => {
                            const sender =
                                communicationUserById(
                                    state,
                                    message?.senderUserId
                                );

                            return `
                                <article>
                                    <div>
                                        <strong>
                                            ${esc(
                                                userName(
                                                    sender
                                                )
                                            )}
                                        </strong>

                                        <span>
                                            ${esc(
                                                communicationDateTime(
                                                    message?.createdAt
                                                )
                                            )}
                                        </span>
                                    </div>

                                    <p>
                                        ${esc(
                                            message?.message
                                        )}
                                    </p>
                                </article>
                            `;
                        }
                    ).join("")
                    : `
                        <div
                            class="communication-empty compact"
                        >
                            Noch keine Antworten vorhanden.
                        </div>
                    `
                }
            </div>

            <div
                class="communication-reply-options"
            >
                ${presets.map(
                    (preset) => `
                        <button
                            type="button"
                            class="${replyDraft.ticketId === txt(ticket?.id) && replyDraft.preset === preset ? "selected" : ""}"
                            data-communication-reply-ticket-id="${esc(
                                ticket?.id
                            )}"
                            data-communication-reply-preset="${esc(
                                preset
                            )}"
                        >
                            ${esc(preset)}
                        </button>
                    `
                ).join("")}
            </div>

            <label
                class="communication-text-field"
            >
                Eigene Antwort (optional)

                <textarea
                    id="communication-reply-text"
                    rows="3"
                    maxlength="600"
                    placeholder="Zusätzliche Antwort eingeben"
                >${esc(
                    replyDraft.ticketId === txt(ticket?.id)
                        ? replyDraft.customText
                        : ""
                )}</textarea>
            </label>

            <button
                type="button"
                class="primary"
                data-communication-reply-submit-id="${esc(
                    ticket?.id
                )}"
            >
                Antwort senden
            </button>
        </div>
    `;
}

function renderCommunicationTicketCard(
    state,
    ticket
) {
    const expanded =
        runtime
            .communicationExpandedTicketId ===
        txt(ticket?.id);

    const canManage =
        communicationCanManageTicket(
            state,
            ticket
        );

    const status =
        txt(
            ticket?.status
        ).toUpperCase();

    const object =
        communicationObjectById(
            state,
            ticket?.objectId
        );

    const room =
        communicationRoomById(
            state,
            ticket?.roomId
        );

    const creator =
        communicationUserById(
            state,
            ticket?.createdByUserId ??
            ticket?.employeeId
        );

    return `
        <article
            class="communication-ticket-card"
        >
            <div
                class="communication-ticket-topline"
            >
                <span
                    class="communication-priority ${communicationPriorityTone(
                        ticket?.priority
                    )}"
                >
                    ${esc(
                        communicationPriorityLabel(
                            ticket?.priority
                        )
                    )}
                </span>

                <span
                    class="communication-status ${communicationStatusTone(
                        status
                    )}"
                >
                    ${esc(
                        communicationStatusLabel(
                            status
                        )
                    )}
                </span>
            </div>

            <div
                class="communication-ticket-heading"
            >
                <div>
                    <small>
                        ${esc(
                            communicationTypeLabel(
                                ticket?.type
                            )
                        )}
                    </small>

                    <h3>
                        ${esc(
                            ticket?.title
                        )}
                    </h3>
                </div>

                <span>
                    ${esc(
                        communicationDateTime(
                            ticket?.createdAt
                        )
                    )}
                </span>
            </div>

            <p>
                ${esc(
                    ticket?.description
                )}
            </p>

            <div
                class="communication-detail-list"
            >
                <div>
                    <span>Objekt</span>
                    <strong>
                        ${esc(
                            objectName(
                                object
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <span>Raum</span>
                    <strong>
                        ${esc(
                            room?.name ??
                            "Gesamtes Objekt"
                        )}
                    </strong>
                </div>

                <div>
                    <span>Gemeldet von</span>
                    <strong>
                        ${esc(
                            userName(
                                creator
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <span>Vorgang</span>
                    <strong>
                        ${esc(
                            ticket?.id
                        )}
                    </strong>
                </div>
            </div>

            ${canManage
                ? `
                    <div
                        class="communication-ticket-actions"
                    >
                        ${[
                            "OPEN"
                        ].includes(status)
                            ? `
                                <button
                                    type="button"
                                    class="primary"
                                    data-communication-ticket-action="start"
                                    data-communication-ticket-id="${esc(
                                        ticket?.id
                                    )}"
                                >
                                    Bearbeitung starten
                                </button>
                            `
                            : ""
                        }

                        ${[
                            "OPEN",
                            "IN_PROGRESS"
                        ].includes(status)
                            ? `
                                <button
                                    type="button"
                                    class="communication-resolve-button"
                                    data-communication-ticket-action="resolve"
                                    data-communication-ticket-id="${esc(
                                        ticket?.id
                                    )}"
                                >
                                    Als erledigt markieren
                                </button>
                            `
                            : ""
                        }

                        ${[
                            "RESOLVED",
                            "CLOSED",
                            "COMPLETED"
                        ].includes(status)
                            ? `
                                <button
                                    type="button"
                                    class="secondary"
                                    data-communication-ticket-action="reopen"
                                    data-communication-ticket-id="${esc(
                                        ticket?.id
                                    )}"
                                >
                                    Wieder öffnen
                                </button>
                            `
                            : ""
                        }
                    </div>
                `
                : ""
            }

            <button
                type="button"
                class="communication-thread-toggle"
                data-communication-ticket-toggle-id="${esc(
                    ticket?.id
                )}"
                aria-expanded="${expanded ? "true" : "false"}"
            >
                ${expanded
                    ? "Verlauf schließen"
                    : `Verlauf und Antworten (${communicationTicketThread(
                        state,
                        ticket?.id
                    ).length})`
                }
            </button>

            ${expanded
                ? renderCommunicationThread(
                    state,
                    ticket
                )
                : ""
            }
        </article>
    `;
}

function formatCommunicationMoney(
    value,
    currency = "EUR"
) {
    const amount =
        Number(value);

    if (
        !Number.isFinite(amount)
    ) {
        return "";
    }

    return new Intl.NumberFormat(
        "de-DE",
        {
            style:
                "currency",
            currency:
                txt(currency) ||
                "EUR"
        }
    ).format(amount);
}

function communicationCanManageCustomerRequest(
    state,
    request
) {
    const role =
        communicationRole(state);

    if (
        [
            "SUPER_ADMIN",
            "ADMIN"
        ].includes(role)
    ) {
        return true;
    }

    return (
        role ===
            "OBJEKTLEITER" &&
        communicationObjectIds(
            state
        ).includes(
            txt(
                request?.objectId
            )
        )
    );
}

function renderCommunicationCustomerRequestCard(
    state,
    request
) {
    const canManage =
        communicationCanManageCustomerRequest(
            state,
            request
        );

    const status =
        txt(
            request?.status
        ).toUpperCase();

    const object =
        communicationObjectById(
            state,
            request?.objectId
        );

    const room =
        communicationRoomById(
            state,
            request?.roomId
        );

    const price =
        formatCommunicationMoney(
            request?.pricing
                ?.estimatedPrice,
            request?.pricing
                ?.currency
        );

    return `
        <article
            class="communication-ticket-card customer-request-card"
        >
            <div
                class="communication-ticket-topline"
            >
                <span
                    class="communication-priority ${communicationPriorityTone(
                        request?.priority
                    )}"
                >
                    Kundenanfrage
                </span>

                <span
                    class="communication-status ${communicationStatusTone(
                        status
                    )}"
                >
                    ${esc(
                        communicationStatusLabel(
                            status
                        )
                    )}
                </span>
            </div>

            <div
                class="communication-ticket-heading"
            >
                <div>
                    <small>
                        ${esc(
                            communicationTypeLabel(
                                request?.type
                            )
                        )}
                    </small>

                    <h3>
                        ${esc(
                            request?.title
                        )}
                    </h3>
                </div>

                <span>
                    ${esc(
                        communicationDateTime(
                            request?.createdAt
                        )
                    )}
                </span>
            </div>

            <p>
                ${esc(
                    request?.description
                )}
            </p>

            <div
                class="communication-detail-list"
            >
                <div>
                    <span>Objekt</span>
                    <strong>
                        ${esc(
                            objectName(
                                object
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <span>Raum</span>
                    <strong>
                        ${esc(
                            room?.name ??
                            "Gesamtes Objekt"
                        )}
                    </strong>
                </div>

                ${request?.requestedDate
                    ? `
                        <div>
                            <span>Gewünschter Termin</span>
                            <strong>
                                ${esc(
                                    formatDateOnly(
                                        request?.requestedDate
                                    )
                                )}
                            </strong>
                        </div>
                    `
                    : ""
                }

                ${price
                    ? `
                        <div>
                            <span>Preis</span>
                            <strong>
                                ${esc(price)}
                            </strong>
                        </div>
                    `
                    : ""
                }

                <div>
                    <span>Vorgang</span>
                    <strong>
                        ${esc(
                            request?.id
                        )}
                    </strong>
                </div>
            </div>

            ${canManage
                ? `
                    <div
                        class="communication-ticket-actions"
                    >
                        ${status === "OPEN"
                            ? `
                                <button
                                    type="button"
                                    class="primary"
                                    data-communication-request-action="start"
                                    data-communication-request-id="${esc(
                                        request?.id
                                    )}"
                                >
                                    Bearbeitung starten
                                </button>
                            `
                            : ""
                        }

                        ${[
                            "OPEN",
                            "IN_PROGRESS",
                            "APPROVED"
                        ].includes(status)
                            ? `
                                <button
                                    type="button"
                                    class="communication-resolve-button"
                                    data-communication-request-action="complete"
                                    data-communication-request-id="${esc(
                                        request?.id
                                    )}"
                                >
                                    Anfrage abschließen
                                </button>
                            `
                            : ""
                        }
                    </div>
                `
                : ""
            }
        </article>
    `;
}

function renderCommunicationTickets(
    state
) {
    const tickets =
        visibleCommunicationTickets(
            state
        );

    const customerRequests =
        visibleCommunicationCustomerRequests(
            state,
            tickets
        );

    const items = [
        ...tickets.map(
            (ticket) => ({
                kind:
                    "TICKET",
                createdAt:
                    ticket?.createdAt,
                data:
                    ticket
            })
        ),
        ...customerRequests.map(
            (request) => ({
                kind:
                    "CUSTOMER_REQUEST",
                createdAt:
                    request?.createdAt,
                data:
                    request
            })
        )
    ].sort(
        (first, second) =>
            String(
                second?.createdAt ??
                ""
            ).localeCompare(
                String(
                    first?.createdAt ??
                    ""
                )
            )
    );

    return `
        <section
            class="communication-panel"
        >
            <div
                class="communication-section-heading"
            >
                <div>
                    <h2>
                        ${communicationRole(state) === "KUNDE"
                            ? "Meine Anfragen"
                            : "Tickets und Meldungen"
                        }
                    </h2>

                    <p>
                        Status, Verlauf und Bearbeitung der
                        erfassten Vorgänge.
                    </p>
                </div>

                <strong>
                    ${items.length}
                </strong>
            </div>

            <div
                class="communication-ticket-list"
            >
                ${items.length
                    ? items.map(
                        (item) =>
                            item.kind ===
                            "TICKET"
                                ? renderCommunicationTicketCard(
                                    state,
                                    item.data
                                )
                                : renderCommunicationCustomerRequestCard(
                                    state,
                                    item.data
                                )
                    ).join("")
                    : `
                        <div
                            class="communication-empty"
                        >
                            Noch keine Vorgänge vorhanden.
                        </div>
                    `
                }
            </div>
        </section>
    `;
}

function renderCommunicationNew(
    state
) {
    const {
        role,
        objects,
        rooms,
        typeOptions,
        quickOptions,
        draft
    } = ensureCommunicationDraft(
        state
    );

    const customerMode =
        role ===
        "KUNDE";

    const selectedObject =
        communicationObjectById(
            state,
            draft.objectId
        );

    const selectedRoom =
        communicationRoomById(
            state,
            draft.roomId
        );

    const description = [
        txt(draft.quickText),
        txt(draft.customText)
    ]
        .filter(Boolean)
        .join(" ");

    return `
        <section
            class="communication-panel"
        >
            <div
                class="communication-section-heading"
            >
                <div>
                    <h2>
                        ${customerMode
                            ? "Neue Kundenanfrage"
                            : "Neue Meldung"
                        }
                    </h2>

                    <p>
                        Beschwerde, nicht erledigte Aufgabe
                        oder wichtigen Hinweis strukturiert
                        übermitteln. Freitext ist optional.
                    </p>
                </div>
            </div>

            <div
                class="communication-field-group"
            >
                <strong>
                    1. Objekt
                </strong>

                <div
                    class="communication-choice-grid"
                >
                    ${objects.map(
                        (object) => {
                            const id =
                                objectId(object);

                            return `
                                <button
                                    type="button"
                                    class="${draft.objectId === id ? "selected" : ""}"
                                    data-communication-object-id="${esc(id)}"
                                >
                                    ${esc(
                                        objectName(
                                            object
                                        )
                                    )}
                                </button>
                            `;
                        }
                    ).join("") || `
                        <div
                            class="communication-empty"
                        >
                            Kein Objekt verfügbar.
                        </div>
                    `}
                </div>
            </div>

            <div
                class="communication-field-group"
            >
                <strong>
                    2. Raum oder Bereich
                </strong>

                <div
                    class="communication-choice-grid"
                >
                    <button
                        type="button"
                        class="${!draft.roomId ? "selected" : ""}"
                        data-communication-room-id=""
                    >
                        Gesamtes Objekt
                    </button>

                    ${rooms.map(
                        (room) => `
                            <button
                                type="button"
                                class="${draft.roomId === txt(room?.id) ? "selected" : ""}"
                                data-communication-room-id="${esc(
                                    room?.id
                                )}"
                            >
                                ${esc(
                                    room?.name
                                )}
                            </button>
                        `
                    ).join("")}
                </div>
            </div>

            <div
                class="communication-field-group"
            >
                <strong>
                    3. Art der Meldung
                </strong>

                <div
                    class="communication-choice-grid"
                >
                    ${typeOptions.map(
                        ([
                            value,
                            label
                        ]) => `
                            <button
                                type="button"
                                class="${draft.type === value ? "selected" : ""}"
                                data-communication-type="${esc(value)}"
                            >
                                ${esc(label)}
                            </button>
                        `
                    ).join("")}
                </div>
            </div>

            <div
                class="communication-field-group"
            >
                <strong>
                    4. Dringlichkeit
                </strong>

                <div
                    class="communication-choice-grid three"
                >
                    ${[
                        [
                            "LOW",
                            "Niedrig"
                        ],
                        [
                            "MEDIUM",
                            "Normal"
                        ],
                        [
                            "HIGH",
                            "Dringend"
                        ]
                    ].map(
                        ([
                            value,
                            label
                        ]) => `
                            <button
                                type="button"
                                class="${draft.priority === value ? "selected" : ""}"
                                data-communication-priority="${value}"
                            >
                                ${label}
                            </button>
                        `
                    ).join("")}
                </div>
            </div>

            <div
                class="communication-field-group"
            >
                <strong>
                    5. Passende Beschreibung
                </strong>

                <div
                    class="communication-quick-grid"
                >
                    ${quickOptions.map(
                        (option) => `
                            <button
                                type="button"
                                class="${draft.quickText === option ? "selected" : ""}"
                                data-communication-quick="${esc(
                                    option
                                )}"
                            >
                                ${esc(option)}
                            </button>
                        `
                    ).join("")}
                </div>
            </div>

            <label
                class="communication-text-field"
            >
                Zusätzliche Angaben (optional)

                <textarea
                    id="communication-details"
                    rows="4"
                    maxlength="600"
                    placeholder="Weitere Einzelheiten eingeben"
                >${esc(
                    draft.customText
                )}</textarea>
            </label>

            <div
                class="communication-preview"
            >
                <span>
                    Vorschau
                </span>

                <strong>
                    ${esc(
                        communicationTypeLabel(
                            draft.type
                        )
                    )}
                    ·
                    ${esc(
                        selectedRoom?.name ??
                        objectName(
                            selectedObject
                        )
                    )}
                </strong>

                <p>
                    ${esc(description)}
                </p>
            </div>

            <button
                type="button"
                class="primary communication-submit-button"
                data-communication-create
                ${objects.length
                    ? ""
                    : "disabled"
                }
            >
                ${customerMode
                    ? "Anfrage absenden"
                    : "Meldung absenden"
                }
            </button>

            <div
                id="communication-form-message"
                class="message"
                aria-live="polite"
            ></div>
        </section>
    `;
}

function renderCommunicationPage(
    state
) {
    const role =
        communicationRole(state);

    const allowed =
        [
            "SUPER_ADMIN",
            "ADMIN",
            "OBJEKTLEITER",
            "MITARBEITER",
            "BUCHHALTUNG",
            "KUNDE"
        ].includes(role);

    const unreadCount =
        communicationUnreadCount(
            state
        );

    const openTicketCount =
        communicationOpenTicketCount(
            state
        );

    const highPriorityCount =
        visibleCommunicationTickets(
            state
        ).filter(
            (ticket) =>
                txt(
                    ticket?.priority
                ).toUpperCase() ===
                    "HIGH" &&
                ![
                    "RESOLVED",
                    "CLOSED",
                    "COMPLETED"
                ].includes(
                    txt(
                        ticket?.status
                    ).toUpperCase()
                )
        ).length;

    if (
        runtime.communicationConfirmation
    ) {
        return `
            <section
                class="content-page communication-page"
            >
                ${communicationStyles()}
                ${renderCommunicationConfirmation(
                    runtime.communicationConfirmation
                )}
            </section>
        `;
    }

    return `
        <section
            class="content-page communication-page"
        >
            ${communicationStyles()}

            <header
                class="dashboard-heading"
            >
                <div>
                    <span class="eyebrow">
                        KOMMUNIKATION
                    </span>

                    <h1>
                        Meldungen und Tickets
                    </h1>

                    <p>
                        ${role === "KUNDE"
                            ? "Anfragen senden und den Bearbeitungsstatus verfolgen."
                            : "Beschwerden, nicht erledigte Aufgaben, Schäden und wichtige Hinweise übermitteln."
                        }
                    </p>
                </div>
            </header>

            ${allowed
                ? `
                    ${renderCommunicationNotice()}

                    <section
                        class="communication-summary-grid"
                    >
                        <article>
                            <span>Ungelesen</span>
                            <strong>${unreadCount}</strong>
                        </article>

                        <article>
                            <span>Offene Tickets</span>
                            <strong>${openTicketCount}</strong>
                        </article>

                        <article>
                            <span>Dringend</span>
                            <strong>${highPriorityCount}</strong>
                        </article>
                    </section>

                    <nav
                        class="communication-tabs"
                        aria-label="Kommunikationsbereiche"
                    >
                        ${[
                            [
                                "INBOX",
                                "Eingang"
                            ],
                            [
                                "TICKETS",
                                role === "KUNDE"
                                    ? "Meine Anfragen"
                                    : "Tickets"
                            ],
                            [
                                "NEW",
                                role === "KUNDE"
                                    ? "Neue Anfrage"
                                    : "Neue Meldung"
                            ]
                        ].map(
                            ([
                                value,
                                label
                            ]) => `
                                <button
                                    type="button"
                                    class="${runtime.communicationTab === value ? "active" : ""}"
                                    data-communication-tab="${value}"
                                >
                                    ${esc(label)}
                                </button>
                            `
                        ).join("")}
                    </nav>

                    ${runtime.communicationTab === "INBOX"
                        ? renderCommunicationInbox(
                            state
                        )
                        : runtime.communicationTab === "TICKETS"
                            ? renderCommunicationTickets(
                                state
                            )
                            : renderCommunicationNew(
                                state
                            )
                    }
                `
                : `
                    <div
                        class="communication-empty"
                    >
                        Für diese Rolle ist der Bereich nicht
                        freigegeben.
                    </div>
                `
            }
        </section>
    `;
}

function communicationStyles() {
    return `
        <style>
            .communication-page {
                display: grid;
                gap: 18px;
            }

            .communication-page h1,
            .communication-page h2,
            .communication-page h3,
            .communication-page p {
                margin: 0;
            }

            .communication-summary-grid {
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
                gap: 10px;
            }

            .communication-summary-grid article {
                display: grid;
                gap: 7px;
                padding: 15px;
                border: 1px solid var(--border);
                border-radius: 14px;
                background: var(--panel);
            }

            .communication-summary-grid span {
                color: var(--soft);
                font-size: 13px;
                font-weight: 700;
            }

            .communication-summary-grid strong {
                font-size: 24px;
            }

            .communication-tabs {
                display: grid;
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
                gap: 8px;
                padding: 7px;
                border: 1px solid var(--border);
                border-radius: 15px;
                background: #08172b;
            }

            .communication-tabs button {
                min-width: 0;
                min-height: 46px;
                padding: 8px;
                border: 0;
                border-radius: 10px;
                background: transparent;
                color: var(--soft);
                font-weight: 800;
                touch-action: manipulation;
            }

            .communication-tabs button.active {
                background: #10233f;
                color: var(--text);
                box-shadow:
                    0 0 0 1px var(--blue);
            }

            .communication-panel,
            .communication-confirmation {
                display: grid;
                gap: 16px;
                padding: 19px;
                border: 1px solid var(--border);
                border-radius: 18px;
                background: var(--panel);
                box-shadow:
                    0 16px 45px
                    rgba(0, 0, 0, .14);
            }

            .communication-section-heading {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 14px;
            }

            .communication-section-heading p {
                margin-top: 5px;
                color: var(--soft);
                line-height: 1.45;
            }

            .communication-section-heading > strong {
                display: grid;
                min-width: 42px;
                min-height: 42px;
                place-items: center;
                border-radius: 12px;
                background: #10233f;
            }

            .communication-small-button,
            .communication-read-button,
            .communication-thread-toggle {
                min-height: 42px;
                padding: 8px 11px;
                border: 1px solid var(--border);
                border-radius: 11px;
                background: #10233f;
                color: var(--text);
                font-weight: 800;
            }

            .communication-inbox-list,
            .communication-ticket-list,
            .communication-thread-list {
                display: grid;
                gap: 11px;
            }

            .communication-inbox-card,
            .communication-ticket-card {
                display: grid;
                gap: 12px;
                padding: 15px;
                border: 1px solid var(--border);
                border-radius: 14px;
                background: #08172b;
            }

            .communication-inbox-card.unread {
                border-color:
                    rgba(95, 127, 255, .58);
                box-shadow:
                    inset 4px 0 0 var(--blue);
            }

            .communication-inbox-card p,
            .communication-ticket-card > p {
                color: var(--soft);
                line-height: 1.5;
            }

            .communication-inbox-card > small {
                color: var(--soft);
            }

            .communication-inbox-topline,
            .communication-ticket-topline,
            .communication-ticket-heading,
            .communication-thread-list article > div {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
            }

            .communication-inbox-topline > span:last-child,
            .communication-ticket-heading > span,
            .communication-thread-list article span {
                color: var(--soft);
                font-size: 12px;
            }

            .communication-kind-badge,
            .communication-priority,
            .communication-status {
                display: inline-flex;
                min-height: 29px;
                align-items: center;
                padding: 5px 9px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 900;
            }

            .communication-kind-badge {
                background:
                    rgba(95, 127, 255, .18);
                color: #b9c5ff;
            }

            .communication-priority.high {
                background:
                    rgba(235, 87, 87, .18);
                color: #ff9c9c;
            }

            .communication-priority.medium {
                background:
                    rgba(255, 171, 64, .15);
                color: #ffd18d;
            }

            .communication-priority.low {
                background:
                    rgba(255, 255, 255, .08);
                color: var(--soft);
            }

            .communication-status.open {
                background:
                    rgba(255, 171, 64, .15);
                color: #ffd18d;
            }

            .communication-status.progress {
                background:
                    rgba(95, 127, 255, .18);
                color: #b9c5ff;
            }

            .communication-status.success {
                background:
                    rgba(39, 174, 96, .17);
                color: #7df0b1;
            }

            .communication-ticket-heading small {
                color: var(--soft);
                font-weight: 800;
            }

            .communication-ticket-heading h3 {
                margin-top: 4px;
                font-size: 18px;
            }

            .communication-detail-list {
                display: grid;
                overflow: hidden;
                border: 1px solid var(--border);
                border-radius: 12px;
            }

            .communication-detail-list > div {
                display: grid;
                grid-template-columns:
                    minmax(105px, .8fr)
                    minmax(0, 1.4fr);
                gap: 12px;
                padding: 10px 12px;
                border-bottom:
                    1px solid var(--border);
            }

            .communication-detail-list > div:last-child {
                border-bottom: 0;
            }

            .communication-detail-list span {
                color: var(--soft);
                font-size: 13px;
                font-weight: 700;
            }

            .communication-detail-list strong {
                min-width: 0;
                overflow-wrap: anywhere;
                text-align: right;
            }

            .communication-ticket-actions,
            .communication-confirmation-actions {
                display: grid;
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
                gap: 9px;
            }

            .communication-ticket-actions button,
            .communication-confirmation-actions button {
                min-height: 48px;
                padding: 9px 11px;
                border-radius: 12px;
                font-weight: 900;
            }

            .communication-ticket-actions .secondary,
            .communication-confirmation-actions .secondary {
                border: 1px solid var(--border);
                background: #10233f;
                color: var(--text);
            }

            .communication-resolve-button {
                border: 1px solid
                    rgba(39, 174, 96, .52);
                background:
                    rgba(39, 174, 96, .14);
                color: #7df0b1;
            }

            .communication-thread {
                display: grid;
                gap: 12px;
                padding: 14px;
                border: 1px solid
                    rgba(95, 127, 255, .4);
                border-radius: 13px;
                background:
                    rgba(95, 127, 255, .07);
            }

            .communication-thread > div:first-child p {
                margin-top: 4px;
                color: var(--soft);
                line-height: 1.4;
            }

            .communication-thread-list article {
                display: grid;
                gap: 7px;
                padding: 11px;
                border: 1px solid var(--border);
                border-radius: 11px;
                background: #08172b;
            }

            .communication-thread-list article p {
                color: var(--soft);
                line-height: 1.45;
            }

            .communication-reply-options,
            .communication-choice-grid,
            .communication-quick-grid {
                display: grid;
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
                gap: 8px;
            }

            .communication-choice-grid.three {
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
            }

            .communication-reply-options button,
            .communication-choice-grid button,
            .communication-quick-grid button {
                min-width: 0;
                min-height: 48px;
                padding: 9px 10px;
                border: 1px solid var(--border);
                border-radius: 11px;
                background: #08172b;
                color: var(--text);
                font-weight: 800;
                line-height: 1.3;
                touch-action: manipulation;
            }

            .communication-reply-options button.selected,
            .communication-choice-grid button.selected,
            .communication-quick-grid button.selected {
                border-color: var(--blue);
                background:
                    rgba(95, 127, 255, .22);
                box-shadow:
                    0 0 0 2px var(--blue);
            }

            .communication-field-group,
            .communication-text-field {
                display: grid;
                gap: 9px;
            }

            .communication-field-group > strong,
            .communication-text-field {
                color: var(--soft);
                font-weight: 800;
            }

            .communication-text-field textarea {
                width: 100%;
                min-height: 108px;
                padding: 13px;
                border: 1px solid var(--border);
                border-radius: 12px;
                background: #08172b;
                color: var(--text);
                font: inherit;
                line-height: 1.45;
                resize: vertical;
                opacity: 1;
                pointer-events: auto;
                touch-action: manipulation;
                -webkit-appearance: none;
                appearance: none;
            }

            .communication-text-field textarea:focus {
                border-color: var(--blue);
                outline: 2px solid var(--blue);
                outline-offset: 2px;
            }

            .communication-preview {
                display: grid;
                gap: 6px;
                padding: 14px;
                border: 1px solid var(--border);
                border-radius: 13px;
                background: #08172b;
            }

            .communication-preview span,
            .communication-preview p {
                color: var(--soft);
            }

            .communication-preview p {
                line-height: 1.45;
            }

            .communication-submit-button {
                width: 100%;
                min-height: 54px;
            }

            .communication-notice {
                padding: 14px 16px;
                border-radius: 13px;
                font-weight: 800;
            }

            .communication-notice.success {
                border: 1px solid
                    rgba(39, 174, 96, .48);
                background:
                    rgba(39, 174, 96, .14);
                color: #7df0b1;
            }

            .communication-notice.warning {
                border: 1px solid
                    rgba(255, 171, 64, .48);
                background:
                    rgba(255, 171, 64, .12);
                color: #ffd18d;
            }

            .communication-confirmation {
                border-color:
                    rgba(39, 174, 96, .48);
                background:
                    linear-gradient(
                        180deg,
                        rgba(39, 174, 96, .14),
                        var(--panel)
                    );
            }

            .communication-confirmation p {
                margin-top: 5px;
                color: var(--soft);
                line-height: 1.5;
            }

            .communication-confirmation-symbol {
                display: grid;
                width: 64px;
                height: 64px;
                place-items: center;
                border: 2px solid
                    rgba(39, 174, 96, .78);
                border-radius: 50%;
                color: #7df0b1;
                font-size: 32px;
                font-weight: 900;
            }

            .communication-empty {
                padding: 15px;
                border: 1px dashed var(--border);
                border-radius: 12px;
                color: var(--soft);
                line-height: 1.45;
            }

            .communication-empty.compact {
                padding: 11px;
            }

            @media (max-width: 640px) {
                .communication-summary-grid {
                    grid-template-columns: 1fr;
                }

                .communication-choice-grid,
                .communication-quick-grid,
                .communication-reply-options,
                .communication-ticket-actions,
                .communication-confirmation-actions {
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                }
            }

            @media (max-width: 390px) {
                .communication-panel,
                .communication-confirmation,
                .communication-inbox-card,
                .communication-ticket-card {
                    padding: 14px 12px;
                }

                .communication-tabs {
                    grid-template-columns: 1fr;
                }

                .communication-detail-list > div {
                    grid-template-columns: 1fr;
                    gap: 4px;
                }

                .communication-detail-list strong {
                    text-align: left;
                }

                .communication-ticket-heading {
                    display: grid;
                }

                .communication-choice-grid.three {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `;
}

function markCommunicationMessageRead(
    state,
    messageId
) {
    const userId =
        communicationUserId(
            state
        );

    const message =
        arr(state?.messages)
            .find(
                (entry) =>
                    txt(entry?.id) ===
                    txt(messageId)
            );

    if (!message) {
        throw new Error(
            "Die Nachricht wurde nicht gefunden."
        );
    }

    const readByUserIds = [
        ...new Set([
            ...arr(
                message?.readByUserIds
            ).map(String),
            userId
        ])
    ];

    updateCollectionEntry(
        "messages",
        messageId,
        {
            readByUserIds,
            updatedAt:
                new Date()
                    .toISOString()
        },
        {
            notify:
                false,
            persist:
                true
        }
    );
}

function markCommunicationNotificationRead(
    state,
    notificationId
) {
    const notification =
        arr(state?.notifications)
            .find(
                (entry) =>
                    txt(entry?.id) ===
                    txt(notificationId)
            );

    if (!notification) {
        throw new Error(
            "Der Hinweis wurde nicht gefunden."
        );
    }

    const timestamp =
        new Date()
            .toISOString();

    updateCollectionEntry(
        "notifications",
        notificationId,
        {
            read:
                true,
            status:
                "READ",
            readAt:
                timestamp,
            updatedAt:
                timestamp
        },
        {
            notify:
                false,
            persist:
                true
        }
    );
}

function markAllCommunicationRead(
    state
) {
    visibleCommunicationMessages(
        state
    )
        .filter(
            (message) =>
                communicationMessageUnread(
                    state,
                    message
                )
        )
        .forEach(
            (message) =>
                markCommunicationMessageRead(
                    state,
                    message?.id
                )
        );

    visibleCommunicationNotifications(
        state
    )
        .filter(
            communicationNotificationUnread
        )
        .forEach(
            (notification) =>
                markCommunicationNotificationRead(
                    state,
                    notification?.id
                )
        );

    runtime.communicationNotice = {
        tone:
            "success",
        text:
            "Alle Nachrichten und Hinweise wurden als gelesen markiert."
    };

    renderApp(runtime);
}

function createCommunicationEntry(
    state
) {
    const {
        role,
        objects,
        draft
    } = ensureCommunicationDraft(
        state
    );

    const selectedObject =
        objects.find(
            (object) =>
                objectId(object) ===
                txt(draft.objectId)
        );

    if (!selectedObject) {
        throw new Error(
            "Bitte wähle ein gültiges Objekt aus."
        );
    }

    const selectedRoom =
        communicationRoomById(
            state,
            draft.roomId
        );

    const description = [
        txt(draft.quickText),
        txt(draft.customText)
    ]
        .filter(Boolean)
        .join(" ");

    if (!description) {
        throw new Error(
            "Bitte wähle eine Beschreibung aus."
        );
    }

    const timestamp =
        new Date()
            .toISOString();

    const currentUser =
        state?.currentUser ?? {};

    const managerId =
        communicationManagerId(
            state,
            selectedObject
        );

    const typeLabel =
        communicationTypeLabel(
            draft.type
        );

    const title =
        `${typeLabel} · ${selectedRoom?.name ?? objectName(selectedObject)}`;

    if (
        role ===
        "KUNDE"
    ) {
        const requestId =
            createId(
                "REQUEST"
            );

        const ticketId =
            createId(
                "TICKET"
            );

        const request = {
            id:
                requestId,
            customerUserId:
                communicationUserId(
                    state
                ),
            customerId:
                txt(
                    currentUser?.customerId
                ),
            objectId:
                objectId(
                    selectedObject
                ),
            roomId:
                txt(
                    selectedRoom?.id
                ) || null,
            type:
                txt(draft.type),
            category:
                txt(draft.type),
            priority:
                txt(draft.priority),
            status:
                "OPEN",
            title,
            description,
            requestedDate:
                null,
            preferredTime:
                null,
            recurring:
                false,
            recurrenceRule:
                null,
            attachments:
                [],
            customerVisible:
                true,
            requiresApproval:
                draft.type !==
                "INFORMATION",
            approval: {
                status:
                    draft.type ===
                    "INFORMATION"
                        ? "NOT_REQUIRED"
                        : "PENDING",
                approvedByUserId:
                    null,
                approvedAt:
                    null,
                rejectedByUserId:
                    null,
                rejectedAt:
                    null,
                reason:
                    ""
            },
            assignment: {
                assignedToUserId:
                    managerId ||
                    null,
                assignedEmployeeId:
                    null,
                plannedShiftId:
                    null
            },
            pricing: {
                priceRequired:
                    draft.type ===
                    "ADDITIONAL_SERVICE",
                estimatedPrice:
                    null,
                currency:
                    "EUR",
                customerApprovalRequired:
                    draft.type ===
                    "ADDITIONAL_SERVICE",
                customerApproved:
                    false,
                customerApprovedAt:
                    null
            },
            relatedTicketId:
                ticketId,
            createdAt:
                timestamp,
            updatedAt:
                timestamp,
            completedAt:
                null,
            source:
                "LOCAL_TEST"
        };

        const ticket = {
            id:
                ticketId,
            relatedCustomerRequestId:
                requestId,
            objectId:
                request.objectId,
            roomId:
                request.roomId,
            createdByUserId:
                request.customerUserId,
            assignedToUserId:
                managerId,
            type:
                "CUSTOMER_REQUEST",
            requestType:
                request.type,
            priority:
                request.priority,
            status:
                "OPEN",
            title,
            description,
            channel:
                "CUSTOMER_PORTAL",
            attachments:
                [],
            customerVisible:
                true,
            createdAt:
                timestamp,
            updatedAt:
                timestamp,
            resolvedAt:
                null,
            source:
                "LOCAL_TEST"
        };

        addCollectionEntry(
            "customerRequests",
            request,
            {
                notify:
                    false,
                persist:
                    true
            }
        );

        addCollectionEntry(
            "tickets",
            ticket,
            {
                notify:
                    false,
                persist:
                    true
            }
        );

        createCommunicationNotification({
            recipientUserId:
                managerId,
            objectId:
                request.objectId,
            type:
                "CUSTOMER_REQUEST",
            priority:
                request.priority,
            title:
                "Neue Kundenanfrage",
            message:
                `${userName(currentUser)}: ${title}`,
            relatedEntityType:
                "TICKET",
            relatedEntityId:
                ticketId
        });

        runtime.communicationConfirmation = {
            id:
                requestId,
            heading:
                "Anfrage wurde übermittelt",
            message:
                "Die zuständige Objektleitung wurde informiert.",
            objectName:
                objectName(
                    selectedObject
                ),
            typeLabel,
            statusLabel:
                "Offen"
        };
    }
    else {
        const ticket = {
            id:
                createId(
                    "TICKET"
                ),
            objectId:
                objectId(
                    selectedObject
                ),
            roomId:
                txt(
                    selectedRoom?.id
                ) || null,
            createdByUserId:
                communicationUserId(
                    state
                ),
            assignedToUserId:
                managerId,
            type:
                txt(draft.type),
            priority:
                txt(draft.priority),
            status:
                "OPEN",
            title,
            description,
            channel:
                "APP",
            attachments:
                [],
            customerVisible:
                false,
            createdAt:
                timestamp,
            updatedAt:
                timestamp,
            resolvedAt:
                null,
            source:
                "LOCAL_TEST"
        };

        addCollectionEntry(
            "tickets",
            ticket,
            {
                notify:
                    false,
                persist:
                    true
            }
        );

        createCommunicationNotification({
            recipientUserId:
                managerId,
            objectId:
                ticket.objectId,
            type:
                "TICKET_CREATED",
            priority:
                ticket.priority,
            title:
                "Neue Meldung",
            message:
                `${userName(currentUser)}: ${title}`,
            relatedEntityType:
                "TICKET",
            relatedEntityId:
                ticket.id
        });

        runtime.communicationConfirmation = {
            id:
                ticket.id,
            heading:
                "Meldung wurde gespeichert",
            message:
                "Die zuständige Objektleitung wurde informiert.",
            objectName:
                objectName(
                    selectedObject
                ),
            typeLabel,
            statusLabel:
                "Offen"
        };
    }

    runtime.communicationNotice =
        null;

    runtime.communicationExpandedTicketId =
        "";

    renderApp(runtime);
}

function findCommunicationTicket(
    state,
    ticketId
) {
    return arr(state?.tickets)
        .find(
            (ticket) =>
                txt(ticket?.id) ===
                txt(ticketId) &&
                isCommunicationTicket(
                    ticket
                )
        ) ?? null;
}

function updateCommunicationTicketStatus(
    state,
    ticketId,
    action
) {
    const ticket =
        findCommunicationTicket(
            state,
            ticketId
        );

    if (!ticket) {
        throw new Error(
            "Das Ticket wurde nicht gefunden."
        );
    }

    if (
        !communicationCanManageTicket(
            state,
            ticket
        )
    ) {
        throw new Error(
            "Für dieses Ticket fehlt die Bearbeitungsberechtigung."
        );
    }

    const timestamp =
        new Date()
            .toISOString();

    const configuration = {
        start: {
            status:
                "IN_PROGRESS",
            notice:
                "Das Ticket ist jetzt in Bearbeitung."
        },
        resolve: {
            status:
                "RESOLVED",
            notice:
                "Das Ticket wurde als erledigt markiert."
        },
        reopen: {
            status:
                "OPEN",
            notice:
                "Das Ticket wurde wieder geöffnet."
        }
    }[action];

    if (!configuration) {
        throw new Error(
            "Unbekannte Ticketaktion."
        );
    }

    const updated =
        updateCollectionEntry(
            "tickets",
            ticketId,
            {
                status:
                    configuration.status,
                updatedAt:
                    timestamp,
                resolvedAt:
                    configuration.status ===
                    "RESOLVED"
                        ? timestamp
                        : null,
                reviewedByUserId:
                    communicationUserId(
                        state
                    ),
                reviewedByUserName:
                    userName(
                        state?.currentUser
                    )
            },
            {
                notify:
                    false,
                persist:
                    true
            }
        );

    const customerRequest =
        arr(
            state?.customerRequests
        ).find(
            (request) =>
                txt(
                    request?.relatedTicketId
                ) ===
                    txt(ticketId) ||
                txt(request?.id) ===
                    txt(
                        ticket
                            ?.relatedCustomerRequestId
                    )
        );

    if (customerRequest) {
        const requestStatus =
            configuration.status ===
            "RESOLVED"
                ? "COMPLETED"
                : configuration.status;

        updateCollectionEntry(
            "customerRequests",
            customerRequest.id,
            {
                status:
                    requestStatus,
                updatedAt:
                    timestamp,
                completedAt:
                    requestStatus ===
                    "COMPLETED"
                        ? timestamp
                        : null
            },
            {
                notify:
                    false,
                persist:
                    true
            }
        );
    }

    createCommunicationNotification({
        recipientUserId:
            ticket?.createdByUserId ??
            ticket?.employeeId,
        objectId:
            ticket?.objectId,
        type:
            "TICKET_STATUS_CHANGED",
        priority:
            ticket?.priority,
        title:
            `Ticket ${communicationStatusLabel(configuration.status)}`,
        message:
            `${ticket?.title}: ${configuration.notice}`,
        relatedEntityType:
            "TICKET",
        relatedEntityId:
            ticketId
    });

    runtime.communicationNotice = {
        tone:
            "success",
        text:
            configuration.notice
    };

    runtime.communicationExpandedTicketId =
        txt(updated?.id) ||
        txt(ticketId);

    renderApp(runtime);
}

function updateCommunicationCustomerRequestStatus(
    state,
    requestId,
    action
) {
    const request =
        arr(
            state?.customerRequests
        ).find(
            (entry) =>
                txt(entry?.id) ===
                txt(requestId)
        );

    if (!request) {
        throw new Error(
            "Die Kundenanfrage wurde nicht gefunden."
        );
    }

    if (
        !communicationCanManageCustomerRequest(
            state,
            request
        )
    ) {
        throw new Error(
            "Für diese Kundenanfrage fehlt die Bearbeitungsberechtigung."
        );
    }

    const timestamp =
        new Date()
            .toISOString();

    const status =
        action ===
        "start"
            ? "IN_PROGRESS"
            : action ===
                "complete"
                ? "COMPLETED"
                : "";

    if (!status) {
        throw new Error(
            "Unbekannte Anfrageaktion."
        );
    }

    updateCollectionEntry(
        "customerRequests",
        requestId,
        {
            status,
            updatedAt:
                timestamp,
            completedAt:
                status ===
                "COMPLETED"
                    ? timestamp
                    : null
        },
        {
            notify:
                false,
            persist:
                true
        }
    );

    createCommunicationNotification({
        recipientUserId:
            request?.customerUserId,
        objectId:
            request?.objectId,
        type:
            "CUSTOMER_REQUEST_STATUS",
        priority:
            request?.priority,
        title:
            `Anfrage ${communicationStatusLabel(status)}`,
        message:
            `${request?.title}: ${communicationStatusLabel(status)}`,
        relatedEntityType:
            "CUSTOMER_REQUEST",
        relatedEntityId:
            requestId
    });

    runtime.communicationNotice = {
        tone:
            "success",
        text:
            status ===
            "COMPLETED"
                ? "Die Kundenanfrage wurde abgeschlossen."
                : "Die Kundenanfrage ist jetzt in Bearbeitung."
    };

    renderApp(runtime);
}

function sendCommunicationTicketReply(
    state,
    ticketId
) {
    const ticket =
        findCommunicationTicket(
            state,
            ticketId
        );

    if (!ticket) {
        throw new Error(
            "Das Ticket wurde nicht gefunden."
        );
    }

    const visible =
        visibleCommunicationTickets(
            state
        ).some(
            (entry) =>
                txt(entry?.id) ===
                txt(ticketId)
        );

    if (!visible) {
        throw new Error(
            "Für dieses Ticket fehlt die Zugriffsberechtigung."
        );
    }

    const replyDraft =
        runtime.communicationReplyDraft;

    const replyText = [
        replyDraft.ticketId ===
            txt(ticketId)
            ? txt(
                replyDraft.preset
            )
            : "",
        replyDraft.ticketId ===
            txt(ticketId)
            ? txt(
                replyDraft.customText
            )
            : ""
    ]
        .filter(Boolean)
        .join(" ");

    if (!replyText) {
        throw new Error(
            "Bitte wähle eine Antwort oder gib einen Text ein."
        );
    }

    const currentUserId =
        communicationUserId(
            state
        );

    const recipientUserIds = [
        txt(
            ticket?.createdByUserId ??
            ticket?.employeeId
        ),
        txt(
            ticket?.assignedToUserId
        )
    ]
        .filter(Boolean)
        .filter(
            (userId) =>
                userId !==
                currentUserId
        );

    const uniqueRecipientIds = [
        ...new Set(
            recipientUserIds
        )
    ];

    if (!uniqueRecipientIds.length) {
        const managerId =
            communicationManagerId(
                state,
                communicationObjectById(
                    state,
                    ticket?.objectId
                )
            );

        if (
            managerId &&
            managerId !==
            currentUserId
        ) {
            uniqueRecipientIds.push(
                managerId
            );
        }
    }

    const timestamp =
        new Date()
            .toISOString();

    const message = {
        id:
            createId(
                "MESSAGE"
            ),
        senderUserId:
            currentUserId,
        recipientUserIds:
            uniqueRecipientIds,
        objectId:
            txt(
                ticket?.objectId
            ),
        relatedTicketId:
            txt(ticketId),
        subject:
            `Antwort: ${ticket?.title}`,
        message:
            replyText,
        type:
            "TICKET_REPLY",
        priority:
            txt(
                ticket?.priority
            ) ||
            "MEDIUM",
        status:
            "SENT",
        readByUserIds: [
            currentUserId
        ],
        attachments:
            [],
        createdAt:
            timestamp,
        updatedAt:
            timestamp,
        source:
            "LOCAL_TEST"
    };

    addCollectionEntry(
        "messages",
        message,
        {
            notify:
                false,
            persist:
                true
        }
    );

    uniqueRecipientIds.forEach(
        (recipientUserId) =>
            createCommunicationNotification({
                recipientUserId,
                objectId:
                    ticket?.objectId,
                type:
                    "TICKET_REPLY",
                priority:
                    ticket?.priority,
                title:
                    "Neue Ticketantwort",
                message:
                    `${userName(state?.currentUser)} hat auf ${ticket?.title} geantwortet.`,
                relatedEntityType:
                    "TICKET",
                relatedEntityId:
                    ticketId
            })
    );

    runtime.communicationReplyDraft = {
        ticketId:
            txt(ticketId),
        preset:
            "",
        customText:
            ""
    };

    runtime.communicationNotice = {
        tone:
            "success",
        text:
            "Die Antwort wurde gesendet."
    };

    runtime.communicationExpandedTicketId =
        txt(ticketId);

    renderApp(runtime);
}

function renderGeneric(route) {
    const title = ({
        [ROUTES.TASKS]:
            "Aufgaben",

        [ROUTES.COMMUNICATION]:
            "Meldungen",

        [ROUTES.HELP]:
            "Hilfe",

        [ROUTES.PERSONNEL]:
            "Mitarbeiter",

        [ROUTES.TIMES]:
            "Zeiten",

        [ROUTES.REPORTS]:
            "Berichte",

        [ROUTES.ANALYSIS]:
            "Auswertungen",

        [ROUTES.SETTINGS]:
            "Einstellungen"
    }[route] ?? "Facility OS");

    return `
        <section class="content-page">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">
                        FACILITY OS
                    </span>

                    <h1>
                        ${title}
                    </h1>

                    <p>
                        Der Inhalt wird im
                        n&auml;chsten Schritt
                        erg&auml;nzt.
                    </p>
                </div>
            </header>
        </section>
    `;
}

function renderNavigation(className) {
    const items = [
        [
            ROUTES.OVERVIEW,
            "home",
            "Start"
        ],
        [
            ROUTES.TASKS,
            "tasks",
            "Aufgaben"
        ],
        [
            ROUTES.COMMUNICATION,
            "message",
            "Meldungen"
        ],
        [
            ROUTES.MORE,
            "more",
            "Mehr"
        ]
    ];

    return `
        <nav class="${className}">
            ${items.map(
                (
                    [
                        route,
                        iconName,
                        label
                    ]
                ) => `
                    <button
                        data-route="${route}"
                        class="${runtime.route === route ? "active" : ""}"
                        type="button"
                    >
                        <span>
                            ${icon(iconName)}
                        </span>

                        <small>
                            ${label}
                        </small>
                    </button>
                `
            ).join("")}
        </nav>
    `;
}

function renderAbsenceDashboardEntry(state) {
    const role =
        normalizedRole(state);

    if (
        ![
            "SUPER_ADMIN",
            "ADMIN",
            "OBJEKTLEITER",
            "MITARBEITER",
            "BUCHHALTUNG"
        ].includes(role)
    ) {
        return "";
    }

    const requests =
        visibleAbsenceRequests(
            state
        );

    const activeRequests =
        requests.filter(
            (request) =>
                ![
                    "REJECTED",
                    "CANCELLED"
                ].includes(
                    txt(
                        request?.status
                    ).toUpperCase()
                )
        );

    const openReplacements =
        activeRequests.filter(
            (request) =>
                txt(
                    request
                        ?.replacementStatus
                ).toUpperCase() !==
                "ASSIGNED"
        ).length;

    if (
        role ===
        "MITARBEITER"
    ) {
        return `
            <section
                class="absence-dashboard-entry"
            >
                <style>
                    .absence-dashboard-entry {
                        display: grid;
                        gap: 14px;
                        margin: 0 0 18px;
                        padding: 18px;
                        border: 1px solid
                            rgba(95, 127, 255, .48);
                        border-radius: 18px;
                        background:
                            linear-gradient(
                                135deg,
                                rgba(95, 127, 255, .18),
                                rgba(8, 23, 43, .98)
                            );
                        box-shadow:
                            0 16px 42px
                            rgba(0, 0, 0, .16);
                    }

                    .absence-dashboard-entry-heading {
                        display: flex;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 14px;
                    }

                    .absence-dashboard-entry h2,
                    .absence-dashboard-entry p {
                        margin: 0;
                    }

                    .absence-dashboard-entry p {
                        margin-top: 5px;
                        color: var(--soft);
                        line-height: 1.45;
                    }

                    .absence-dashboard-entry-count {
                        display: grid;
                        min-width: 44px;
                        min-height: 44px;
                        place-items: center;
                        border-radius: 13px;
                        background: #10233f;
                        color: var(--text);
                        font-size: 18px;
                        font-weight: 900;
                    }

                    .absence-dashboard-entry-actions {
                        display: grid;
                        grid-template-columns:
                            repeat(2, minmax(0, 1fr));
                        gap: 10px;
                    }

                    .absence-dashboard-entry-actions button {
                        min-height: 54px;
                        padding: 10px 13px;
                        border-radius: 13px;
                        font-weight: 900;
                        touch-action: manipulation;
                        -webkit-tap-highlight-color:
                            transparent;
                    }

                    .absence-dashboard-entry-actions
                    .vacation-action {
                        border: 1px solid
                            rgba(95, 127, 255, .65);
                        background:
                            rgba(95, 127, 255, .24);
                        color: #d9e0ff;
                    }

                    .absence-dashboard-entry-actions
                    .sick-action {
                        border: 1px solid
                            rgba(255, 171, 64, .62);
                        background:
                            rgba(255, 171, 64, .16);
                        color: #ffd18d;
                    }

                    @media (max-width: 390px) {
                        .absence-dashboard-entry {
                            padding: 16px 13px;
                        }

                        .absence-dashboard-entry-actions {
                            grid-template-columns: 1fr;
                        }
                    }
                </style>

                <div
                    class="absence-dashboard-entry-heading"
                >
                    <div>
                        <span class="eyebrow">
                            ABWESENHEIT
                        </span>

                        <h2>
                            Urlaub oder Krankheit melden
                        </h2>

                        <p>
                            Antrag oder Krankmeldung direkt
                            von der Startseite aus öffnen.
                        </p>
                    </div>

                    <span
                        class="absence-dashboard-entry-count"
                        aria-label="${activeRequests.length} aktive Vorgänge"
                    >
                        ${activeRequests.length}
                    </span>
                </div>

                <div
                    class="absence-dashboard-entry-actions"
                >
                    <button
                        type="button"
                        class="vacation-action"
                        data-absence-open-mode="VACATION_REQUEST"
                    >
                        Urlaub beantragen
                    </button>

                    <button
                        type="button"
                        class="sick-action"
                        data-absence-open-mode="SICK_REPORT"
                    >
                        Krankmelden
                    </button>
                </div>
            </section>
        `;
    }

    const title =
        role ===
        "BUCHHALTUNG"
            ? "Abwesenheitsübersicht"
            : "Abwesenheiten und Vertretung";

    const description =
        role ===
        "BUCHHALTUNG"
            ? "Urlaub und Krankheit für Zeitprüfung und Abrechnung ansehen."
            : "Anträge prüfen, Krankmeldungen bestätigen und Vertretungen organisieren.";

    return `
        <section
            class="absence-dashboard-entry"
        >
            <style>
                .absence-dashboard-entry {
                    display: grid;
                    gap: 14px;
                    margin: 0 0 18px;
                    padding: 18px;
                    border: 1px solid
                        rgba(95, 127, 255, .48);
                    border-radius: 18px;
                    background:
                        linear-gradient(
                            135deg,
                            rgba(95, 127, 255, .18),
                            rgba(8, 23, 43, .98)
                        );
                    box-shadow:
                        0 16px 42px
                        rgba(0, 0, 0, .16);
                }

                .absence-dashboard-entry-heading {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 14px;
                }

                .absence-dashboard-entry h2,
                .absence-dashboard-entry p {
                    margin: 0;
                }

                .absence-dashboard-entry p {
                    margin-top: 5px;
                    color: var(--soft);
                    line-height: 1.45;
                }

                .absence-dashboard-entry-count {
                    display: grid;
                    min-width: 44px;
                    min-height: 44px;
                    place-items: center;
                    border-radius: 13px;
                    background: #10233f;
                    color: var(--text);
                    font-size: 18px;
                    font-weight: 900;
                }

                .absence-dashboard-manager-button {
                    width: 100%;
                    min-height: 54px;
                    padding: 11px 14px;
                    border: 1px solid
                        rgba(95, 127, 255, .65);
                    border-radius: 13px;
                    background:
                        rgba(95, 127, 255, .24);
                    color: #d9e0ff;
                    font-weight: 900;
                    touch-action: manipulation;
                    -webkit-tap-highlight-color:
                        transparent;
                }

                .absence-dashboard-entry-meta {
                    color: var(--soft);
                    font-size: 13px;
                    font-weight: 700;
                }

                @media (max-width: 390px) {
                    .absence-dashboard-entry {
                        padding: 16px 13px;
                    }
                }
            </style>

            <div
                class="absence-dashboard-entry-heading"
            >
                <div>
                    <span class="eyebrow">
                        ABWESENHEIT
                    </span>

                    <h2>
                        ${esc(title)}
                    </h2>

                    <p>
                        ${esc(description)}
                    </p>
                </div>

                <span
                    class="absence-dashboard-entry-count"
                    aria-label="${activeRequests.length} aktive Vorgänge"
                >
                    ${activeRequests.length}
                </span>
            </div>

            <button
                type="button"
                class="absence-dashboard-manager-button"
                data-more-section="ABSENCE"
            >
                Bereich öffnen
            </button>

            ${role === "BUCHHALTUNG"
                ? ""
                : `
                    <div
                        class="absence-dashboard-entry-meta"
                    >
                        ${openReplacements}
                        offene Vertretung${openReplacements === 1 ? "" : "en"}
                    </div>
                `
            }
        </section>
    `;
}

function renderShell(state) {
    let page =
        renderGeneric(
            runtime.route
        );

    if (
        runtime.route ===
        ROUTES.OVERVIEW
    ) {
        runtime.objectSection = "";

        page =
            renderDashboardPage(
                state
            );
    }

    if (
        runtime.route ===
        ROUTES.OBJECT_DETAIL
    ) {
        page =
            runtime.objectSection
                ? renderObjectSectionPage(
                    state,
                    runtime.objectSection
                )
                : renderObjectDetailPage(
                    state
                );
    }

    if (
        runtime.route ===
        ROUTES.MATERIALS
    ) {
        page =
            renderMaterials(
                state
            );
    }

    if (
        runtime.route ===
        ROUTES.TASKS
    ) {
        page =
            renderTaskPage(
                state
            );
    }

    if (
        runtime.route ===
        ROUTES.COMMUNICATION
    ) {
        page =
            renderCommunicationPage(
                state
            );
    }

    if (
        runtime.route ===
        ROUTES.MORE
    ) {
        page =
            renderMorePage(
                state
            );
    }

    const user =
        state?.currentUser;

    return `
        <div class="app-shell">
            <aside class="sidebar">
                <div class="brand">
                    <span class="brand-logo">
                        ${icon("logo")}
                    </span>

                    <strong>
                        FACILITY OS
                    </strong>
                </div>

                ${renderNavigation(
                    "sidebar-nav"
                )}

                <button
                    class="logout"
                    data-action="logout"
                    type="button"
                >
                    <span>
                        ${icon("logout")}
                    </span>

                    Abmelden
                </button>
            </aside>

            <div class="app-area">
                <header class="topbar">
                    <div
                        class="brand mobile-brand"
                    >
                        <span
                            class="brand-logo"
                        >
                            ${icon("logo")}
                        </span>

                        <strong>
                            FACILITY OS
                        </strong>
                    </div>

                    <div class="profile">
                        <span
                            class="profile-avatar"
                        >
                            ${esc(
                                userName(user)
                                    .slice(0, 2)
                                    .toUpperCase()
                            )}
                        </span>

                        <div>
                            <strong>
                                ${esc(
                                    userName(user)
                                        .split(/\s+/)[0]
                                )}
                            </strong>

                            <small>
                                ${esc(
                                    roleLabel(
                                        user?.role
                                    )
                                )}
                            </small>
                        </div>
                    </div>
                </header>

                <main>
                    ${runtime.route === ROUTES.OVERVIEW
                        ? renderAbsenceDashboardEntry(
                            state
                        )
                        : ""
                    }

                    ${page}
                </main>

                ${renderNavigation(
                    "bottom-nav"
                )}
            </div>
        </div>
    `;
}

function getMaterialFormElements() {
    const form =
        document.getElementById(
            "material-order-form"
        );

    if (!form) {
        return null;
    }

    const objectInput =
        document.getElementById(
            "material-object"
        );

    const materialInput =
        document.getElementById(
            "material-select"
        );

    const unitInput =
        document.getElementById(
            "material-unit"
        );

    const quantityInput =
        document.getElementById(
            "material-quantity"
        );

    const submitButton =
        document.getElementById(
            "material-submit"
        );

    const message =
        document.getElementById(
            "material-order-message"
        );

    if (
        !objectInput ||
        !materialInput ||
        !unitInput ||
        !quantityInput ||
        !submitButton ||
        !message
    ) {
        throw new Error(
            "Das Materialformular ist unvollständig."
        );
    }

    return {
        form,
        objectInput,
        materialInput,
        unitInput,
        quantityInput,
        submitButton,
        message
    };
}


function updateMaterialFormState() {
    const elements =
        getMaterialFormElements();

    if (!elements) {
        return;
    }

    const quantity =
        Number.parseInt(
            elements.quantityInput.value,
            10
        );

    elements.submitButton.disabled = !(
        elements.objectInput.value &&
        elements.materialInput.value &&
        elements.unitInput.value &&
        Number.isInteger(quantity) &&
        quantity > 0
    );
}

function selectMaterialButton(
    selector,
    selectedValue,
    attributeName
) {
    document
        .querySelectorAll(selector)
        .forEach((button) => {
            const selected =
                button.getAttribute(
                    attributeName
                ) === selectedValue;

            button.classList.toggle(
                "selected",
                selected
            );

            button.setAttribute(
                "aria-pressed",
                selected
                    ? "true"
                    : "false"
            );
        });
}

function clearQuantitySelection() {
    const quantityInput =
        document.getElementById(
            "material-quantity"
        );

    const quantityDisplay =
        document.getElementById(
            "material-quantity-display"
        );

    if (
        !quantityInput ||
        !quantityDisplay
    ) {
        throw new Error(
            "Die Mengeneingabe wurde nicht vollständig gefunden."
        );
    }

    quantityInput.value = "";
    quantityDisplay.textContent = "Tippen";
    runtime.materialDraft.quantity = "";
}

async function handleSubmit(event) {
    if (
        event.target?.id ===
        "login-form"
    ) {
        event.preventDefault();

        const data =
            new FormData(
                event.target
            );

        try {
            await runtime.onLogin?.({
                identifier:
                    data.get(
                        "identifier"
                    ),

                password:
                    data.get(
                        "password"
                    )
            });
        }
        catch (error) {
            const message =
                document.getElementById(
                    "login-message"
                );

            if (message) {
                message.textContent =
                    error instanceof Error
                        ? error.message
                        : String(error);
            }
        }

        return;
    }

    if (
        event.target?.id ===
        "material-order-form"
    ) {
        event.preventDefault();

        const data =
            new FormData(
                event.target
            );

        const selectedMaterial =
            activeMaterials(
                runtime.state
            ).find(
                (material) =>
                    materialId(material) ===
                    txt(
                        data.get(
                            "materialId"
                        )
                    )
            );

        const selectedObject =
            assignedObjects(
                runtime.state
            ).find(
                (object) =>
                    objectId(object) ===
                    txt(
                        data.get(
                            "objectId"
                        )
                    )
            );

        const quantity =
            Number.parseInt(
                txt(
                    data.get(
                        "quantity"
                    )
                ),
                10
            );

        const elements =
            getMaterialFormElements();

        if (!elements) {
            throw new Error(
                "Das Materialformular wurde nicht gefunden."
            );
        }

        if (
            !selectedMaterial ||
            !selectedObject ||
            !Number.isInteger(
                quantity
            ) ||
            quantity <= 0
        ) {
            elements.message.textContent =
                "Bitte wähle Objekt, Material und Anzahl vollständig aus.";

            return;
        }

        const timestamp =
            new Date()
                .toISOString();

        const order = {
            id:
                createId(
                    "MATERIAL"
                ),

            type:
                "MATERIAL_ORDER",

            status:
                "OFFEN",

            employeeId:
                runtime.state
                    ?.currentUser
                    ?.id ??
                runtime.state
                    ?.currentUser
                    ?.userId,

            employeeName:
                userName(
                    runtime.state
                        ?.currentUser
                ),

            objectId:
                objectId(
                    selectedObject
                ),

            objectName:
                objectName(
                    selectedObject
                ),

            materialId:
                materialId(
                    selectedMaterial
                ),

            materialName:
                materialName(
                    selectedMaterial
                ),

            unit:
                txt(
                    data.get(
                        "unit"
                    ) ??
                    selectedMaterial
                        ?.unit
                ),

            quantity,

            createdAt:
                timestamp,

            updatedAt:
                timestamp,

            source:
                "LOCAL_TEST"
        };

        addCollectionEntry(
            "workOrders",
            order,
            {
                notify:
                    false,

                persist:
                    true
            }
        );

        runtime.materialDraft = {
            objectId:
                order.objectId,

            materialId:
                "",

            unit:
                "",

            quantity:
                ""
        };

        runtime.materialConfirmation =
            order;

        renderApp(runtime);
        return;
    }
}

async function handleClick(event) {
    const eventElement =
        event.target instanceof Element
            ? event.target
            : null;

    if (!eventElement) {
        return;
    }

    const communicationTabButton =
        eventElement.closest(
            "[data-communication-tab]"
        );

    if (communicationTabButton) {
        event.preventDefault();

        runtime.communicationTab =
            txt(
                communicationTabButton.getAttribute(
                    "data-communication-tab"
                )
            ).toUpperCase();

        runtime.communicationNotice =
            null;

        runtime.communicationExpandedTicketId =
            "";

        renderApp(runtime);
        return;
    }

    const communicationObjectButton =
        eventElement.closest(
            "[data-communication-object-id]"
        );

    if (communicationObjectButton) {
        event.preventDefault();

        runtime.communicationDraft.objectId =
            txt(
                communicationObjectButton.getAttribute(
                    "data-communication-object-id"
                )
            );

        runtime.communicationDraft.roomId =
            "";

        runtime.communicationNotice =
            null;

        renderApp(runtime);
        return;
    }

    const communicationRoomButton =
        eventElement.closest(
            "[data-communication-room-id]"
        );

    if (communicationRoomButton) {
        event.preventDefault();

        runtime.communicationDraft.roomId =
            txt(
                communicationRoomButton.getAttribute(
                    "data-communication-room-id"
                )
            );

        renderApp(runtime);
        return;
    }

    const communicationTypeButton =
        eventElement.closest(
            "[data-communication-type]"
        );

    if (communicationTypeButton) {
        event.preventDefault();

        runtime.communicationDraft.type =
            txt(
                communicationTypeButton.getAttribute(
                    "data-communication-type"
                )
            ).toUpperCase();

        runtime.communicationDraft.quickText =
            "";

        renderApp(runtime);
        return;
    }

    const communicationPriorityButton =
        eventElement.closest(
            "[data-communication-priority]"
        );

    if (communicationPriorityButton) {
        event.preventDefault();

        runtime.communicationDraft.priority =
            txt(
                communicationPriorityButton.getAttribute(
                    "data-communication-priority"
                )
            ).toUpperCase();

        renderApp(runtime);
        return;
    }

    const communicationQuickButton =
        eventElement.closest(
            "[data-communication-quick]"
        );

    if (communicationQuickButton) {
        event.preventDefault();

        runtime.communicationDraft.quickText =
            txt(
                communicationQuickButton.getAttribute(
                    "data-communication-quick"
                )
            );

        renderApp(runtime);
        return;
    }

    const communicationCreateButton =
        eventElement.closest(
            "[data-communication-create]"
        );

    if (communicationCreateButton) {
        event.preventDefault();

        try {
            createCommunicationEntry(
                runtime.state
            );
        }
        catch (error) {
            const message =
                document.getElementById(
                    "communication-form-message"
                );

            if (message) {
                message.textContent =
                    error instanceof Error
                        ? error.message
                        : String(error);
            }
            else {
                window.alert(
                    error instanceof Error
                        ? error.message
                        : String(error)
                );
            }
        }

        return;
    }

    const communicationConfirmationButton =
        eventElement.closest(
            "[data-communication-confirmation-action]"
        );

    if (communicationConfirmationButton) {
        event.preventDefault();

        const action =
            txt(
                communicationConfirmationButton.getAttribute(
                    "data-communication-confirmation-action"
                )
            );

        runtime.communicationConfirmation =
            null;

        runtime.communicationNotice =
            null;

        runtime.communicationDraft.customText =
            "";

        if (action === "overview") {
            runtime.communicationTab =
                "TICKETS";
        }
        else if (action === "new") {
            runtime.communicationTab =
                "NEW";
            runtime.communicationDraft.quickText =
                "";
        }
        else {
            throw new Error(
                "Unbekannte Bestätigungsaktion."
            );
        }

        renderApp(runtime);
        return;
    }

    const communicationMessageReadButton =
        eventElement.closest(
            "[data-communication-message-read-id]"
        );

    if (communicationMessageReadButton) {
        event.preventDefault();

        markCommunicationMessageRead(
            runtime.state,
            communicationMessageReadButton.getAttribute(
                "data-communication-message-read-id"
            )
        );

        renderApp(runtime);
        return;
    }

    const communicationNotificationReadButton =
        eventElement.closest(
            "[data-communication-notification-read-id]"
        );

    if (communicationNotificationReadButton) {
        event.preventDefault();

        markCommunicationNotificationRead(
            runtime.state,
            communicationNotificationReadButton.getAttribute(
                "data-communication-notification-read-id"
            )
        );

        renderApp(runtime);
        return;
    }

    const communicationMarkAllButton =
        eventElement.closest(
            "[data-communication-mark-all-read]"
        );

    if (communicationMarkAllButton) {
        event.preventDefault();

        markAllCommunicationRead(
            runtime.state
        );
        return;
    }

    const communicationTicketToggleButton =
        eventElement.closest(
            "[data-communication-ticket-toggle-id]"
        );

    if (communicationTicketToggleButton) {
        event.preventDefault();

        const ticketId =
            txt(
                communicationTicketToggleButton.getAttribute(
                    "data-communication-ticket-toggle-id"
                )
            );

        runtime.communicationExpandedTicketId =
            runtime.communicationExpandedTicketId ===
                ticketId
                ? ""
                : ticketId;

        runtime.communicationReplyDraft = {
            ticketId,
            preset:
                "",
            customText:
                ""
        };

        renderApp(runtime);
        return;
    }

    const communicationTicketActionButton =
        eventElement.closest(
            "[data-communication-ticket-action]"
        );

    if (communicationTicketActionButton) {
        event.preventDefault();

        try {
            updateCommunicationTicketStatus(
                runtime.state,
                communicationTicketActionButton.getAttribute(
                    "data-communication-ticket-id"
                ),
                communicationTicketActionButton.getAttribute(
                    "data-communication-ticket-action"
                )
            );
        }
        catch (error) {
            runtime.communicationNotice = {
                tone:
                    "warning",
                text:
                    error instanceof Error
                        ? error.message
                        : String(error)
            };

            renderApp(runtime);
        }

        return;
    }

    const communicationRequestActionButton =
        eventElement.closest(
            "[data-communication-request-action]"
        );

    if (communicationRequestActionButton) {
        event.preventDefault();

        try {
            updateCommunicationCustomerRequestStatus(
                runtime.state,
                communicationRequestActionButton.getAttribute(
                    "data-communication-request-id"
                ),
                communicationRequestActionButton.getAttribute(
                    "data-communication-request-action"
                )
            );
        }
        catch (error) {
            runtime.communicationNotice = {
                tone:
                    "warning",
                text:
                    error instanceof Error
                        ? error.message
                        : String(error)
            };

            renderApp(runtime);
        }

        return;
    }

    const communicationReplyPresetButton =
        eventElement.closest(
            "[data-communication-reply-preset]"
        );

    if (communicationReplyPresetButton) {
        event.preventDefault();

        runtime.communicationReplyDraft.ticketId =
            txt(
                communicationReplyPresetButton.getAttribute(
                    "data-communication-reply-ticket-id"
                )
            );

        runtime.communicationReplyDraft.preset =
            txt(
                communicationReplyPresetButton.getAttribute(
                    "data-communication-reply-preset"
                )
            );

        renderApp(runtime);
        return;
    }

    const communicationReplySubmitButton =
        eventElement.closest(
            "[data-communication-reply-submit-id]"
        );

    if (communicationReplySubmitButton) {
        event.preventDefault();

        try {
            sendCommunicationTicketReply(
                runtime.state,
                communicationReplySubmitButton.getAttribute(
                    "data-communication-reply-submit-id"
                )
            );
        }
        catch (error) {
            runtime.communicationNotice = {
                tone:
                    "warning",
                text:
                    error instanceof Error
                        ? error.message
                        : String(error)
            };

            renderApp(runtime);
        }

        return;
    }

    const taskObjectButton =
        eventElement.closest(
            "[data-task-object-id]"
        );

    if (taskObjectButton) {
        event.preventDefault();

        runtime.taskObjectId =
            txt(
                taskObjectButton.getAttribute(
                    "data-task-object-id"
                )
            );

        runtime.taskRoomId = "";
        runtime.taskExpandedId = "";
        runtime.taskNotice = null;

        renderApp(runtime);
        return;
    }

    const taskRoomButton =
        eventElement.closest(
            "[data-task-room-id]"
        );

    if (taskRoomButton) {
        event.preventDefault();

        runtime.taskRoomId =
            txt(
                taskRoomButton.getAttribute(
                    "data-task-room-id"
                )
            );

        runtime.taskExpandedId = "";
        runtime.taskNotice = null;

        renderApp(runtime);
        return;
    }

    const taskToggleButton =
        eventElement.closest(
            "[data-task-toggle-id]"
        );

    if (taskToggleButton) {
        event.preventDefault();

        const taskId =
            txt(
                taskToggleButton.getAttribute(
                    "data-task-toggle-id"
                )
            );

        runtime.taskExpandedId =
            runtime.taskExpandedId ===
                taskId
                ? ""
                : taskId;

        renderApp(runtime);
        return;
    }

    const taskCompleteButton =
        eventElement.closest(
            "[data-task-complete-id]"
        );

    if (taskCompleteButton) {
        event.preventDefault();

        try {
            completeTask(
                runtime.state,
                taskCompleteButton.getAttribute(
                    "data-task-complete-id"
                )
            );
        }
        catch (error) {
            runtime.taskNotice = {
                tone:
                    "warning",

                text:
                    error instanceof Error
                        ? error.message
                        : String(error)
            };

            renderApp(runtime);
        }

        return;
    }

    const taskUndoButton =
        eventElement.closest(
            "[data-task-undo-log-id]"
        );

    if (taskUndoButton) {
        event.preventDefault();

        try {
            undoTaskCompletion(
                runtime.state,
                taskUndoButton.getAttribute(
                    "data-task-undo-log-id"
                )
            );
        }
        catch (error) {
            runtime.taskNotice = {
                tone:
                    "warning",

                text:
                    error instanceof Error
                        ? error.message
                        : String(error)
            };

            renderApp(runtime);
        }

        return;
    }

    const absenceOpenModeButton =
        eventElement.closest(
            "[data-absence-open-mode]"
        );

    if (absenceOpenModeButton) {
        event.preventDefault();

        const mode =
            txt(
                absenceOpenModeButton.getAttribute(
                    "data-absence-open-mode"
                )
            ).toUpperCase();

        if (
            ![
                "VACATION_REQUEST",
                "SICK_REPORT"
            ].includes(mode)
        ) {
            throw new Error(
                "Ungültige Abwesenheitsart."
            );
        }

        runtime.absenceDraft.type =
            mode;

        runtime.absenceDraft.startOffset =
            mode ===
            "SICK_REPORT"
                ? 0
                : 1;

        runtime.absenceDraft.durationDays =
            1;

        runtime.absenceDraft.certificateStatus =
            "UNKNOWN";

        runtime.moreSection =
            "ABSENCE";

        runtime.absenceConfirmation =
            null;

        runtime.absenceNotice =
            null;

        runtime.replacementSearchRequestId =
            "";

        if (
            runtime.route ===
            ROUTES.MORE
        ) {
            renderApp(runtime);
        }
        else {
            runtime.onNavigate?.(
                ROUTES.MORE
            );
        }

        return;
    }

    const moreSectionButton =
        eventElement.closest(
            "[data-more-section]"
        );

    if (moreSectionButton) {
        event.preventDefault();

        runtime.moreSection =
            txt(
                moreSectionButton.getAttribute(
                    "data-more-section"
                )
            );

        runtime.absenceConfirmation =
            null;

        runtime.absenceNotice =
            null;

        runtime.replacementSearchRequestId =
            "";

        if (
            runtime.route ===
            ROUTES.MORE
        ) {
            renderApp(runtime);
        }
        else {
            runtime.onNavigate?.(
                ROUTES.MORE
            );
        }

        return;
    }

    const moreSectionBackButton =
        eventElement.closest(
            "[data-more-section-back]"
        );

    if (moreSectionBackButton) {
        event.preventDefault();

        runtime.moreSection = "";

        runtime.absenceConfirmation =
            null;

        runtime.absenceNotice =
            null;

        runtime.replacementSearchRequestId =
            "";

        renderApp(runtime);
        return;
    }

    const absenceConfirmationButton =
        eventElement.closest(
            "[data-absence-confirmation-action]"
        );

    if (absenceConfirmationButton) {
        event.preventDefault();

        const action =
            txt(
                absenceConfirmationButton.getAttribute(
                    "data-absence-confirmation-action"
                )
            );

        const confirmedRequest =
            runtime.absenceConfirmation;

        if (action === "new") {
            runtime.absenceConfirmation =
                null;

            runtime.absenceNotice =
                null;

            runtime.absenceDraft = {
                type:
                    txt(
                        confirmedRequest?.type
                    ) ||
                    "VACATION_REQUEST",

                objectId:
                    txt(
                        confirmedRequest?.objectId
                    ),

                startOffset:
                    txt(
                        confirmedRequest?.type
                    ).toUpperCase() ===
                    "SICK_REPORT"
                        ? 0
                        : 1,

                durationDays:
                    1,

                certificateStatus:
                    "UNKNOWN"
            };

            renderApp(runtime);
            return;
        }

        if (action === "overview") {
            runtime.absenceConfirmation =
                null;

            renderApp(runtime);
            return;
        }

        throw new Error(
            "Unbekannte Bestätigungsaktion."
        );
    }

    const absenceModeButton =
        eventElement.closest(
            "[data-absence-mode]"
        );

    if (absenceModeButton) {
        event.preventDefault();

        const mode =
            txt(
                absenceModeButton.getAttribute(
                    "data-absence-mode"
                )
            ).toUpperCase();

        if (
            ![
                "VACATION_REQUEST",
                "SICK_REPORT"
            ].includes(mode)
        ) {
            throw new Error(
                "Ungültige Abwesenheitsart."
            );
        }

        runtime.absenceDraft.type =
            mode;

        runtime.absenceDraft.startOffset =
            mode ===
            "SICK_REPORT"
                ? 0
                : 1;

        runtime.absenceDraft.durationDays =
            1;

        runtime.absenceDraft.certificateStatus =
            "UNKNOWN";

        runtime.absenceNotice =
            null;

        renderApp(runtime);
        return;
    }

    const absenceObjectButton =
        eventElement.closest(
            "[data-absence-object-id]"
        );

    if (absenceObjectButton) {
        event.preventDefault();

        runtime.absenceDraft.objectId =
            txt(
                absenceObjectButton.getAttribute(
                    "data-absence-object-id"
                )
            );

        renderApp(runtime);
        return;
    }

    const absenceStartButton =
        eventElement.closest(
            "[data-absence-start-offset]"
        );

    if (absenceStartButton) {
        event.preventDefault();

        runtime.absenceDraft.startOffset =
            Number(
                absenceStartButton.getAttribute(
                    "data-absence-start-offset"
                )
            );

        renderApp(runtime);
        return;
    }

    const absenceStartShiftButton =
        eventElement.closest(
            "[data-absence-start-shift]"
        );

    if (absenceStartShiftButton) {
        event.preventDefault();

        const shift =
            Number(
                absenceStartShiftButton.getAttribute(
                    "data-absence-start-shift"
                )
            );

        const isSick =
            runtime
                .absenceDraft
                .type ===
                "SICK_REPORT";

        const minimum =
            isSick
                ? -7
                : 1;

        const maximum =
            isSick
                ? 0
                : 365;

        runtime.absenceDraft.startOffset =
            Math.max(
                minimum,
                Math.min(
                    maximum,
                    Number(
                        runtime
                            .absenceDraft
                            .startOffset
                    ) + shift
                )
            );

        renderApp(runtime);
        return;
    }

    const absenceDurationButton =
        eventElement.closest(
            "[data-absence-duration]"
        );

    if (absenceDurationButton) {
        event.preventDefault();

        runtime.absenceDraft.durationDays =
            Number(
                absenceDurationButton.getAttribute(
                    "data-absence-duration"
                )
            );

        renderApp(runtime);
        return;
    }

    const absenceDurationShiftButton =
        eventElement.closest(
            "[data-absence-duration-shift]"
        );

    if (absenceDurationShiftButton) {
        event.preventDefault();

        const shift =
            Number(
                absenceDurationShiftButton.getAttribute(
                    "data-absence-duration-shift"
                )
            );

        runtime.absenceDraft.durationDays =
            Math.max(
                1,
                Math.min(
                    30,
                    Number(
                        runtime
                            .absenceDraft
                            .durationDays
                    ) + shift
                )
            );

        renderApp(runtime);
        return;
    }

    const absenceCertificateButton =
        eventElement.closest(
            "[data-absence-certificate]"
        );

    if (absenceCertificateButton) {
        event.preventDefault();

        runtime.absenceDraft.certificateStatus =
            txt(
                absenceCertificateButton.getAttribute(
                    "data-absence-certificate"
                )
            ).toUpperCase();

        renderApp(runtime);
        return;
    }

    const absenceSubmitButton =
        eventElement.closest(
            "[data-absence-submit]"
        );

    if (absenceSubmitButton) {
        event.preventDefault();

        try {
            createAbsenceRequest(
                runtime.state
            );
        }
        catch (error) {
            const message =
                document.getElementById(
                    "absence-form-message"
                );

            if (message) {
                message.textContent =
                    error instanceof Error
                        ? error.message
                        : String(error);
            }
            else {
                window.alert(
                    error instanceof Error
                        ? error.message
                        : String(error)
                );
            }
        }

        return;
    }

    const absenceManagerButton =
        eventElement.closest(
            "[data-absence-manager-action]"
        );

    if (absenceManagerButton) {
        event.preventDefault();

        try {
            handleAbsenceManagerAction(
                runtime.state,
                absenceManagerButton.getAttribute(
                    "data-absence-request-id"
                ),
                absenceManagerButton.getAttribute(
                    "data-absence-manager-action"
                )
            );
        }
        catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
        }

        return;
    }

    const replacementButton =
        eventElement.closest(
            "[data-replacement-request-id]"
        );

    if (replacementButton) {
        event.preventDefault();

        try {
            assignReplacement(
                runtime.state,
                replacementButton.getAttribute(
                    "data-replacement-request-id"
                ),
                replacementButton.getAttribute(
                    "data-replacement-candidate-id"
                )
            );
        }
        catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
        }

        return;
    }

    const confirmationActionButton =
        eventElement.closest(
            "[data-material-confirmation-action]"
        );

    if (confirmationActionButton) {
        event.preventDefault();

        const action =
            txt(
                confirmationActionButton.getAttribute(
                    "data-material-confirmation-action"
                )
            );

        const confirmedOrder =
            runtime.materialConfirmation;

        if (action === "new-order") {
            runtime.materialDraft = {
                objectId:
                    txt(
                        confirmedOrder?.objectId
                    ),

                materialId:
                    "",

                unit:
                    "",

                quantity:
                    ""
            };

            runtime.materialConfirmation =
                null;

            renderApp(runtime);
            return;
        }

        if (action === "overview") {
            runtime.materialConfirmation =
                null;

            runtime.materialDraft = {
                objectId:
                    "",

                materialId:
                    "",

                unit:
                    "",

                quantity:
                    ""
            };

            runtime.onNavigate?.(
                ROUTES.OVERVIEW
            );

            return;
        }

        throw new Error(
            "Unbekannte Bestätigungsaktion."
        );
    }

    const quantityKeyButton =
        eventElement.closest(
            "[data-material-quantity-key]"
        );

    if (quantityKeyButton) {
        event.preventDefault();

        const elements =
            getMaterialFormElements();

        if (!elements) {
            throw new Error(
                "Das Materialformular wurde nicht gefunden."
            );
        }

        if (!elements.materialInput.value) {
            elements.message.textContent =
                "Bitte wähle zuerst ein Material aus.";

            return;
        }

        const key =
            txt(
                quantityKeyButton.getAttribute(
                    "data-material-quantity-key"
                )
            );

        let nextValue =
            txt(
                elements.quantityInput.value
            );

        if (key === "clear") {
            nextValue = "";
        }
        else if (key === "backspace") {
            nextValue =
                nextValue.slice(0, -1);
        }
        else if (
            /^[0-9]$/.test(key)
        ) {
            if (nextValue.length >= 3) {
                elements.message.textContent =
                    "Die Anzahl darf höchstens 999 betragen.";

                return;
            }

            nextValue =
                `${nextValue}${key}`
                    .replace(/^0+(?=\d)/, "")
                    .slice(0, 3);
        }
        else {
            throw new Error(
                "Ungültige Mengentaste."
            );
        }

        const quantityDisplay =
            document.getElementById(
                "material-quantity-display"
            );

        if (!quantityDisplay) {
            throw new Error(
                "Die Mengenanzeige wurde nicht gefunden."
            );
        }

        elements.quantityInput.value =
            nextValue;

        runtime.materialDraft.quantity =
            nextValue;

        quantityDisplay.textContent =
            nextValue ||
            "Noch keine Anzahl";

        quantityDisplay.classList.toggle(
            "empty",
            !nextValue
        );

        elements.message.textContent = "";

        updateMaterialFormState();
        return;
    }

    const materialObjectButton =
        eventElement.closest(
            "[data-material-object-id]"
        );

    if (materialObjectButton) {
        event.preventDefault();

        const selectedId =
            txt(
                materialObjectButton
                    .getAttribute(
                        "data-material-object-id"
                    )
            );

        try {
            const selectedObject =
                await runtime
                    .onSelectObject?.(
                        selectedId
                    );

            runtime.state.currentObject =
                selectedObject ??
                assignedObjects(
                    runtime.state
                ).find(
                    (object) =>
                        objectId(object) ===
                        selectedId
                ) ??
                null;

            runtime.materialDraft = {
                objectId:
                    selectedId,

                materialId:
                    "",

                unit:
                    "",

                quantity:
                    ""
            };

            runtime.materialConfirmation =
                null;

            renderApp(runtime);
        }
        catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
        }

        return;
    }

    const materialButton =
        eventElement.closest(
            "[data-material-id]"
        );

    if (materialButton) {
        event.preventDefault();

        const selectedId =
            txt(
                materialButton
                    .getAttribute(
                        "data-material-id"
                    )
            );

        const unit =
            txt(
                materialButton
                    .getAttribute(
                        "data-material-unit"
                    )
            );

        runtime
            .materialDraft
            .materialId =
            selectedId;

        runtime
            .materialDraft
            .unit =
            unit;

        const materialInput =
            document.getElementById(
                "material-select"
            );

        const unitInput =
            document.getElementById(
                "material-unit"
            );

        const unitDisplay =
            document.getElementById(
                "material-unit-display"
            );

        if (
            !materialInput ||
            !unitInput ||
            !unitDisplay
        ) {
            throw new Error(
                "Die Materialauswahl konnte nicht vollständig aktualisiert werden."
            );
        }

        materialInput.value =
            selectedId;

        unitInput.value =
            unit;

        unitDisplay.value =
            unit;

        clearQuantitySelection();

        selectMaterialButton(
            "[data-material-id]",
            selectedId,
            "data-material-id"
        );

        updateMaterialFormState();
        return;
    }

    const sectionButton =
        eventElement.closest(
            "[data-object-section]"
        );

    if (sectionButton) {
        runtime.objectSection =
            txt(
                sectionButton.getAttribute(
                    "data-object-section"
                )
            );

        renderApp(runtime);
        return;
    }

    const sectionBackButton =
        eventElement.closest(
            "[data-object-section-back]"
        );

    if (sectionBackButton) {
        runtime.objectSection = "";

        renderApp(runtime);
        return;
    }

    const routeButton =
        eventElement.closest(
            "[data-route]"
        );

    if (routeButton) {
        runtime.objectSection = "";

        const nextRoute =
            routeButton.getAttribute(
                "data-route"
            );

        if (
            nextRoute !==
            ROUTES.TASKS
        ) {
            runtime.taskExpandedId = "";
            runtime.taskNotice = null;
        }

        if (
            nextRoute !==
            ROUTES.COMMUNICATION
        ) {
            runtime.communicationExpandedTicketId = "";
            runtime.communicationNotice = null;
            runtime.communicationConfirmation = null;
            runtime.communicationReplyDraft = {
                ticketId: "",
                preset: "",
                customText: ""
            };
        }

        if (
            nextRoute !==
            ROUTES.MORE
        ) {
            runtime.moreSection = "";

            runtime.absenceConfirmation =
                null;

            runtime.absenceNotice =
                null;

            runtime.replacementSearchRequestId =
                "";
        }

        runtime.onNavigate?.(
            nextRoute
        );

        return;
    }

    const objectButton =
        eventElement.closest(
            "[data-object-id]"
        );

    if (objectButton) {
        try {
            await runtime
                .onSelectObject?.(
                    objectButton
                        .getAttribute(
                            "data-object-id"
                        )
                );

            runtime.objectSection = "";

            runtime.onNavigate?.(
                ROUTES.OBJECT_DETAIL
            );
        }
        catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
        }

        return;
    }

    const action =
        eventElement
            .closest(
                "[data-action]"
            )
            ?.getAttribute(
                "data-action"
            );

    try {
        if (
            action ===
            "logout"
        ) {
            runtime.objectSection = "";
            runtime.moreSection = "";
            runtime.absenceConfirmation = null;
            runtime.absenceNotice = null;
            runtime.replacementSearchRequestId = "";
            runtime.taskObjectId = "";
            runtime.taskRoomId = "";
            runtime.taskExpandedId = "";
            runtime.taskNotice = null;
            runtime.communicationTab = "INBOX";
            runtime.communicationExpandedTicketId = "";
            runtime.communicationNotice = null;
            runtime.communicationConfirmation = null;
            runtime.communicationDraft = {
                objectId: "",
                roomId: "",
                type: "",
                priority: "MEDIUM",
                quickText: "",
                customText: ""
            };
            runtime.communicationReplyDraft = {
                ticketId: "",
                preset: "",
                customText: ""
            };

            await runtime
                .onLogout?.();
        }

        if (
            action ===
            "checkin"
        ) {
            await runtime
                .onCheckin?.();
        }

        if (
            action ===
            "checkout"
        ) {
            await runtime
                .onCheckout?.();
        }
    }
    catch (error) {
        window.alert(
            error instanceof Error
                ? error.message
                : String(error)
        );
    }
}


function handleInput(event) {
    const target =
        event.target;

    if (
        !(target instanceof HTMLTextAreaElement)
    ) {
        return;
    }

    if (
        target.id ===
        "communication-details"
    ) {
        runtime.communicationDraft.customText =
            String(
                target.value ??
                ""
            ).slice(
                0,
                600
            );

        return;
    }

    if (
        target.id ===
        "communication-reply-text"
    ) {
        runtime.communicationReplyDraft.customText =
            String(
                target.value ??
                ""
            ).slice(
                0,
                600
            );
    }
}

function bindEvents() {
    const app = root();

    if (!app) {
        throw new Error(
            'Das Element "#app" wurde nicht gefunden.'
        );
    }

    if (eventsBound) {
        return;
    }

    app.addEventListener(
        "submit",
        handleSubmit
    );

    app.addEventListener(
        "click",
        handleClick
    );

    app.addEventListener(
        "input",
        handleInput
    );

    eventsBound = true;
}

export function renderApp(
    options = {}
) {
    const app = root();

    if (!app) {
        throw new Error(
            'Das Element "#app" wurde nicht gefunden.'
        );
    }

    runtime.route =
        txt(options.route) ||
        runtime.route ||
        ROUTES.LOGIN;

    runtime.state =
        options.state &&
        typeof options.state ===
        "object"
            ? options.state
            : runtime.state;

    if (
        typeof options.objectSection ===
        "string"
    ) {
        runtime.objectSection =
            options.objectSection;
    }

    for (
        const key of [
            "onNavigate",
            "onLogin",
            "onLogout",
            "onCheckin",
            "onCheckout",
            "onSelectObject"
        ]
    ) {
        if (
            typeof options[key] ===
            "function"
        ) {
            runtime[key] =
                options[key];
        }
    }

    app.innerHTML =
        runtime.route ===
        ROUTES.LOGIN ||
        !runtime.state
            ?.currentUser
            ? renderLogin(
                runtime.state
            )
            : renderShell(
                runtime.state
            );

    bindEvents();
    syncLiveTimer();
    updateMaterialFormState();
}
