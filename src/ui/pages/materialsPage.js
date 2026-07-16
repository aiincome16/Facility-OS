/************************************************
 * Facility OS
 * materialsPage.js
 *
 * Visuelle Materialverwaltung
 * - Bestände
 * - Mindestbestand
 * - kritische Materialien
 * - Nachbestellung
 * - Materialschränke
 * - objektbezogene Darstellung
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
    renderInfoList,
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
 * ROLLE UND ZUGRIFF
 ************************************************/

function getRole(state) {

    return normalizeStatus(
        state.currentUser?.role
    );
}

function canManageMaterials(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER
    ].includes(
        getRole(state)
    );
}

function canViewMaterials(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER
    ].includes(
        getRole(state)
    );
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
 * SICHTBARE OBJEKTE
 ************************************************/

function getVisibleObjects(state) {

    const user =
        state.currentUser;

    const objects =
        asArray(state.objects)
            .filter(isActive);

    if (!user) {

        return [];
    }

    const role =
        getRole(state);

    if (
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
        ].includes(role)
    ) {

        return objects;
    }

    if (
        role ===
        USER_ROLES.OBJEKTLEITER
    ) {

        const assignedObjects =
            objects.filter(
                (object) =>
                    object.objectLeaderId ===
                        user.id ||
                    object.managerId ===
                        user.id ||
                    object.leaderId ===
                        user.id
            );

        return assignedObjects.length > 0
            ? assignedObjects
            : objects;
    }

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        const assignedObjectIds =
            asArray(
                user.assignedObjectIds ??
                user.objectIds
            );

        const assignedObjects =
            objects.filter(
                (object) =>
                    assignedObjectIds.includes(
                        object.id
                    ) ||
                    asArray(
                        object.assignedEmployeeIds ??
                        object.employeeIds ??
                        object.assignedUserIds
                    ).includes(
                        user.id
                    )
            );

        return assignedObjects.length > 0
            ? assignedObjects
            : objects;
    }

    return [];
}

/************************************************
 * MATERIALSTAMMDATEN
 ************************************************/

function getMaterials(state) {

    return asArray(state.materials)
        .filter(isActive);
}

function getMaterialById(
    state,
    materialId
) {

    if (!materialId) {

        return null;
    }

    return getMaterials(state)
        .find(
            (material) =>
                material.id === materialId
        ) ??
        null;
}

function getMaterialName(
    state,
    stock
) {

    const material =
        getMaterialById(
            state,
            stock.materialId
        );

    return (
        stock.materialName ??
        stock.name ??
        material?.name ??
        material?.title ??
        stock.materialId ??
        "Unbekanntes Material"
    );
}

function getMaterialUnit(
    state,
    stock
) {

    const material =
        getMaterialById(
            state,
            stock.materialId
        );

    return (
        stock.unit ??
        material?.unit ??
        material?.packagingUnit ??
        "Stück"
    );
}

/************************************************
 * BESTÄNDE
 ************************************************/

function getCurrentAmount(stock) {

    return asNumber(
        stock.currentAmount ??
        stock.quantity ??
        stock.stock ??
        stock.currentStock
    );
}

function getMinimumAmount(stock) {

    return asNumber(
        stock.minimumAmount ??
        stock.minimumStock ??
        stock.minStock ??
        stock.reorderLevel
    );
}

function getTargetAmount(stock) {

    return asNumber(
        stock.targetAmount ??
        stock.targetStock ??
        stock.maximumAmount ??
        stock.maxStock
    );
}

function getMaterialStock(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.materialStock)
        .filter(
            (stock) =>
                isActive(stock) &&
                (
                    !stock.objectId ||
                    visibleObjectIds.includes(
                        stock.objectId
                    )
                )
        );
}

/************************************************
 * BESTANDSSTATUS
 ************************************************/

function getStockStatus(stock) {

    const status =
        normalizeStatus(
            stock.status
        );

    const currentAmount =
        getCurrentAmount(stock);

    const minimumAmount =
        getMinimumAmount(stock);

    if (
        [
            "EMPTY",
            "OUT_OF_STOCK"
        ].includes(status) ||
        currentAmount <= 0
    ) {

        return {
            key:
                "critical",

            label:
                "Leer",

            color:
                "danger"
        };
    }

    if (
        [
            "CRITICAL",
            "LOW"
        ].includes(status) ||
        (
            minimumAmount > 0 &&
            currentAmount <=
                minimumAmount
        )
    ) {

        return {
            key:
                "warning",

            label:
                "Nachbestellen",

            color:
                "warning"
        };
    }

    if (
        [
            "ORDERED",
            "REORDERED"
        ].includes(status)
    ) {

        return {
            key:
                "ordered",

            label:
                "Bestellt",

            color:
                "info"
        };
    }

    return {
        key:
            "available",

        label:
            "Verfügbar",

        color:
            "success"
    };
}

