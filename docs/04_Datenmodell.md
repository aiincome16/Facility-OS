Kapitel 4: Detaillierte Workflows

Dieses Kapitel beschreibt die wichtigsten Arbeitsabläufe in Facility OS.
Die Workflows bilden später die Grundlage für:

* Benutzeroberflächen
* Datenbankstruktur
* Automatisierungen
* KI-Funktionen
* Berechtigungen

⸻

Workflow 1: Mitarbeiter – Arbeitsbeginn (Check-in)

Ziel

Digitale Erfassung des Arbeitsbeginns und automatische Bereitstellung der richtigen Informationen.

⸻

Ablauf

Schritt 1: App öffnen

Mitarbeiter meldet sich an.

System prüft:

* Benutzerkonto aktiv?
* richtige Rolle?
* Berechtigung vorhanden?

⸻

Schritt 2: Objekt auswählen oder QR-Code scannen

Standard:

* Mitarbeiter scannt QR-Code am Objekt-Eingang.

Alternative:

* Objekt aus eigener Liste auswählen (nur wenn berechtigt).

⸻

Schritt 3: Systemprüfung

Facility OS prüft:

* Gehört Mitarbeiter zum Unternehmen?
* Ist Mitarbeiter diesem Objekt zugewiesen?
* Ist aktuelle Arbeitszeit erlaubt?
* Gibt es besondere Hinweise?

⸻

Schritt 4: Arbeitsbeginn speichern

Gespeichert werden:

* Mitarbeiter-ID
* Objekt-ID
* Datum
* Startzeit
* QR-Code-ID
* Standort (optional)
* Gerät

⸻

Schritt 5: Objektinformationen anzeigen

Mitarbeiter erhält:

* Objektanweisungen
* Sicherheitsinformationen
* Aufgaben
* Besonderheiten

Beispiel:

“Bitte zuerst Sanitärbereiche EG reinigen.”

⸻

Workflow 2: Mitarbeiter – Tagesaufgaben bearbeiten

Ziel

Mitarbeiter erhält eine klare Arbeitsstruktur.

⸻

Ablauf

Nach Check-in:

Dashboard zeigt:

Heute
Objekt:
Firma Muster GmbH
Aufgaben:
☐ Büros reinigen
☐ Sanitärbereiche
☐ Müll entsorgen
☐ Verbrauchsmaterial prüfen

⸻

Aufgabe starten

Mitarbeiter klickt:

“Aufgabe beginnen”

System speichert:

* Startzeit
* Benutzer
* Aufgabe

⸻

Aufgabe abschließen

Mitarbeiter:

* bestätigt Erledigung
* kann Foto hinzufügen
* kann Kommentar hinzufügen

Status:

Offen
↓
In Arbeit
↓
Erledigt

⸻

Workflow 3: Objektleiter – Tagessteuerung

Ziel

Der Objektleiter erhält eine Live-Übersicht.

⸻

Dashboard:

Anzeige:

Meine Objekte
Objekt A
🟢 3 Mitarbeiter aktiv
Objekt B
🟡 Mitarbeiter verspätet
Objekt C
🔴 Ticket offen

⸻

Objektleiter kann:

* Aufgaben ändern
* Prioritäten setzen
* Nachrichten senden
* Mitarbeiter kontaktieren
* Kontrollen durchführen

⸻

Workflow 4: Vertretung bei Krankheit

Ziel

Schnelle Ersatzplanung ohne Telefonkette.

⸻

Ablauf

Schritt 1

Mitarbeiter meldet:

“Ich bin heute krank.”

⸻

Schritt 2

System informiert:

* Objektleiter
* zuständige Verantwortliche

⸻

Schritt 3

KI-Unterstützung (später)

System sucht:

* verfügbare Mitarbeiter
* passende Qualifikation
* Entfernung
* Arbeitszeit

⸻

Schritt 4

Vorschläge:

Beispiel:

Vertretungsvorschlag:
Mitarbeiter A
✓ gleiche Qualifikation
✓ verfügbar
✓ kennt Objekt

⸻

Schritt 5

Objektleiter bestätigt.

Vertretung erhält:

* Nachricht
* Objektinformationen
* Aufgaben

⸻

Workflow 5: Neuer Mitarbeiter / erste Arbeit am Objekt

Ziel

Neue Mitarbeiter oder Vertretungen schnell einarbeiten.

⸻

Ablauf

System erkennt:

“Erster Einsatz an diesem Objekt.”

⸻

Anzeige:

Objekt Guide

Enthält:

* Lageplan
* Räume
* Aufgaben
* Besonderheiten
* Ansprechpartner
* Sicherheitsregeln

⸻

Beispiel:

Raum 101:
Täglich saugen
Mülleimer leeren
Raum 102:
Nur Montag und Donnerstag

⸻

Workflow 6: Kunde meldet Problem

Ziel

Direkte Kommunikation ohne Informationsverlust.

⸻

Ablauf

Kunde erstellt Ticket:

Daten:

* Objekt
* Kategorie
* Beschreibung
* Foto

⸻

System:

* erstellt Ticketnummer
* informiert Objektleiter

⸻

Objektleiter:

* prüft
* weist Aufgabe zu
* dokumentiert Lösung

⸻

Kunde erhält:

Status:

Eingegangen
Bearbeitung
Gelöst

⸻

Workflow 7: Materialverwaltung

Ziel

Verhindert Materialengpässe.

⸻

Ablauf

Mitarbeiter scannt Material-QR-Code.

System zeigt:

WC-Papier
Bestand:
15 Kartons
Mindestbestand:
10
Status:
OK

⸻

Bei Unterschreitung:

Automatische Meldung:

“Nachbestellung erforderlich.”

⸻

Workflow 8: Qualitätskontrolle

Ziel

Messbare Qualität.

⸻

Ablauf

Objektleiter startet Kontrolle.

Prüfpunkte:

* Sauberkeit
* Vollständigkeit
* Verbrauchsmaterial
* Sonderbereiche

⸻

Bewertung:

* erfüllt
* teilweise erfüllt
* nicht erfüllt

⸻

Ergebnis:

Qualitätsbericht wird gespeichert.

⸻

Workflow 9: Arbeitsende (Check-out)

Ablauf

Mitarbeiter:

1. öffnet App
2. scannt QR-Code
3. bestätigt Aufgaben
4. meldet Probleme

⸻

System speichert:

* Endzeit
* Arbeitsdauer
* Aufgabenstatus
* Meldungen

⸻

Tagesnachweis entsteht.

⸻

Workflow 10: Tagesabschluss Objektleiter

Übersicht:

Objektleiter sieht:

* Arbeitszeiten
* erledigte Aufgaben
* offene Tickets
* Qualitätsstatus

⸻

Kann erstellen:

* Tagesbericht
* Kundenbericht
* interne Dokumentation