const STORAGE_KEY = "facility_os_local_changes";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();

function now() {
    return new Date().toISOString();
}

function createId(prefix = "TIMESHEET") {
    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;
}

function readLocalChanges() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    }
    catch {
        return {};
    }
}

function persistReports(reports) {
    const snapshot = readLocalChanges();
    snapshot.reports = reports;
    window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(snapshot)
    );
}

function employeeName(state, shift) {
    const user = arr(state?.users).find((entry) =>
        txt(entry?.id ?? entry?.userId) ===
        txt(shift?.employeeId ?? shift?.userId)
    );

    return txt(
        shift?.employeeName ??
        user?.displayName ??
        user?.fullName ??
        user?.name ??
        user?.email
    ) || "Mitarbeiter";
}

function objectName(state, shift) {
    const object = arr(state?.objects).find((entry) =>
        txt(entry?.id ?? entry?.objectId ?? entry?.ID) ===
        txt(shift?.objectId)
    );

    return txt(
        shift?.objectName ??
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name
    ) || "Objekt";
}

export function getTimesheets(state = {}) {
    return arr(state?.reports)
        .filter((entry) =>
            txt(entry?.type).toUpperCase() === "TIMESHEET"
        )
        .sort((a, b) =>
            String(b?.createdAt ?? "").localeCompare(
                String(a?.createdAt ?? "")
            )
        );
}

export function createTimesheetFromShift(state = {}, shift = {}) {
    if (!shift?.id) {
        throw new Error("Die abgeschlossene Schicht enthÃ¤lt keine ID.");
    }

    const reports = arr(state?.reports);
    const existing = reports.find((entry) =>
        txt(entry?.type).toUpperCase() === "TIMESHEET" &&
        txt(entry?.shiftId) === txt(shift.id)
    );

    if (existing) {
        return existing;
    }

    const timestamp = now();
    const durationMinutes = Number(
        shift?.durationMinutes ??
        shift?.actualMinutes ??
        0
    );

    const timesheet = {
        id: createId(),
        type: "TIMESHEET",
        shiftId: shift.id,
        userId: shift?.userId ?? shift?.employeeId,
        employeeId: shift?.employeeId ?? shift?.userId,
        employeeName: employeeName(state, shift),
        objectId: shift?.objectId,
        objectName: objectName(state, shift),
        startTime: shift?.startTime ?? shift?.checkinTime,
        endTime: shift?.endTime ?? shift?.checkoutTime,
        durationMinutes,
        durationHours: Number((durationMinutes / 60).toFixed(2)),
        shiftStatus: shift?.status ?? "FINISHED",
        status: "PENDING_MANAGER",
        workflowStatus: "PENDING_MANAGER",
        managerApprovedAt: null,
        managerApprovedBy: null,
        accountingReceivedAt: null,
        accountingReceivedBy: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        source: "LOCAL_WORKFLOW"
    };

    state.reports = [
        ...reports,
        timesheet
    ];

    persistReports(state.reports);

    return timesheet;
}

export function updateTimesheetStatus(
    state = {},
    timesheetId,
    action,
    actor = {}
) {
    const id = txt(timesheetId);
    const normalizedAction = txt(action).toUpperCase();

    if (!id) {
        throw new Error("Der Stundenzettel wurde nicht gefunden.");
    }

    const timestamp = now();
    let changed = null;

    state.reports = arr(state?.reports).map((entry) => {
        if (
            txt(entry?.type).toUpperCase() !== "TIMESHEET" ||
            txt(entry?.id) !== id
        ) {
            return entry;
        }

        if (normalizedAction === "APPROVE_MANAGER") {
            changed = {
                ...entry,
                status: "APPROVED_MANAGER",
                workflowStatus: "APPROVED_MANAGER",
                managerApprovedAt: timestamp,
                managerApprovedBy:
                    actor?.id ??
                    actor?.userId ??
                    actor?.email ??
                    "Objektleiter",
                updatedAt: timestamp
            };
        }
        else if (normalizedAction === "REJECT_MANAGER") {
            changed = {
                ...entry,
                status: "REJECTED_MANAGER",
                workflowStatus: "REJECTED_MANAGER",
                managerRejectedAt: timestamp,
                managerRejectedBy:
                    actor?.id ??
                    actor?.userId ??
                    actor?.email ??
                    "Objektleiter",
                updatedAt: timestamp
            };
        }
        else if (normalizedAction === "RECEIVE_ACCOUNTING") {
            changed = {
                ...entry,
                status: "RECEIVED_ACCOUNTING",
                workflowStatus: "RECEIVED_ACCOUNTING",
                accountingReceivedAt: timestamp,
                accountingReceivedBy:
                    actor?.id ??
                    actor?.userId ??
                    actor?.email ??
                    "Buchhaltung",
                updatedAt: timestamp
            };
        }
        else {
            throw new Error("Unbekannte Stundenzettel-Aktion.");
        }

        return changed;
    });

    if (!changed) {
        throw new Error("Der Stundenzettel wurde nicht gefunden.");
    }

    persistReports(state.reports);

    return changed;
}
