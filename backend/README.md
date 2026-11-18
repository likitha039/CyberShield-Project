# CyberShield Backend (Spring Boot + MySQL)

## Tech Stack
- Java 17
- Spring Boot 3.3.5 (Web, Data JPA, Security, Validation)
- Hibernate ORM 6 + MySQL Connector/J
- JJWT 0.12.6 (Stateless Bearer JWT)
- SpringDoc OpenAPI 2.6.0 (Swagger UI)

## Running Locally
1. Copy `src/main/resources/application.properties.example` to `src/main/resources/application.properties` and set your MySQL username/password.
2. Execute the schema script:
   ```bash
   mysql -u root -p < src/main/resources/sql/schema.sql
   ```
3. Build and run with Maven:
   ```bash
   mvn clean package
   mvn spring-boot:run
   ```
4. Verify Swagger UI at `http://localhost:8080/swagger-ui.html`.