function getCriticalStock(state) {

    return getMaterialStock(state)
        .filter(
            (stock) =>
                getStockStatus(
                    stock
                ).key ===
                "critical"
        );
}

function getLowStock(state) {

    return getMaterialStock(state)
        .filter(
            (stock) =>
                getStockStatus(
                    stock
                ).key ===
                "warning"
        );
}

function getOrderedStock(state) {

    return getMaterialStock(state)
        .filter(
            (stock) =>
                getStockStatus(
                    stock
                ).key ===
                "ordered"
        );
}

function getAvailableStock(state) {

    return getMaterialStock(state)
        .filter(
            (stock) =>
                getStockStatus(
                    stock
                ).key ===
                "available"
        );
}

/************************************************
 * NACHBESTELLMENGE
 ************************************************/

function calculateReorderAmount(stock) {

    const currentAmount =
        getCurrentAmount(stock);

    const minimumAmount =
        getMinimumAmount(stock);

    const targetAmount =
        getTargetAmount(stock);

    if (
        targetAmount > 0
    ) {

        return Math.max(
            targetAmount -
                currentAmount,
            0
        );
    }

    if (
        minimumAmount > 0
    ) {

        return Math.max(
            minimumAmount * 2 -
                currentAmount,
            1
        );
    }

    return 1;
}

/************************************************
 * MATERIALSCHRÄNKE
 ************************************************/

function getMaterialCabinets(state) {

    const cabinets = [];

    getVisibleObjects(state)
        .forEach(
            (object) => {

                const settings =
                    asArray(
                        state.objectSettings
                    ).find(
                        (entry) =>
                            entry.objectId ===
                            object.id
                    );

                const guide =
                    asArray(
                        state.objectGuide
                    ).find(
                        (entry) =>
                            entry.objectId ===
                            object.id
                    );

                const cabinet =
                    settings?.materialCabinet ??
                    settings?.materialStorage ??
                    guide?.materialCabinet ??
                    guide?.materialStorage ??
                    object.materialCabinet ??
                    object.materialStorage;

                if (cabinet) {

                    cabinets.push({
                        objectId:
                            object.id,

                        objectName:
                            object.name ??
                            object.id,

                        location:
                            typeof cabinet ===
                            "string"
                                ? cabinet
                                : (
                                    cabinet.location ??
                                    cabinet.description ??
                                    "Standort hinterlegt"
                                ),

                        secured:
                            typeof cabinet ===
                            "object"
                                ? (
                                    cabinet.secured ??
                                    cabinet.locked ??
                                    null
                                )
                                : null,

                        qrCode:
                            typeof cabinet ===
                            "object"
                                ? (
                                    cabinet.qrCode ??
                                    cabinet.qrId ??
                                    null
                                )
                                : null
                    });
                }
            }
        );

    return cabinets;
}

/************************************************
 * BESTANDSZEILE
 ************************************************/

function createStockRow(
    state,
    stock
) {

    const status =
        getStockStatus(
            stock
        );

    const currentAmount =
        getCurrentAmount(
            stock
        );

    const minimumAmount =
        getMinimumAmount(
            stock
        );

    const unit =
        getMaterialUnit(
            state,
            stock
        );

    const descriptionParts = [];

    if (
        stock.objectId
    ) {

        descriptionParts.push(
            getObjectName(
                state,
                stock.objectId
            )
        );
    }

    if (
        minimumAmount > 0
    ) {

        descriptionParts.push(
            `Minimum: ${minimumAmount} ${unit}`
        );
    }

    if (
        status.key ===
        "warning" ||
        status.key ===
        "critical"
    ) {

        descriptionParts.push(
            `Vorschlag: ${calculateReorderAmount(
                stock
            )} ${unit} bestellen`
        );
    }

    return {
        title:
            getMaterialName(
                state,
                stock
            ),

        description:
            descriptionParts.join(
                " · "
            ),

        icon:
            "materials",

        color:
            status.color,

        value:
            `${currentAmount} ${unit}`,

        status:
            status.label,

        action:
            "open-material-stock",

        className:
            `material-stock-row material-stock-${status.key}`
    };
}

