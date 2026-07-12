Kapitel 3: Hauptmodule & Funktionsbereiche

3.1 Modulübersicht

Facility OS wird modular aufgebaut. Jedes Modul erfüllt einen klaren Zweck und kann später erweitert oder als Premium-Funktion freigeschaltet werden.

⸻

Modul 1: Dashboard

Zweck

Zentrale Übersicht für jede Benutzerrolle.

Das Dashboard passt sich automatisch an die Berechtigungen an.

⸻

Mitarbeiter Dashboard

Anzeige:

* heutige Schicht
* aktuelles Objekt
* Aufgabenliste
* Nachrichten
* Hinweise
* Arbeitszeitstatus

Aktionen:

* Check-in starten
* Check-out durchführen
* Aufgabe abschließen
* Problem melden

⸻

Objektleiter Dashboard

Anzeige:

* aktive Mitarbeiter
* aktuelle Objekte
* offene Aufgaben
* Verspätungen
* Tickets
* Qualitätsstatus

Aktionen:

* Aufgaben verteilen
* Vertretung organisieren
* Mitarbeiter kontaktieren
* Berichte erstellen

⸻

Admin Dashboard

Anzeige:

* Unternehmensübersicht
* Mitarbeiteranzahl
* Objektanzahl
* Arbeitsstunden
* Auswertungen
* Systemmeldungen

⸻

Modul 2: Benutzer- und Mitarbeiterverwaltung

Zweck

Alle Personen innerhalb des Unternehmens verwalten.

⸻

Funktionen

Mitarbeiter anlegen

Daten:

* Name
* Kontakt
* Rolle
* Personalnummer
* Status
* Qualifikationen
* Arbeitszeitmodell

⸻

Mitarbeiterstatus

Mögliche Zustände:

* aktiv
* krank
* Urlaub
* nicht verfügbar
* deaktiviert

⸻

Zuordnung

Mitarbeiter können zugeordnet werden:

* Unternehmen
* Bereich
* Objekt
* Schicht
* Aufgaben

⸻

Modul 3: Objektverwaltung

Zweck

Digitale Verwaltung aller Reinigungsobjekte.

⸻

Objektstruktur

Unternehmen
└── Objekt
    ├── Gebäude
    ├── Etagen
    ├── Räume
    ├── Aufgaben
    ├── Mitarbeiter
    ├── Dokumente
    └── Einstellungen

⸻

Objektinformationen

* Name
* Adresse
* Ansprechpartner
* Arbeitszeiten
* Besonderheiten
* Zugangsinformationen
* Objektanweisungen

⸻

Objektleiter-Funktionen

* Objekt bearbeiten
* Räume verwalten
* Aufgaben planen
* Mitarbeiter zuweisen
* Kontrollen durchführen

⸻

Modul 4: Aufgabenmanagement

Zweck

Digitale Planung und Kontrolle der Arbeit.

⸻

Aufgabentypen

Regelmäßige Aufgaben

Beispiele:

* täglich
* wöchentlich
* monatlich

⸻

Einmalige Aufgaben

Beispiele:

* Sonderreinigung
* Reparaturmeldung
* Kundenwunsch

⸻

Aufgabe enthält:

* Beschreibung
* Objekt
* Raum
* Priorität
* Fälligkeit
* Verantwortlicher
* Status

⸻

Status

Offen
 ↓
Begonnen
 ↓
In Bearbeitung
 ↓
Erledigt
 ↓
Kontrolliert

⸻

Modul 5: QR-Check-in / Check-out

Zweck

Digitaler Arbeitsnachweis.

⸻

Check-in Ablauf

1. Mitarbeiter öffnet App
2. Scannt Objekt-QR-Code
3. System prüft:
    * Benutzer
    * Objekt
    * Berechtigung
4. Arbeitsbeginn wird gespeichert

⸻

Daten gespeichert:

* Mitarbeiter
* Objekt
* Datum
* Uhrzeit
* Standort (optional)
* QR-Code-ID

⸻

Check-out

Speichert:

* Arbeitsende
* erledigte Aufgaben
* Meldungen
* Bemerkungen

⸻

Modul 6: Ticketsystem / Mängelmanagement

Zweck

Probleme schnell melden und bearbeiten.

⸻

Ticket erstellen:

Mitarbeiter kann melden:

* Defekt
* fehlendes Material
* Sicherheitsproblem
* Kundenwunsch
* Qualitätsproblem

⸻

Ticket enthält:

* Kategorie
* Beschreibung
* Foto
* Priorität
* Objekt
* Status

⸻

Status:

Neu
 ↓
Angenommen
 ↓
Bearbeitung
 ↓
Gelöst
 ↓
Archiviert

⸻

Modul 7: Kommunikation

Zweck

Zentrale Kommunikation statt verstreuter WhatsApp-Nachrichten.

⸻

Funktionen:

* Nachrichten
* Objektinformationen
* wichtige Hinweise
* Push-Benachrichtigungen

⸻

Beispiele:

“Reinigungsmittel geliefert”

“Aufgabe geändert”

“Objekt heute geschlossen”

⸻

Modul 8: Berichte & Nachweise

Zweck

Transparenz für Unternehmen und Kunden.

⸻

Berichte:

* Arbeitsnachweis
* Objektbericht
* Qualitätsbericht
* Aufgabenbericht
* Ticketbericht

⸻

Modul 9: Materialverwaltung

Zweck

Kontrolle von Verbrauchsmaterial.

⸻

Funktionen:

* Materialbestand
* Verbrauch
* Nachbestellung
* QR-Code am Lagerplatz
* Warnungen bei Mindestbestand

⸻

Modul 10: KI-Assistent (später)

Zweck

Automatisierung und Unterstützung.

⸻

Geplante Funktionen:

* Vertretungssuche
* Aufgabenoptimierung
* automatische Erinnerungen
* Auswertung von Problemen
* Vorschläge für Objektleiter

⸻

Kapitel 3 abgeschlossen.

Ergebnis:

Facility OS besteht aktuell aus folgenden Kernmodulen:

1. Dashboard
2. Mitarbeiterverwaltung
3. Objektverwaltung
4. Aufgabenmanagement
5. QR-Zeiterfassung
6. Ticketsystem
7. Kommunikation
8. Berichte
9. Materialverwaltung
10. KI-Assistent