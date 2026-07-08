# AMR-X Backend API

Backend du dashboard de contrôle du robot AMR-X.

## Stack Technique
- Framework : FastAPI (Python)
- Base de données : PostgreSQL
- ORM : SQLAlchemy
- Architecture : MVC

## Structure du Projet
app/
├── models/       → Structure des tables PostgreSQL
├── schemas/      → Format JSON entrée/sortie
├── controllers/  → Logique métier
├── routers/      → Routes API
└── db/           → Connexion base de données

## Installation

### 1. Cloner le projet
git clone <lien-du-repo>
cd backend

### 2. Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

### 3. Configurer le .env
Créer un fichier .env :
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost/amr
DEBUG=True

### 4. Lancer le serveur
python3 -m uvicorn app.main:app --reload

## Routes API
- GET  /api/robots              → Liste des robots
- POST /api/robots              → Ajouter un robot
- GET  /api/missions            → Liste des missions
- POST /api/missions            → Créer une mission
- DELETE /api/missions/{id}     → Supprimer une mission
- GET  /api/modules             → Liste des modules
- PUT  /api/modules/{id}/toggle → Activer/désactiver un module
- GET  /api/alerts              → Liste des alertes
- PUT  /api/alerts/{id}/resolve → Résoudre une alerte
- GET  /api/users               → Liste des utilisateurs
- POST /api/users               → Créer un utilisateur

## Documentation Swagger
http://localhost:8000/docs

