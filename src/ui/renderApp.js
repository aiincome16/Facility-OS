function renderNavigation(state) {

    const role = state.currentUser?.role;

    if (!role) {
        return "";
    }

    const navigationByRole = {

        [USER_ROLES.SUPER_ADMIN]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Benutzer",
                route: "/employees"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "System",
                route: "/settings"
            }
        ],

        [USER_ROLES.ADMIN]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Mitarbeiter",
                route: "/employees"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "Berichte",
                route: "/reports"
            }
        ],

        [USER_ROLES.OBJEKTLEITER]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Mitarbeiter",
                route: "/employees"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "Tickets",
                route: "/tickets"
            }
        ],

        [USER_ROLES.MITARBEITER]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Objekt",
                route: "/objects"
            },
            {
                label: "Aufgaben",
                route: "/tasks"
            },
            {
                label: "Meldungen",
                route: "/tickets"
            }
        ],

        [USER_ROLES.BUCHHALTUNG]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Berichte",
                route: "/reports"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "Zeiten",
                route: "/tasks"
            }
        ],

        [USER_ROLES.KUNDE]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "Meldung",
                route: "/tickets"
            },
            {
                label: "Berichte",
                route: "/reports"
            }
        ]
    };

    const navigationItems =
        navigationByRole[role] ?? [];

    return `
        <nav class="bottom-navigation">

            ${navigationItems
                .map((item) => `
                    <button
                        type="button"
                        data-route="${escapeHtml(item.route)}"
                    >
                        ${escapeHtml(item.label)}
                    </button>
                `)
                .join("")}

        </nav>
    `;
}