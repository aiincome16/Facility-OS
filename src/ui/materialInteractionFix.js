/************************************************
 * Facility OS
 * materialInteractionFix.js
 *
 * Mobile-sichere Materialauswahl ohne Abhängigkeit
 * von nativen Select-Menüs.
 ************************************************/

const ENHANCED_ATTRIBUTE =
    "data-material-mobile-enhanced";

let observer = null;

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getOptions(selectElement) {
    return Array.from(
        selectElement?.options ?? []
    ).filter((option) =>
        String(option.value ?? "").trim() !== ""
    );
}

function createChoiceButton({
    value,
    label,
    selected,
    type,
    unit = ""
}) {
    return `
        <button
            type="button"
            class="material-choice-button ${selected ? "selected" : ""}"
            data-material-choice-type="${escapeHtml(type)}"
            data-material-choice-value="${escapeHtml(value)}"
            data-material-choice-unit="${escapeHtml(unit)}"
            aria-pressed="${selected ? "true" : "false"}"
        >
            ${escapeHtml(label)}
        </button>
    `;
}

function renderObjectChoices(form) {
    const objectSelect =
        form.querySelector("#material-object");

    const container =
        form.querySelector(
            "[data-material-object-choices]"
        );

    if (!objectSelect || !container) {
        return;
    }

    const options =
        getOptions(objectSelect);

    container.innerHTML =
        options.length
            ? options.map((option) =>
                createChoiceButton({
                    value:
                        option.value,
                    label:
                        option.textContent.trim(),
                    selected:
                        option.value ===
                        objectSelect.value,
                    type:
                        "object"
                })
            ).join("")
            : `
                <div class="material-choice-empty">
                    Keine Objekte verfügbar.
                </div>
            `;
}

function renderMaterialChoices(form) {
    const objectSelect =
        form.querySelector("#material-object");

    const materialSelect =
        form.querySelector("#material-select");

    const container =
        form.querySelector(
            "[data-material-item-choices]"
        );

    if (
        !objectSelect ||
        !materialSelect ||
        !container
    ) {
        return;
    }

    if (!objectSelect.value) {
        container.innerHTML = `
            <div class="material-choice-empty">
                Zuerst ein Objekt auswählen.
            </div>
        `;
        return;
    }

    const options =
        getOptions(materialSelect);

    container.innerHTML =
        options.length
            ? options.map((option) =>
                createChoiceButton({
                    value:
                        option.value,
                    label:
                        option.textContent.trim(),
                    selected:
                        option.value ===
                        materialSelect.value,
                    type:
                        "material",
                    unit:
                        option.getAttribute(
                            "data-unit"
                        ) ?? ""
                })
            ).join("")
            : `
                <div class="material-choice-empty">
                    Keine Materialien verfügbar.
                </div>
            `;
}

function updateFormState(form) {
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

    renderObjectChoices(form);
    renderMaterialChoices(form);
}

function selectObject(form, value) {
    const objectSelect =
        form.querySelector("#material-object");

    const materialSelect =
        form.querySelector("#material-select");

    const unitInput =
        form.querySelector("#material-unit");

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

    if (unitInput) {
        unitInput.disabled = false;
        unitInput.value = "";
    }

    if (quantityInput) {
        quantityInput.disabled = true;
        quantityInput.value = "";
    }

    objectSelect.dispatchEvent(
        new Event("change", {
            bubbles: true
        })
    );

    updateFormState(form);
}

function selectMaterial(
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
        quantityInput.focus();
    }

    materialSelect.dispatchEvent(
        new Event("change", {
            bubbles: true
        })
    );

    updateFormState(form);
}

function handleChoiceClick(event) {
    const button =
        event.target.closest(
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

    const type =
        button.getAttribute(
            "data-material-choice-type"
        );

    const value =
        button.getAttribute(
            "data-material-choice-value"
        ) ?? "";

    if (type === "object") {
        selectObject(
            form,
            value
        );
        return;
    }

    if (type === "material") {
        selectMaterial(
            form,
            value,
            button.getAttribute(
                "data-material-choice-unit"
            ) ?? ""
        );
    }
}

function enhanceMaterialForm(form) {
    if (
        !form ||
        form.hasAttribute(
            ENHANCED_ATTRIBUTE
        )
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
        ENHANCED_ATTRIBUTE,
        "true"
    );

    objectSelect.classList.add(
        "material-native-select"
    );

    materialSelect.classList.add(
        "material-native-select"
    );

    const objectLabel =
        objectSelect.closest("label");

    const materialLabel =
        materialSelect.closest("label");

    objectLabel?.insertAdjacentHTML(
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

    materialLabel?.insertAdjacentHTML(
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
        "click",
        handleChoiceClick
    );

    form.addEventListener(
        "input",
        () => updateFormState(form)
    );

    form.addEventListener(
        "change",
        () => {
            window.setTimeout(
                () => {
                    const currentForm =
                        document.getElementById(
                            "material-order-form"
                        );

                    if (currentForm) {
                        enhanceMaterialForm(
                            currentForm
                        );
                        updateFormState(
                            currentForm
                        );
                    }
                },
                0
            );
        }
    );

    updateFormState(form);
}

function scan() {
    const form =
        document.getElementById(
            "material-order-form"
        );

    if (form) {
        enhanceMaterialForm(form);
    }
}

function startObserver() {
    if (observer) {
        return;
    }

    observer = new MutationObserver(
        scan
    );

    observer.observe(
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
        startObserver,
        {
            once: true
        }
    );
}
else {
    startObserver();
}