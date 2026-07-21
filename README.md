# Facility OS

Facility OS ist eine mobile, rollenbasierte Verwaltungsplattform für
Reinigungsunternehmen und Facility-Management-Betriebe.

Die Anwendung befindet sich in aktiver Entwicklung. Dieses Repository enthält
einen Entwicklungs- und Demonstrationsstand, noch kein vollständig
produktionsreifes SaaS-System.

## Live-Demo

[Facility OS auf GitHub Pages öffnen](https://aiincome16.github.io/Facility-OS/)

> Die Live-Version verwendet lokale Testdaten und ist nur für Entwicklung,
> Tests und Vorführungen vorgesehen.

## Produktziel

Facility OS soll Abläufe zwischen Mitarbeitern, Objektleitern, Kunden,
Buchhaltung und Administration in einer zentralen Anwendung verbinden.

Geplante beziehungsweise teilweise angelegte Bereiche:

- Arbeitszeiterfassung mit Schichtstart und Schichtende
- Objekt- und Raumverwaltung
- Aufgaben und Reinigungspläne
- Objekt-Guides für Mitarbeiter und Vertretungen
- Materialbestand und Materialbestellungen
- Meldungen, Tickets und Kundenwünsche
- Qualitätskontrollen und Nachweise
- Schlüssel-, Sicherungs- und Müllinformationen
- Rollen- und Rechteverwaltung
- Buchhaltungs- und Auswertungsbereiche
- Vertretungssuche und spätere KI-Unterstützung

## Rollen

| Rolle | Hauptaufgabe |
|---|---|
| `SUPER_ADMIN` | Globale Systemverwaltung |
| `ADMIN` | Benutzer, Objekte, Rechte und Einstellungen |
| `OBJEKTLEITER` | Mitarbeiter, Schichten, Meldungen und Kontrollen |
| `MITARBEITER` | Objekte, Aufgaben, Arbeitszeit und Materialmeldungen |
| `BUCHHALTUNG` | Arbeitszeiten, Nachweise, Abrechnung und Exporte |
| `KUNDE` | Freigegebene Objekte, Anfragen und Qualitätsinformationen |

## Aktueller Entwicklungsstand

Bereits vorhanden oder vorbereitet:

- rollenabhängige Dashboards
- Testanmeldung mit lokalen Benutzerdaten
- mobile Navigation
- Objektauswahl und Objektdetailansichten
- Schicht starten und beenden
- lokale Speicherung von Änderungen
- Anzeige erfasster Arbeitszeiten
- Materialbestellformular
- lokale JSON-Datenquellen
- GitHub-Pages-Bereitstellung

Noch nicht produktionsreif:

- echte Benutzerkonten und sichere Authentifizierung
- geschütztes Backend und zentrale Datenbank
- vollständige Mandantentrennung
- revisionssichere Arbeitszeitfreigabe
- produktive Benachrichtigungen
- vollständige Datenschutz- und Berechtigungskontrollen
- Abrechnung und Exporte
- Offline-Synchronisierung
- KI-gestützte Vertretungssuche
- automatisierte Tests und Deployment-Prüfungen

## Technischer Aufbau

- HTML5
- CSS
- JavaScript mit ES-Modulen
- lokale JSON-Testdaten
- `localStorage` für lokale Änderungen und Sitzungsdaten
- GitHub Pages für die Demo

```text
Facility-OS/
├── index.html
├── LICENSE
├── README.md
└── src/
    ├── app.js
    ├── appState.js
    ├── router.js
    ├── config/
    ├── data/
    ├── services/
    ├── styles/
    └── ui/
        └── pages/
```

## Lokal starten

Nicht direkt über `file://` öffnen, da ES-Module verwendet werden.

### Mit Python

```bash
python -m http.server 8080
```

Dann öffnen:

```text
http://localhost:8080
```

### Mit Node.js

```bash
npx serve .
```

## Testen

1. Anwendung öffnen.
2. Mit jeder Rolle einmal anmelden.
3. Mitarbeiter-Dashboard öffnen.
4. Objekt auswählen.
5. Schicht starten und beenden.
6. Arbeitszeit kontrollieren.
7. Materialbestellung testen.
8. Objektunterpunkte öffnen.
9. Abmelden und erneut anmelden.
10. Prüfen, ob lokale Änderungen erhalten bleiben.

## Sicherheit und Datenschutz

Der aktuelle Stand ist eine Entwicklungs- und Demonstrationsversion.

Keine echten personenbezogenen Daten, Kundendaten, Zugangsdaten,
Gesundheitsdaten, Schlüsselnummern oder vertraulichen Unternehmensdaten in
JSON-Testdateien oder in dieses öffentliche Repository eintragen.

Vor einem produktiven Einsatz sind mindestens erforderlich:

- geschütztes Backend
- sichere Authentifizierung
- serverseitige Rollen- und Rechteprüfung
- verschlüsselte Datenübertragung
- Datenschutz- und Löschkonzept
- Protokollierung sicherheitsrelevanter Vorgänge
- Backup- und Wiederherstellungskonzept
- Prüfung arbeitsrechtlicher Anforderungen an Zeiterfassung

## Beiträge

Dieses Projekt ist kein Open-Source-Projekt.

Pull Requests, Forks, Weiterverwendung, Veröffentlichung, kommerzielle Nutzung
und abgeleitete Produkte sind ohne vorherige schriftliche Erlaubnis nicht
gestattet.

## Lizenz

Facility OS ist proprietäre Software.

Copyright © 2026 aiincome16. Alle Rechte vorbehalten.

Die Veröffentlichung des Quellcodes erteilt keine Open-Source-Rechte.
Nutzung, Vervielfältigung, Veränderung, Vertrieb, Hosting, Verkauf und
kommerzielle Verwertung sind nur nach der Datei [`LICENSE`](./LICENSE) oder
aufgrund einer gesonderten schriftlichen Vereinbarung erlaubt.

## Hinweis zum Repository

Ein öffentliches GitHub-Repository verhindert nicht, dass Quellcode eingesehen
oder technisch kopiert wird. Nicht veröffentlichte Funktionen, Geschäftslogik,
Kundendaten und produktive Zugangsdaten gehören in ein privates Repository.