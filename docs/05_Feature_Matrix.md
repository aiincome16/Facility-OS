Kapitel 5: Datenmodell & Datenbankstruktur

Dieses Kapitel definiert die Grundlage aller gespeicherten Daten.

Ziel:

* klare Datenstruktur
* keine doppelten Informationen
* sichere Berechtigungen
* einfache Erweiterbarkeit

Facility OS wird von Anfang an mehrmandantenfähig geplant.

Das bedeutet:

Mehrere Unternehmen können dieselbe Software nutzen, aber ihre Daten bleiben vollständig getrennt.

⸻

5.1 Grundstruktur der Daten

Facility OS
└── Organisation (Unternehmen)
    ├── Benutzer
    ├── Mitarbeiter
    ├── Kunden
    ├── Objekte
    │
    ├── Räume
    ├── Aufgaben
    ├── Schichten
    ├── Tickets
    ├── Materialien
    ├── Dokumente
    └── Berichte

⸻

5.2 Organisation (Unternehmen)

Zweck

Speichert das Unternehmen, das Facility OS nutzt.

Tabelle:

organizations

Feld	Beschreibung
id	eindeutige ID
name	Firmenname
adresse	Firmenadresse
kontakt	Ansprechpartner
tarif	Free / Pro / Pro+
status	aktiv / gesperrt
created_at	Erstellung

⸻

5.3 Benutzer

Zweck

Alle Personen mit Zugang zum System.

Tabelle:

users

Feld	Beschreibung
id	Benutzer-ID
organization_id	Unternehmen
name	Name
email	Login
password_hash	verschlüsseltes Passwort
role_id	Rolle
status	aktiv/inaktiv
last_login	letzter Login

⸻

5.4 Rollen

Zweck

Steuerung der Berechtigungen.

Tabelle:

roles

Beispiele:

ID	Rolle
1	Admin
2	Objektleiter
3	Mitarbeiter
4	Buchhaltung
5	Kunde

⸻

5.5 Berechtigungen

Zweck

Feinere Rechte als nur Rollen.

Tabelle:

permissions

Beispiele:

Berechtigung

Mitarbeiter ansehen

Mitarbeiter bearbeiten

Objekt erstellen

Aufgaben ändern

Berichte sehen

⸻

5.6 Mitarbeiter

Zweck

Arbeitskräfte verwalten.

Tabelle:

employees

Feld	Beschreibung
id	Mitarbeiter-ID
user_id	Benutzerkonto
personalnummer	interne Nummer
telefon	Kontakt
qualifikation	Fähigkeiten
status	aktiv/krank/Urlaub
eintrittsdatum	Beginn

⸻

5.7 Kunden

Zweck

Auftraggeber verwalten.

Tabelle:

customers

Feld	Beschreibung
id	Kunden-ID
organization_id	Unternehmen
name	Kunde
kontakt	Ansprechpartner
telefon	Kontakt
email	E-Mail

⸻

5.8 Objekte

Zweck

Reinigungsobjekte verwalten.

Tabelle:

objects

Feld	Beschreibung
id	Objekt-ID
organization_id	Unternehmen
customer_id	Kunde
name	Objektname
adresse	Standort
objektleiter_id	Verantwortlicher
status	aktiv/inaktiv

⸻

5.9 Räume

Zweck

Detaillierte Objektstruktur.

Tabelle:

rooms

Feld	Beschreibung
id	Raum-ID
object_id	Objekt
name	Raumname
etage	Etage
typ	Büro/Sanitär usw.
besonderheiten	Hinweise

⸻

5.10 Aufgaben

Zweck

Arbeitsplanung.

Tabelle:

tasks

Feld	Beschreibung
id	Aufgaben-ID
object_id	Objekt
room_id	Raum
title	Aufgabe
description	Beschreibung
frequency	täglich/wöchentlich
priority	Priorität
status	Status

⸻

5.11 Schichten

Zweck

Arbeitszeiten verwalten.

Tabelle:

shifts

Feld	Beschreibung
id	Schicht-ID
employee_id	Mitarbeiter
object_id	Objekt
start_time	Beginn
end_time	Ende
status	geplant/laufend/beendet

⸻

5.12 Check-in / Check-out

Zweck

Digitaler Leistungsnachweis.

Tabelle:

attendance

Feld	Beschreibung
id	ID
employee_id	Mitarbeiter
object_id	Objekt
checkin_time	Beginn
checkout_time	Ende
qr_code_id	QR-Code
location	Standort

⸻

5.13 Tickets

Zweck

Probleme und Meldungen.

Tabelle:

tickets

Feld	Beschreibung
id	Ticket-ID
object_id	Objekt
creator_id	Ersteller
category	Kategorie
description	Beschreibung
priority	Priorität
status	Status

⸻

5.14 Materialien

Zweck

Verbrauch und Lager.

Tabelle:

materials

Feld	Beschreibung
id	Material-ID
name	Name
category	Kategorie
minimum_stock	Mindestbestand

⸻

5.15 Materialbestand

Zweck

Bestände pro Objekt/Lager.

Tabelle:

inventory

Feld	Beschreibung
id	ID
material_id	Material
object_id	Objekt
quantity	Menge
updated_at	Aktualisierung

⸻

5.16 Nachrichten

Zweck

Kommunikation.

Tabelle:

messages

Feld	Beschreibung
id	Nachricht
sender_id	Absender
receiver_id	Empfänger
text	Inhalt
created_at	Datum

⸻

5.17 Dokumente

Zweck

Digitale Ablage.

Beispiele:

* Verträge
* Objektanweisungen
* Sicherheitsdatenblätter
* Checklisten

⸻

5.18 Audit Log

Zweck

Nachvollziehbarkeit.

Speichert:

* Wer?
* Wann?
* Was geändert?

Beispiel:

“Mitarbeiter Müller änderte Aufgabe Raum 101.”

⸻

5.19 Datenbeziehungen

Beispiel:

Organisation
    |
    |
    ├── Benutzer
    ├── Mitarbeiter
    ├── Objekte
             |
             |
             ├── Räume
             ├── Aufgaben
             ├── Tickets
             └── Materialien

⸻

Kapitel 5 abgeschlossen.

Ergebnis:

Wir haben jetzt die Grundlage für:

* Datenbank
* Backend
* APIs
* Berechtigungen
* Frontend-Ansichten