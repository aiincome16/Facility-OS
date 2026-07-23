/************************************************
 * Facility OS
 * materialInteractionFix.js
 ************************************************/

const MARKER = "data-material-mobile-enhanced";

function esc(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function optionsOf(select) {
    return Array.from(select?.options ?? [])
        .filter((option) =>
            String(option.value ?? "").trim()
        );
}

function buttonHtml({
    type,
    value,
    label,
    selected,
    unit = ""
}) {
    return `
        <button
            type="button"
            class="material-choice-button ${selected ? "selected" : ""}"
            data-material-choice-type="${esc(type)}"
            data-material-choice-value="${esc(value)}"
            data-material-choice-unit="${esc(unit)}"
            aria-pressed="${selected ? "true" : "false"}"
        >
            ${esc(label)}
        </button>
    `;
}

function renderChoices(form) {
    const objectSelect =
        form.querySelector("#material-object");

    const materialSelect =
        form.querySelector("#material-select");

    const objectBox =
        form.querySelector(
            "[data-material-object-choices]"
        );

    const materialBox =
        form.querySelector(
            "[data-material-item-choices]"
        );

    if (
        !objectSelect ||
        !materialSelect ||
        !objectBox ||
        !materialBox
    ) {
        return;
    }

    objectBox.innerHTML =
        optionsOf(objectSelect)
            .map((option) =>
                buttonHtml({
                    type: "object",
                    value: option.value,
                    label:
                        option.textContent.trim(),
                    selected:
                        option.value ===
                        objectSelect.value
                })
            )
            .join("") ||
        `
            <div class="material-choice-empty">
                Keine Objekte verfügbar.
            </div>
        `;

    materialBox.innerHTML =
        objectSelect.value
            ? (
                optionsOf(materialSelect)
                    .map((option) =>
                        buttonHtml({
                            type: "material",
                            value: option.value,
                            label:
                                option.textContent.trim(),
                            selected:
                                option.value ===
                                materialSelect.value,
                            unit:
                                option.getAttribute(
                                    "data-unit"
                                ) ?? ""
                        })
                    )
                    .join("") ||
                `
                    <div class="material-choice-empty">
                        Keine Materialien verfügbar.
                    </div>
                `
            )
            : `
                <div class="material-choice-empty">
                    Zuerst ein Objekt auswählen.
                </div>
            `;
}

function syncForm(form) {
    const objectSelect =
        form.querySelector("#material-object");

    const materialSelect =
        form.querySelector("#material-select");

    const unitInput =
        form.querySelector("#material-unit");

    const quantityInput =
        form.querySelector("#material-quantity");

    const submitButton =
        form.querySelector("#material-submit");

    if (
        !objectSelect ||
        !materialSelect ||
        !unitInput ||
        !quantityInput ||
        !submitButton
    ) {
        return;
    }

    const selectedOption =
        materialSelect.options[
            materialSelect.selectedIndex
        ];

    const unit =
        selectedOption?.getAttribute(
            "data-unit"
        ) ?? "";

    materialSelect.disabled =
        !objectSelect.value;

    unitInput.disabled = false;
    unitInput.value = unit;

    quantityInput.disabled =
        !objectSelect.value ||
        !materialSelect.value;

    submitButton.disabled = !(
        objectSelect.value &&
        materialSelect.value &&
        unit &&
        Number(quantityInput.value) > 0
    );

    renderChoices(form);
}

function chooseObject(form, value) {
    const objectSelect =
        form.querySelector("#material-object");

    const materialSelect =
        form.querySelector("#material-select");

    const quantityInput =
        form.querySelector("#material-quantity");

    if (!objectSelect) {
        return;
    }

    objectSelect.value = value;

    if (materialSelect) {
        materialSelect.disabled = false;
        materialSelect.value = "";
    }

    if (quantityInput) {
        quantityInput.value = "";
    }

    syncForm(form);
}

function chooseMaterial(
    form,
    value,
    unit
) {
    const materialSelect =
        form.querySelector("#material-select");

    const unitInput =
        form.querySelector("#material-unit");

    const quantityInput =
        form.querySelector("#material-quantity");

    if (!materialSelect) {
        return;
    }

    materialSelect.disabled = false;
    materialSelect.value = value;

    if (unitInput) {
        unitInput.disabled = false;
        unitInput.value = unit;
    }

    if (quantityInput) {
        quantityInput.disabled = false;

        setTimeout(
            () => quantityInput.focus(),
            0
        );
    }

    syncForm(form);
}

function onDocumentClick(event) {
    const button =
        event.target.closest?.(
            "[data-material-choice-type]"
        );

    if (!button) {
        return;
    }

    const form =
        button.closest(
            "#material-order-form"
        );

    if (!form) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const type =
        button.getAttribute(
            "data-material-choice-type"
        );

    const value =
        button.getAttribute(
            "data-material-choice-value"
        ) ?? "";

    if (type === "object") {
        chooseObject(form, value);
        return;
    }

    if (type === "material") {
        chooseMaterial(
            form,
            value,
            button.getAttribute(
                "data-material-choice-unit"
            ) ?? ""
        );
    }
}

function enhance(form) {
    if (
        !form ||
        form.hasAttribute(MARKER)
    ) {
        return;
    }

    const objectSelect =
        form.querySelector("#material-object");

    const materialSelect =
        form.querySelector("#material-select");

    if (
        !objectSelect ||
        !materialSelect
    ) {
        return;
    }

    form.setAttribute(
        MARKER,
        "true"
    );

    objectSelect.classList.add(
        "material-native-select"
    );

    materialSelect.classList.add(
        "material-native-select"
    );

    objectSelect.closest("label")
        ?.insertAdjacentHTML(
            "afterend",
            `
                <section class="material-choice-section">
                    <strong>1. Objekt auswählen</strong>
                    <div
                        class="material-choice-grid"
                        data-material-object-choices
                    ></div>
                </section>
            `
        );

    materialSelect.closest("label")
        ?.insertAdjacentHTML(
            "afterend",
            `
                <section class="material-choice-section">
                    <strong>2. Material auswählen</strong>
                    <div
                        class="material-choice-grid"
                        data-material-item-choices
                    ></div>
                </section>
            `
        );

    form.addEventListener(
        "input",
        () => syncForm(form)
    );

    syncForm(form);
}

function scan() {
    enhance(
        document.getElementById(
            "material-order-form"
        )
    );
}

function start() {
    document.addEventListener(
        "click",
        onDocumentClick,
        true
    );

    new MutationObserver(scan)
        .observe(
            document.documentElement,
            {
                childList: true,
                subtree: true
            }
        );

    scan();
}

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        start,
        {
            once: true
        }
    );
}
else {
    start();
}