/************************************************
 * MATERIALSTAMMDATEN-ZEILE
 ************************************************/

function createMaterialRow(material) {

    const descriptionParts = [];

    if (
        material.category
    ) {

        descriptionParts.push(
            material.category
        );
    }

    if (
        material.unit
    ) {

        descriptionParts.push(
            material.unit
        );
    }

    if (
        material.dosage
    ) {

        descriptionParts.push(
            `Dosierung: ${material.dosage}`
        );
    }

    return {
        title:
            material.name ??
            material.title ??
            material.id ??
            "Material",

        description:
            descriptionParts.join(
                " · "
            ) ||
            "Keine weiteren Angaben",

        icon:
            "materials",

        color:
            "materials",

        action:
            "open-material"
    };
}

/************************************************
 * MATERIALSCHRANK-ZEILE
 ************************************************/

function createCabinetRow(cabinet) {

    const descriptionParts = [
        cabinet.location
    ];

    if (
        cabinet.secured === true
    ) {

        descriptionParts.push(
            "gesichert"
        );
    }

    if (
        cabinet.qrCode
    ) {

        descriptionParts.push(
            "QR-Code vorhanden"
        );
    }

    return {
        title:
            cabinet.objectName,

        description:
            descriptionParts.join(
                " · "
            ),

        icon:
            "materials",

        color:
            "objects",

        status:
            cabinet.secured === false
                ? "Prüfen"
                : "Hinterlegt",

        action:
            "open-material-cabinet"
    };
}

/************************************************
 * STATUSKARTEN
 ************************************************/

