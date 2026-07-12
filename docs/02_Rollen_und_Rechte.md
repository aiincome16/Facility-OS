Kapitel 2: Rollenmodell & Berechtigungen

2.1 Grundprinzip der Rechteverwaltung

Facility OS verwendet ein rollenbasiertes Berechtigungssystem (Role-Based Access Control / RBAC).

Jeder Benutzer erhält:

* eine Rolle
* definierte Zugriffsrechte
* zugeordnete Unternehmen/Organisationen
* zugeordnete Objekte (falls erforderlich)

Grundregel:

Jeder sieht nur die Daten und Funktionen, die er für seine Arbeit benötigt.

⸻

2.2 Rollenübersicht

Rolle	Beschreibung
SUPER ADMIN	Systemverwaltung von Facility OS
ADMIN	Unternehmensverwaltung
OBJEKTLEITER	Steuerung von Objekten und Mitarbeitern
MITARBEITER	Durchführung der Arbeiten
BUCHHALTUNG	Zeiten, Kosten und Abrechnung
KUNDE	Einblick in eigene Objekte

⸻

2.3 SUPER ADMIN

Zweck

Interne Verwaltung der Plattform.

Zugriff

Nur Betreiber von Facility OS.

Rechte:

Unternehmen

* Unternehmen anlegen
* Unternehmen sperren
* Tarife verwalten
* Abonnements verwalten

System

* Systemeinstellungen
* Fehleranalyse
* Sicherheitsüberwachung
* globale Statistiken

Kein Zugriff:

* keine Einsicht in Arbeitsdaten ohne Berechtigung
* kein Zugriff auf private Kundendaten ohne Freigabe

⸻

2.4 ADMIN (Unternehmen)

Zweck

Verwaltung eines Unternehmens.

Beispiele:

* Geschäftsführer
* Inhaber

Zugriff:

Gesamtes eigenes Unternehmen.

Rechte:

Mitarbeiter

* Mitarbeiter anlegen
* Mitarbeiter bearbeiten
* Rollen vergeben
* deaktivieren

Objekte

* Objekte erstellen
* Objekte bearbeiten
* Objektleiter zuweisen

Einstellungen

* Firmenprofil
* Arbeitszeiten
* Benachrichtigungen
* Benutzerverwaltung

Auswertungen

* Gesamtübersicht
* Leistungsberichte
* Statistiken

⸻

2.5 OBJEKTLEITER

Zweck

Operative Steuerung im Alltag.

Dies ist die wichtigste Demo-Rolle.

Zugriff:

Nur zugewiesene Objekte.

⸻

Dashboard

Der Objektleiter sieht:

* aktive Mitarbeiter
* aktuelle Schichten
* offene Aufgaben
* Tickets
* Meldungen
* Qualitätsstatus

⸻

Mitarbeiterverwaltung

Erlaubt:

✅ Mitarbeiter seines Bereichs sehen
✅ Schichten kontrollieren
✅ Aufgaben verteilen
✅ Vertretungen organisieren

Nicht erlaubt:

❌ Gehälter sehen
❌ Unternehmensfinanzen sehen

⸻

Objektverwaltung

Erlaubt:

* Objektinformationen ansehen
* Räume verwalten
* Aufgaben planen
* Objektanweisungen pflegen

⸻

Qualitätskontrolle

Erlaubt:

* Kontrollen durchführen
* Fotos ansehen
* Mängel bewerten
* Berichte erstellen

⸻

2.6 MITARBEITER

Zweck

Ausführung der täglichen Arbeit.

Zugriff:

Nur eigene Daten und zugewiesene Aufgaben.

⸻

Dashboard

Der Mitarbeiter sieht:

* heutige Aufgaben
* Arbeitszeiten
* eigenes Objekt
* Nachrichten
* Hinweise

⸻

Funktionen

Erlaubt:

✅ Einchecken
✅ Auschecken
✅ Aufgaben bearbeiten
✅ Mängel melden
✅ Fotos hochladen
✅ Nachrichten empfangen

⸻

Nicht erlaubt:

❌ andere Mitarbeiter verwalten
❌ Kundendaten sehen
❌ interne Unternehmensdaten sehen

⸻

2.7 BUCHHALTUNG

Zweck

Finanzielle Verarbeitung.

⸻

Zugriff:

* Arbeitszeiten
* Abwesenheiten
* relevante Dokumente

⸻

Rechte:

* Zeiten prüfen
* Reports erstellen
* Exporte erstellen

⸻

Nicht erlaubt:

❌ Aufgaben ändern
❌ Mitarbeiter steuern
❌ Objektanweisungen bearbeiten

⸻

2.8 KUNDE

Zweck

Transparenz über die beauftragten Leistungen.

⸻

Zugriff:

Nur eigene Objekte.

⸻

Kunde sieht:

* Objektstatus
* erledigte Leistungen
* Berichte
* Tickets
* Kommunikation

⸻

Nicht sichtbar:

❌ Mitarbeiterdaten anderer Kunden
❌ interne Planung
❌ Kostenstrukturen

⸻

2.9 Erweiterte Rechte (später)

Für größere Unternehmen:

Bereichsleiter

Mehrere Objektleiter verwalten.

Qualitätsmanager

Nur Kontrollen und Bewertungen.

Lagerverantwortlicher

Materialverwaltung.

Personalverwaltung

Mitarbeiterdokumente und Abwesenheiten.

⸻

2.10 Berechtigungsstruktur (technisch)

Jeder Zugriff wird geprüft über:

Benutzer
 ↓
Organisation
 ↓
Rolle
 ↓
Berechtigung
 ↓
Objektzuweisung
 ↓
Aktion

Beispiel:

Mitarbeiter Müller
→ Rolle Mitarbeiter
→ Objekt A zugewiesen
→ darf Aufgaben in Objekt A bearbeiten
→ darf Objekt B nicht sehen