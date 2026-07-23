/************************************************
 * Facility OS
 * materialInteractionFix.js
 *
 * Direkte, mobile-sichere Materialauswahl.
 ************************************************/

const MARKER =
    "data-material-mobile-enhanced";

function esc(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getForm() {
    return document.getElementById(
        "material-order-form"
    );
}

function getOptions(selectElement) {
    return Array.from(
        selectElement?.options ?? []
    ).filter((option) =>
        String(option.value ?? "").trim() !== ""
    );
}

function setSelectedButton(
    container,
    selectedValue
) {
    container
        ?.querySelectorAll(
            ".material-choice-button"
        )
        .forEach((button) => {
            const selected =
                button.getAttribute(
                    "data-value"
                ) === selectedValue;

            button.classList.toggle(
                "selected",
                selected
            );

            button.setAttribute(
                "aria-pressed",
                selected ? "true" : "false"
            );
        });
}

function updateSubmitState(form) {
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

    submitButton.disabled = !(
        objectSelect.value &&
        materialSelect.value &&
        unitInput.value &&
        Number(quantityInput.value) > 0
    );
}

function renderMaterialButtons(form) {
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

    container.innerHTML =
        getOptions(materialSelect)
            .map((option) => `
                <button
                    type="button"
                    class="material-choice-button"
                    data-value="${esc(option.value)}"
                    onclick="window.facilityChooseMaterial(
                        '${esc(option.value)}',
                        '${esc(
                            option.getAttribute(
                                "data-unit"
                            ) ?? ""
                        )}'
                    )"
                >
                    ${esc(option.textContent.trim())}
                </button>
            `)
            .join("");
}

function renderObjectButtons(form) {
    const objectSelect =
        form.querySelector("#material-object");

    const container =
        form.querySelector(
            "[data-material-object-choices]"
        );

    if (!objectSelect || !container) {
        return;
    }

    container.innerHTML =
        getOptions(objectSelect)
            .map((option) => `
                <button
                    type="button"
                    class="material-choice-button"
                    data-value="${esc(option.value)}"
                    onclick="window.facilityChooseObject(
                        '${esc(option.value)}'
                    )"
                >
                    ${esc(option.textContent.trim())}
                </button>
            `)
            .join("");

    setSelectedButton(
        container,
        objectSelect.value
    );
}

window.facilityChooseObject =
    function facilityChooseObject(
        objectId
    ) {
        const form = getForm();

        if (!form) {
            return;
        }

        const objectSelect =
            form.querySelector(
                "#material-object"
            );

        const materialSelect =
            form.querySelector(
                "#material-select"
            );

        const unitInput =
            form.querySelector(
                "#material-unit"
            );

        const quantityInput =
            form.querySelector(
                "#material-quantity"
            );

        if (!objectSelect) {
            return;
        }

        objectSelect.value = objectId;

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

        setSelectedButton(
            form.querySelector(
                "[data-material-object-choices]"
            ),
            objectId
        );

        renderMaterialButtons(form);
        updateSubmitState(form);
    };

window.facilityChooseMaterial =
    function facilityChooseMaterial(
        selectedMaterialId,
        unit
    ) {
        const form = getForm();

        if (!form) {
            return;
        }

        const materialSelect =
            form.querySelector(
                "#material-select"
            );

        const unitInput =
            form.querySelector(
                "#material-unit"
            );

        const quantityInput =
            form.querySelector(
                "#material-quantity"
            );

        if (!materialSelect) {
            return;
        }

        materialSelect.disabled = false;
        materialSelect.value =
            selectedMaterialId;

        if (unitInput) {
            unitInput.disabled = false;
            unitInput.value = unit;
        }

        if (quantityInput) {
            quantityInput.disabled = false;
        }

        setSelectedButton(
            form.querySelector(
                "[data-material-item-choices]"
            ),
            selectedMaterialId
        );

        updateSubmitState(form);

        window.setTimeout(
            () => quantityInput?.focus(),
            0
        );
    };

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

    objectSelect
        .closest("label")
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

    materialSelect
        .closest("label")
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
        () => updateSubmitState(form)
    );

    renderObjectButtons(form);
    renderMaterialButtons(form);
    updateSubmitState(form);
}

function scan() {
    enhance(getForm());
}

function start() {
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