function renderMaterialStatus(state) {

    const stock =
        getMaterialStock(state);

    const critical =
        getCriticalStock(state);

    const low =
        getLowStock(state);

    const ordered =
        getOrderedStock(state);

    return renderStatusGrid(
        [
            {
                title:
                    "Materialien",

                value:
                    stock.length,

                description:
                    "Bestände",

                status:
                    "materials",

                icon:
                    "materials"
            },
            {
                title:
                    "Kritisch",

                value:
                    critical.length,

                description:
                    "leer",

                status:
                    critical.length > 0
                        ? "danger"
                        : "success",

                icon:
                    "warning"
            },
            {
                title:
                    "Niedrig",

                value:
                    low.length,

                description:
                    "nachbestellen",

                status:
                    low.length > 0
                        ? "warning"
                        : "success",

                icon:
                    "materials"
            },
            {
                title:
                    "Bestellt",

                value:
                    ordered.length,

                description:
                    "unterwegs",

                status:
                    ordered.length > 0
                        ? "info"
                        : "neutral",

                icon:
                    "materials"
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
 * WARNUNGEN
 ************************************************/

function getMaterialAlerts(state) {

    const alerts = [];

    const critical =
        getCriticalStock(state);

    const low =
        getLowStock(state);

    const cabinets =
        getMaterialCabinets(state);

    if (
        critical.length > 0
    ) {

        alerts.push({
            title:
                "Material nicht verfügbar",

            message:
                `${critical.length} Materialien sind leer oder als kritisch markiert.`,

            status:
                "danger",

            icon:
                "warning",

            action:
                "open-critical-materials",

            buttonLabel:
                "Jetzt prüfen"
        });
    }

    if (
        low.length > 0
    ) {

        alerts.push({
            title:
                "Mindestbestand erreicht",

            message:
                `${low.length} Materialien sollten nachbestellt werden.`,

            status:
                "warning",

            icon:
                "materials",

            action:
                "open-low-materials",

            buttonLabel:
                "Nachbestellung"
        });
    }

    if (
        cabinets.length === 0
    ) {

        alerts.push({
            title:
                "Materialschrank nicht hinterlegt",

            message:
                "Für die sichtbaren Objekte wurde noch kein Materiallager eingetragen.",

            status:
                "info",

            icon:
                "materials",

            route:
                ROUTES.OBJECTS,

            buttonLabel:
                "Objekte prüfen"
        });
    }

    return alerts;
}

/************************************************
 * SCHNELLERFASSUNG
 ************************************************/

function getMaterialQuickActions(state) {

    const actions = [
        {
            title:
                "Materialmangel melden",

            subtitle:
                "Fehlendes Material dokumentieren",

            icon:
                "warning",

            color:
                "warning",

            action:
                "create-material-ticket"
        },
        {
            title:
                "Bestand aktualisieren",

            subtitle:
                "Menge direkt erfassen",

            icon:
                "materials",

            color:
                "materials",

            action:
                "update-material-stock"
        }
    ];

    if (
        canManageMaterials(state)
    ) {

        actions.push(
            {
                title:
                    "Nachbestellung",

                subtitle:
                    "Material bestellen oder vormerken",

                icon:
                    "materials",

                color:
                    "success",

                action:
                    "create-material-order"
            },
            {
                title:
                    "Material anlegen",

                subtitle:
                    "Neuen Artikel erfassen",

                icon:
                    "materials",

                color:
                    "more",

                action:
                    "create-material"
            }
        );
    }

    return actions;
}

/************************************************
 * LISTEN
 ************************************************/

function renderCriticalStockList(state) {

    const items = [
        ...getCriticalStock(state),
        ...getLowStock(state)
    ];

    if (
        items.length === 0
    ) {

        return renderEmptyState({
            title:
                "Alle Bestände ausreichend",

            description:
                "Aktuell liegt kein Material am oder unter dem Mindestbestand.",

            icon:
                "materials",

            color:
                "success",

            compact:
                true
        });
    }

    return renderActionRows(
        items.map(
            (stock) =>
                createStockRow(
                    state,
                    stock
                )
        )
    );
}

function renderAvailableStockList(state) {

    const items =
        getAvailableStock(state);

    if (
        items.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine verfügbaren Bestände",

            description:
                "Es wurden noch keine regulären Materialbestände erfasst.",

            icon:
                "materials",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        items.map(
            (stock) =>
                createStockRow(
                    state,
                    stock
                )
        )
    );
}

function renderOrderedStockList(state) {

    const items =
        getOrderedStock(state);

    if (
        items.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine offenen Bestellungen",

            description:
                "Aktuell sind keine Materialien als bestellt markiert.",

            icon:
                "materials",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        items.map(
            (stock) =>
                createStockRow(
                    state,
                    stock
                )
        )
    );
}

function renderMaterialMasterList(state) {

    const materials =
        getMaterials(state);

    if (
        materials.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Materialien angelegt",

            description:
                "Der Materialstamm enthält derzeit keine Einträge.",

            icon:
                "materials",

            color:
                "materials",

            actionLabel:
                canManageMaterials(state)
                    ? "Material anlegen"
                    : "",

            action:
                canManageMaterials(state)
                    ? "create-material"
                    : null,

            compact:
                true
        });
    }

    return renderActionRows(
        materials.map(
            createMaterialRow
        )
    );
}

function renderCabinetList(state) {

    const cabinets =
        getMaterialCabinets(state);

    if (
        cabinets.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Lagerorte hinterlegt",

            description:
                "Für die sichtbaren Objekte wurden noch keine Materialschränke gespeichert.",

            icon:
                "materials",

            color:
                "warning",

            actionLabel:
                "Objekte öffnen",

            actionRoute:
                ROUTES.OBJECTS,

            compact:
                true
        });
    }

    return renderActionRows(
        cabinets.map(
            createCabinetRow
        )
    );
}

/************************************************
 * OBJEKTÜBERSICHT
 ************************************************/

function renderObjectMaterialSummary(state) {

    const objects =
        getVisibleObjects(state);

    if (
        objects.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Objekte verfügbar",

            description:
                "Es können derzeit keine objektbezogenen Materialbestände angezeigt werden.",

            icon:
                "objects",

            color:
                "objects",

            compact:
                true
        });
    }

    const rows =
        objects.map(
            (object) => {

                const stocks =
                    getMaterialStock(state)
                        .filter(
                            (stock) =>
                                stock.objectId ===
                                object.id
                        );

                const warnings =
                    stocks.filter(
                        (stock) =>
                            [
                                "critical",
                                "warning"
                            ].includes(
                                getStockStatus(
                                    stock
                                ).key
                            )
                    );

                return {
                    label:
                        object.name ??
                        object.id,

                    value:
                        stocks.length === 0
                            ? "Keine Bestände"
                            : (
                                warnings.length > 0
                                    ? `${warnings.length} Warnung${
                                        warnings.length === 1
                                            ? ""
                                            : "en"
                                    }`
                                    : `${stocks.length} Bestände`
                            ),

                    status:
                        warnings.length > 0
                            ? "warning"
                            : "objects",

                    icon:
                        "objects",

                    emphasize:
                        warnings.length > 0
                };
            }
        );

    return renderInfoList(
        rows,
        {
            columns:
                1
        }
    );
}

