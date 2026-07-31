# Documentation technique AMR-X

<div class="docs-intro-layout">
  <div class="docs-intro-copy">
    <span class="docs-intro-status">Plateforme en phase d’ingénierie</span>
    <p>AMR-X est une plateforme robotique autonome et modulaire dans laquelle une base mobile intérieure réutilisable reçoit des modules fonctionnels interchangeables via une interface d’arrimage commune. Cette documentation relie l’architecture, les travaux d’implémentation, les interfaces et les preuves de validation.</p>
    <strong class="docs-intro-summary-title">Une plateforme coordonnée entre plusieurs disciplines</strong>
    <ul class="docs-intro-points">
      <li><strong>Fondation mobile</strong><span>Mobilité, capteurs, calcul, alimentation de base et coordination de sécurité.</span></li>
      <li><strong>Interface module commune</strong><span>Interfaces mécaniques, électriques, données, identification et état définis.</span></li>
      <li><strong>ROS 2 et jumeau numérique</strong><span>Descriptions, simulation, cartographie, localisation, Nav2 et tests reproductibles.</span></li>
      <li><strong>Missions et outils opérateur</strong><span>État de mission partagé entre supervision distante et IHM locale.</span></li>
    </ul>
  </div>

<figure class="docs-intro-visual">
  <img src="/docs/assets/images/reference-amr-x-concept-illustration.png" alt="Illustration du concept de plateforme modulaire AMR-X">
  <figcaption>
    <span class="docs-intro-visual__label">Introduction au concept</span>
    <strong>Orientation de la plateforme mobile modulaire</strong>
    <span>Support visuel pour présenter le concept AMR-X ; il ne s'agit pas d'une géométrie de production finalisée.</span>
  </figcaption>
</figure>
</div>

!!! note "Données d'ingénierie contrôlées"
    Les spécifications numériques, exigences, nomenclatures et décisions sur
    les modules restent dans les fichiers JSON et CSV contrôlés du dépôt. La
    documentation explique le système et renvoie vers ces sources ; elle ne
    constitue pas une seconde source de vérité.

## Carte de référence technique

| Domaine | Objectif | Documentation |
|---|---|---|
| Référence actuelle | Périmètre consolidé, objectifs actifs et principes d'architecture | [Référence du projet](project/baseline.md) |
| Activités d'ingénierie | Responsabilités stables et livrables attendus | [Vue d'ensemble](project/workstreams.md) |
| Espace ROS 2 | Paquets, maturité, compilation, commandes et inspection | [Guide ROS 2](robotics/ros-workspace.md) |
| Jumeau numérique | Gazebo, environnements, pont ROS et vérification | [Guide de simulation](robotics/simulation.md) |
| Navigation | SLAM, sauvegarde de carte, Nav2 et AMCL | [Guide de navigation](robotics/navigation.md) |
| Interfaces opérateur | Tableau de bord, API et état de l'IHM Qt | [Tableau de bord](interfaces/dashboard.md) · [IHM Qt/QML](interfaces/qt-hmi.md) |
| Système embarqué | Limite matérielle, micrologiciel manquant et exigences d'intégration | [État de l'implémentation](embedded/implementation.md) |
| Gestion des missions | Validation, exécution déterministe, retour d'état et reprise | [Architecture des missions](mission-management/architecture.md) |
| Architecture système | Limites mécaniques, électriques et logicielles | [Vue d'ensemble](system_architecture/architecture.md) |
| Interfaces système | Décisions confirmées, proposées ou bloquées | [Tableau des interfaces](system_architecture/interfaces.md) |

## Modèle du système

<div class="system-flow" role="img" aria-label="Module fonctionnel relié à la base mobile AMR-X par une interface commune">
  <div class="system-flow__node">
    <strong>Module fonctionnel</strong>
    <span>Mécanique, perception et commande propres à la tâche</span>
  </div>
  <div class="system-flow__connector">
    <span>Interface mécanique · alimentation · données · sécurité</span>
  </div>
  <div class="system-flow__node system-flow__node--base">
    <strong>Base mobile AMR-X</strong>
    <span>Mobilité, navigation, alimentation de base et gestion des modules</span>
  </div>
</div>

## Aperçu local

=== "Documentation uniquement"

    ```bash
    npm run setup:docs
    npm run docs
    ```

    Ouvrez <http://127.0.0.1:8001/>.

=== "Site web et documentation"

    ```bash
    npm run setup
    npm run dev
    ```

    Ouvrez <http://localhost:3000/docs/fr/>.

Les deux modes conservent le rechargement automatique de MkDocs pendant la
modification des fichiers Markdown.
