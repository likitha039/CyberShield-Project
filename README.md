# CyberShield — Cybersecurity Incident Management System

CyberShield is a full-stack enterprise cybersecurity incident management, triage, investigation, and reporting platform built with **React**, **Java 17 + Spring Boot 3**, **Spring Security (JWT + BCrypt)**, **Spring Data JPA / Hibernate**, and **MySQL 8**.

---

## Project Structure

```text
cybershield/
├── backend/                        # Java 17 + Spring Boot 3.3.5 + Maven project
│   ├── pom.xml
│   ├── README.md
│   └── src/main/
│       ├── java/com/cybershield/
│       │   ├── CyberShieldApplication.java
│       │   ├── config/             # DataSeeder (roles & starter accounts)
│       │   ├── controller/         # Auth, User, Incident, Dashboard, Report REST APIs
│       │   ├── dto/                # Request/Response DTOs with Jakarta Validation
│       │   ├── entity/             # JPA entities (6 MySQL tables + enums)
│       │   ├── exception/          # GlobalExceptionHandler & custom exceptions
│       │   ├── repository/         # Spring Data JPA repositories & JPQL queries
│       │   ├── security/           # JWT provider, filter, UserDetailsService, SecurityConfig
│       │   └── service/            # Business logic & @Transactional audit logging
│       └── resources/
│           ├── application.properties
│           ├── application.properties.example
│           └── sql/
│               ├── schema.sql      # MySQL 8 DDL (6 normalized tables)
│               └── data.sql        # Role seed script
├── frontend/                       # Standalone React + Vite + Tailwind CSS project
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── components/             # Dashboard, Incidents, Report Form, Drawer, Users, Reports, Docs
│       ├── data/demoData.ts        # Client-side sample data (Demonstration Mode only)
│       ├── services/apiClient.ts   # Spring Boot REST client + explicit Demo Mode switch
│       └── types/index.ts
├── API_DOCUMENTATION.md            # Complete REST API & RBAC reference
└── README.md
```

---

## Environment Execution Notice

- **What runs in this cloud preview sandbox**: The **React frontend** (`frontend/`) builds and runs live in Node.js. Because JDK, Maven, and MySQL are not installed in this container, the UI starts in **Demonstration Mode (Client-Side Sample Data)** so you can explore every screen, role, chart, and workflow immediately.
- **What runs locally on your machine**: The complete **Java Spring Boot Maven backend (`backend/`)** and **MySQL database (`schema.sql`)**. When running locally, switch the login toggle from **Demonstration Mode** to **Spring Boot API** (`http://localhost:8080/api`).

---

## Local Setup & Execution Guide

### Prerequisites
- **Java JDK 17+** (`java -version`)
- **Apache Maven 3.9+** (`mvn -version`)
- **MySQL 8.0+** (`mysql --version`)
- **Node.js 20+ & npm** (`node -v`)

### Step 1: Initialize MySQL Database
1. Start your MySQL server.
2. Create the database and schema:
   ```bash
   mysql -u root -p < backend/src/main/resources/sql/schema.sql
   mysql -u root -p < backend/src/main/resources/sql/data.sql
   ```
3. Configure credentials in `backend/src/main/resources/application.properties` (copied from `application.properties.example`), or export environment variables:
   ```bash
   export DB_URL="jdbc:mysql://localhost:3306/cybershield_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
   export DB_USERNAME="root"
   export DB_PASSWORD="your_mysql_password"
   ```

### Step 2: Run the Java Spring Boot Backend
```bash
cd backend
mvn clean spring-boot:run
```
- The REST API starts on `http://localhost:8080`.
- Swagger / OpenAPI UI is available at `http://localhost:8080/swagger-ui.html`.
- On first startup against an empty `users` table, `DataSeeder` safely seeds the 3 roles, starter users (with BCrypt-hashed passwords), and initial sample incidents in MySQL.

### Step 3: Run the React Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:3000`.
- Select **Spring Boot API** in the Data Source Mode selector on the login page to authenticate directly against MySQL via Spring Security JWT.
- Optional: set `VITE_API_BASE_URL=http://localhost:8080/api` in `frontend/.env`.

---

## Starter Accounts (Seeded by `DataSeeder` & Available in Demo Mode)

| Role | Email | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cybershield.io` | `Admin@1234` | Manage users, view all incidents, assign analysts, update status/severity, view reports |
| **Security Analyst** | `analyst@cybershield.io` | `Analyst@1234` | View all & assigned incidents, add investigation notes & actions taken, update status/severity, view reports |
| **Employee** | `employee@cybershield.io` | `Employee@1234` | Report new security incidents, track own submitted incidents and timeline |
