# Technische AMR-X-Dokumentation

<div class="docs-intro-layout">
  <div class="docs-intro-copy">
    <span class="docs-intro-status">Plattform in der Entwicklungsphase</span>
    <p>AMR-X ist eine autonome modulare Roboterplattform, bei der eine wiederverwendbare mobile Indoor-Basis austauschbare Funktionsmodule über eine gemeinsame Andockschnittstelle aufnimmt. Diese Dokumentation verbindet Systemarchitektur, Implementierungsbereiche, Schnittstellen und Validierungsnachweise.</p>
    <strong class="docs-intro-summary-title">Eine Plattform, fachübergreifend koordiniert</strong>
    <ul class="docs-intro-points">
      <li><strong>Mobile Basis</strong><span>Mobilität, Sensorik, Rechner, Basisenergie und Sicherheitskoordination.</span></li>
      <li><strong>Gemeinsame Modulgrenze</strong><span>Definierte Mechanik-, Elektrik-, Daten-, Identifikations- und Zustandsschnittstellen.</span></li>
      <li><strong>ROS 2 und digitaler Zwilling</strong><span>Beschreibungen, Simulation, Kartierung, Lokalisierung, Nav2 und reproduzierbare Tests.</span></li>
      <li><strong>Missionen und Bedienwerkzeuge</strong><span>Gemeinsamer Missionszustand für Fernüberwachung und lokale HMI.</span></li>
    </ul>
  </div>

<figure class="docs-intro-visual">
  <img src="/docs/assets/images/reference-amr-x-concept-illustration.png" alt="Konzeptdarstellung der modularen AMR-X-Plattform">
  <figcaption>
    <span class="docs-intro-visual__label">Konzepteinführung</span>
    <strong>Ausrichtung der modularen mobilen Plattform</strong>
    <span>Visueller Platzhalter zur Vermittlung des AMR-X-Konzepts; keine freigegebene Produktionsgeometrie.</span>
  </figcaption>
</figure>
</div>

!!! note "Kontrollierte Entwicklungsdaten"
    Numerische Spezifikationen, Anforderungen, Stücklisten und
    Modulentscheidungen verbleiben in den kontrollierten JSON- und CSV-Dateien
    des Repositorys. Die Dokumentation erklärt das System und verweist auf
    diese Quellen; sie ist keine zweite Wahrheitsquelle.

## Technische Referenzübersicht

| Bereich | Zweck | Dokumentation |
|---|---|---|
| Aktueller Projektstand | Konsolidierter Umfang, aktive Ziele und Architekturprinzipien | [Projektstand](project/baseline.md) |
| Technische Arbeitsbereiche | Stabile Verantwortungsgrenzen und erwartete Ergebnisse | [Übersicht](project/workstreams.md) |
| ROS-2-Arbeitsbereich | Pakete, Reifegrad, Build, Befehle und Laufzeitprüfung | [ROS-2-Anleitung](robotics/ros-workspace.md) |
| Digitaler Zwilling | Gazebo, Umgebungen, ROS-Brücke und Verifikation | [Simulationsanleitung](robotics/simulation.md) |
| Navigation | SLAM, Kartenspeicherung, Nav2 und AMCL | [Navigationsanleitung](robotics/navigation.md) |
| Bedienoberflächen | Dashboard, API und Status der Qt-Bedienoberfläche | [Web-Dashboard](interfaces/dashboard.md) · [Qt/QML-HMI](interfaces/qt-hmi.md) |
| Embedded-System | Hardwaregrenze, fehlende Firmware und Integrationsanforderungen | [Implementierungsstand](embedded/implementation.md) |
| Missionsverwaltung | Validierung, deterministische Ausführung, Rückmeldung und Wiederherstellung | [Missionsarchitektur](mission-management/architecture.md) |
| Systemarchitektur | Mechanische, elektrische und softwareseitige Grenzen | [Architekturübersicht](system_architecture/architecture.md) |
| Systemschnittstellen | Bestätigte, vorgeschlagene und blockierte Entscheidungen | [Schnittstellentabelle](system_architecture/interfaces.md) |

## Systemmodell

<div class="system-flow" role="img" aria-label="Funktionsmodul über eine gemeinsame Schnittstelle mit der mobilen AMR-X-Basis verbunden">
  <div class="system-flow__node">
    <strong>Funktionsmodul</strong>
    <span>Aufgabenspezifische Mechanik, Sensorik und Steuerung</span>
  </div>
  <div class="system-flow__connector">
    <span>Mechanik · Energie · Daten · Sicherheit</span>
  </div>
  <div class="system-flow__node system-flow__node--base">
    <strong>Mobile AMR-X-Basis</strong>
    <span>Mobilität, Navigation, Basisenergie und Modulverwaltung</span>
  </div>
</div>

## Lokale Vorschau

=== "Nur Dokumentation"

    ```bash
    npm run setup:docs
    npm run docs
    ```

    Öffnen Sie <http://127.0.0.1:8001/>.

=== "Website und Dokumentation"

    ```bash
    npm run setup
    npm run dev
    ```

    Öffnen Sie <http://localhost:3000/docs/de/>.

Beide Modi behalten das automatische Neuladen von MkDocs beim Bearbeiten von
Markdown-Dateien bei.
