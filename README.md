# AssetManager

Ein leistungsstarker, privater Finanz-Tracker für React Native (Expo), mit dem du dein Gesamtvermögen über verschiedene Anbieter hinweg im Blick behältst. Die App kombiniert lokale Datensicherheit mit moderner KI-Analyse und dynamischer Visualisierung.

## 🚀 Hauptfunktionen

* **Zentrales Dashboard**: Anzeige des Gesamtvermögens und der Performance (nominal und prozentual) auf einen Blick.
* **KI-gestützte Erfassung**: Automatische Extraktion von Portfoliowerten aus Screenshots mittels Gemini AI (Google Generative AI).
* **Dynamische Charts**: Visualisierung deines Vermögensverlaufs mit automatischer Aggregation (Täglich, Wöchentlich, Monatlich) je nach Zeitbereich.
* **Visualisierungs-Modi**: Flexibler Wechsel zwischen Linien- und Balkendiagrammen direkt in der App.
* **Lokale Datenbank**: Vollständige Offline-Verwaltung deiner Daten mit SQLite, inklusive automatischer Trigger für die Historien-Berechnung.
* **Sicherheit & Datenschutz**: Sicherer Speicher (SecureStore) für API-Keys und kryptographische Master-Keys direkt auf deinem Gerät.
* **Batch-Eingabe**: Erfassung mehrerer Provider-Werte gleichzeitig inklusive historischer Zeitstempel.

## 🛠 Tech-Stack

* **Framework**: React Native mit Expo.
* **Datenbank**: Expo SQLite (mit VIEWs und TRIGGERN für Performance).
* **KI-Integration**: Google Gemini AI API.
* **Grafik**: React Native SVG für die Diagramme.
* **Styling**: Zentrales Theme-System für konsistentes Design.

## 📋 Unterstützte Anbieter

Die App ist aktuell für folgende Anbieter vorkonfiguriert:
* C24
* Norisbank
* Trading 212
* Bitget
* Timeless

## ⚙️ Installation & Setup

1.  **Abhängigkeiten installieren**:
    ```bash
    npm install
    ```
2.  **App starten**:
    ```bash
    npx expo start
    ```
3.  **KI-Funktion aktivieren**: Hinterlege deinen Gemini API-Key in den App-Einstellungen, um die automatische Screenshot-Analyse zu nutzen.

## 🔐 Datenschutz

Deine Finanzdaten sind sensibel. Deshalb speichert der AssetManager alle Buchungen und Bestände ausschließlich lokal in einer SQLite-Datenbank auf deinem Smartphone. Es findet kein Cloud-Sync deiner Vermögenswerte statt.

---

## 🛠️ Geplante Erweiterungen & Roadmap

Um den AssetManager noch leistungsfähiger und benutzerfreundlicher zu machen, sind folgende Erweiterungen für zukünftige Versionen geplant:

### 🔐 Neue Funktionen
* **Backup & Restore**: Export und Import der lokalen Datenbank als verschlüsselte Datei zur externen Datensicherung. [in progress]
* **Währungs-Flexibilität**: Unterstützung für verschiedene Basiswährungen und spezielle Ansichten für Krypto-Assets.

## Umgesetzte Erweiterungen 
### ⚡ Technische Optimierungen
* **Performance-Listen**: Umstellung der Portfolio- und Historien-Anzeige auf `FlatList` für effizienteres Rendering großer Datenmengen.
* **DB-Indizes**: Optimierung der SQLite-Abfragegeschwindigkeit durch Indizes auf den Spalten `timestamp` und `provider`.

### 🎨 UX & Visualisierung
* **Interaktive Charts**: "On-Touch"-Tooltips zur Anzeige exakter Beträge im Graphen.
* **Validierte Eingabe**: Optimierung der manuellen Datumseingabe durch Input-Masking oder native Picker-Integration.
* **Zentrales UI-Feedback**: Implementierung eines globalen Notification-Systems für konsistente Erfolgs- und Fehlermeldungen.


## Möglich für V2
* **Biometrische Sperre**: Optionale Zugriffssicherung der App mittels FaceID oder Fingerabdruck. 
* **Detail-Analysen**: Einführung von Einzel-Historien pro Anbieter für tiefere Einblicke.
* **Dark Mode**: Vollständige Unterstützung für das systemweite dunkle Erscheinungsbild.
