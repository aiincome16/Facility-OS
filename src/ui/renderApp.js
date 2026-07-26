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

        renderApp(runtime);
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