/************************************************
 * ZUGRIFF VERWEIGERT
 ************************************************/

function renderAccessDenied() {

    return `
        <section class="app-materials-page">

            ${renderPageTitle({
                eyebrow:
                    "Material",

                title:
                    "Kein Zugriff",

                description:
                    "Dieser Bereich ist für deine Benutzerrolle nicht freigegeben.",

                color:
                    "materials",

                backRoute:
                    ROUTES.OVERVIEW
            })}

            ${renderEmptyState({
                title:
                    "Materialverwaltung nicht verfügbar",

                description:
                    "Bitte wende dich an die zuständige Objektleitung oder Administration.",

                icon:
                    "materials",

                color:
                    "warning",

                actionLabel:
                    "Zur Übersicht",

                actionRoute:
                    ROUTES.OVERVIEW
            })}

        </section>
    `;
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderMaterialsPage(state) {

    if (
        !canViewMaterials(
            state
        )
    ) {

        return renderAccessDenied();
    }

    const alerts =
        getMaterialAlerts(state);

    const warningStock = [
        ...getCriticalStock(state),
        ...getLowStock(state)
    ];

    const availableStock =
        getAvailableStock(state);

    const orderedStock =
        getOrderedStock(state);

    const materials =
        getMaterials(state);

    const cabinets =
        getMaterialCabinets(state);

    return `
        <section class="app-materials-page">

            ${renderPageTitle({
                eyebrow:
                    "Material",

                title:
                    "Bestände",

                description:
                    state.currentObject
                        ? `Materialübersicht für ${
                            state.currentObject.name ??
                            state.currentObject.id
                        } und weitere freigegebene Objekte.`
                        : "Materialbestände, Warnungen und Nachbestellungen.",

                color:
                    "materials",

                actionLabel:
                    canManageMaterials(state)
                        ? "Bestellen"
                        : "Melden",

                action:
                    canManageMaterials(state)
                        ? "create-material-order"
                        : "create-material-ticket",

                compact:
                    true
            })}

            <section class="app-materials-status">

                ${renderMaterialStatus(
                    state
                )}

            </section>

            ${
                alerts.length > 0
                    ? `
                        <section class="app-materials-alerts">

                            ${renderSectionHeader({
                                title:
                                    "Materialhinweise",

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

            <section class="app-materials-quick-actions">

                ${renderSectionHeader({
                    title:
                        "Schnellaktionen",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getMaterialQuickActions(
                        state
                    )
                )}

            </section>

            <section class="app-materials-content">

                ${renderCollapsiblePanel({
                    title:
                        "Kritische und niedrige Bestände",

                    description:
                        "Materialien mit Handlungsbedarf",

                    icon:
                        "warning",

                    color:
                        warningStock.length > 0
                            ? "warning"
                            : "success",

                    count:
                        warningStock.length,

                    open:
                        true,

                    content:
                        renderCriticalStockList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Verfügbare Bestände",

                    description:
                        "Materialien oberhalb des Mindestbestands",

                    icon:
                        "materials",

                    color:
                        "materials",

                    count:
                        availableStock.length,

                    content:
                        renderAvailableStockList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Bestellt",

                    description:
                        "Bereits nachbestellte Materialien",

                    icon:
                        "materials",

                    color:
                        "info",

                    count:
                        orderedStock.length,

                    content:
                        renderOrderedStockList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Material nach Objekt",

                    description:
                        "Bestandsstatus je Einsatzort",

                    icon:
                        "objects",

                    color:
                        "objects",

                    count:
                        getVisibleObjects(
                            state
                        ).length,

                    content:
                        renderObjectMaterialSummary(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Materialschränke",

                    description:
                        "Lagerorte, Sicherung und QR-Zugriff",

                    icon:
                        "materials",

                    color:
                        "objects",

                    count:
                        cabinets.length,

                    content:
                        renderCabinetList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Materialstamm",

                    description:
                        "Artikel, Einheiten und Dosierung",

                    icon:
                        "materials",

                    color:
                        "more",

                    count:
                        materials.length,

                    content:
                        renderMaterialMasterList(
                            state
                        )
                })}

            </section>

            ${renderTextBlock({
                title:
                    "Materialfluss",

                text:
                    "Mitarbeitende melden fehlendes Material direkt am Objekt. Die Objektleitung sieht Mindestbestände, erstellt Nachbestellungen und kann Lagerorte je Objekt hinterlegen.",

                color:
                    "materials",

                icon:
                    "materials"
            })}

        </section>
    `;
}