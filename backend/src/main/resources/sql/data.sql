-- ==============================================================================
-- CyberShield Seed Data (Optional Demo Seed for MySQL)
-- Note: The DataSeeder component also initializes default roles and starter users
-- safely on first startup if the database is empty.
-- ==============================================================================

USE cybershield_db;

INSERT IGNORE INTO roles (name, description) VALUES
    ('ROLE_ADMIN', 'System administrator with full user, incident, assignment, and reporting access'),
    ('ROLE_ANALYST', 'Security analyst responsible for triaging, investigating, and resolving assigned incidents'),
    ('ROLE_EMPLOYEE', 'Organization employee authorized to report security incidents and track own submissions');
