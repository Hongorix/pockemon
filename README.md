# Pokemon Collections App

A full-stack web app for building custom Pokemon collections with strict validation rules, persistent storage, and import/export support.

## Tech Stack

- **Backend:** NestJS (TypeScript)
- **Frontend:** React + TanStack Router + TanStack Query + TailwindCSS v4
- **Database:** MongoDB
- **Infra:** Docker Compose

## Why this stack

- **NestJS** provides a clean modular architecture for REST endpoints, DTO validation, and business rule enforcement.
- **TanStack Router + Query** gives explicit route structure and resilient server-state handling for catalogue browsing and saved lists.
- **MongoDB + Mongoose** fits document-based list storage and keeps item arrays simple to model.
- **Docker Compose** enables fast local startup with one command and no manual DB setup.

## Features implemented

1. **Main page**
   - Shows all saved lists
   - Includes "Create New List" action

2. **Create list page**
   - Browse Pokemon catalogue fetched from PokeAPI via backend proxy
   - Search by Pokemon name
   - Select Pokemon with quantity controls
   - Upload previously exported list file

3. **Saved list detail page**
   - View saved list contents
   - Download list as JSON file

4. **Validation rules (enforced before save)**
   - Minimum **3 different species**
   - Total weight must be **<= 1300 hectograms**
   - Clear human-readable validation messages from both frontend pre-checks and backend API responses

## API Endpoints

- `GET /` - health status
- `GET /pokemon?page=1&limit=20&search=bulbasaur` - paginated or searched Pokemon catalogue
- `GET /collections` - list saved collections
- `GET /collections/:id` - collection details
- `POST /collections` - create collection

Request body for `POST /collections`:

```json
{
  "name": "Kanto Trio",
  "items": [
    {
      "pokemonId": 1,
      "name": "bulbasaur",
      "species": "bulbasaur",
      "weight": 69,
      "imageUrl": "https://..."
    }
  ]
}
```

## Import/Export file format

Downloaded files use this format:

```json
{
  "version": 1,
  "name": "My Team",
  "items": [
    {
      "pokemonId": 25,
      "name": "pikachu",
      "species": "pikachu",
      "weight": 60,
      "imageUrl": "https://..."
    }
  ]
}
```

Uploaded files are validated on the client before being loaded into the Create page.

## Run locally with Docker (recommended)

```bash
docker compose up --build
```

This setup uses a single root `Dockerfile` with dedicated build targets for backend and frontend.

Apps:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:3000](http://localhost:3000)
- MongoDB: `mongodb://localhost:27017`

## Run locally without Docker

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### 3) Database

Run MongoDB locally (or with Docker):

```bash
docker run --rm -p 27017:27017 mongo:7
```

## Verification checklist

- [x] Create a valid list and save it
- [x] Attempt invalid list (<3 species) and see rejection
- [x] Attempt overweight list (>1300) and see rejection
- [x] Open saved list details
- [x] Download saved list file
- [x] Upload saved file in Create page and recreate selection

## Scripts

From root:

```bash
npm run lint
npm run build
npm run test
```
