# YIPL Library Management API

A simple RESTful API for managing books and authors, built with Node.js and SQLite without any frameworks. The API provides CRUD operations with validation, query parameters, and Swagger documentation at /docs.

---

## Getting Started

### Prerequisites

- Node.js v20 or higher
- npm
- Docker (optional, for containerized setup)

---

### Local Setup
    git clone <repo-url>
    cd yipl-backend-2025
    npm ci
    npm run migrate    # create database schema
    npm run seed      # insert sample authors + books
    npm start

---

### Using Docker

    docker-compose build
    docker-compose up

**Notes:**

- The SQLite database (`library.sqlite`) is persisted in a Docker volume (`db_data`).
- If starting fresh, run migrations + seed manually inside the container:

      docker exec -it yipl-backend-2025-app npm run migrate
      docker exec -it yipl-backend-2025-app npm run seed
- The API will be accessible at http://localhost:3000
- To force a full rebuild without cache, you can run:
docker-compose build --no-cache
---

## Environment Variables

This project supports configuration via `.env`.Create it in the project root to override defaults.

### Available variables:

      PORT=3000
      NODE_ENV=development
      DB_PATH=./data/library.sqlite
      TEST_DB_PATH=./data/library.test.sqlite

---

## Running Tests

Unit tests cover validation, controllers, and query parameters.The test database comes with preseeded test data.

Note: For running tests, you need to manually set NODE_ENV=test to use the test database (library.test.sqlite).

    npm run migrate // Migration on test db
    npm run seed // Preloaded test data
    npm test

---

## Swagger/OpenAPI

Swagger documentation is available at:  
 (http://localhost:3000/docs)

Includes:

- Endpoint descriptions
- Request/response schemas
- Example responses

---
