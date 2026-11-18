package com.cybershield.config;

import com.cybershield.entity.*;
import com.cybershield.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentAssignmentRepository assignmentRepository;
    private final InvestigationNoteRepository noteRepository;
    private final IncidentHistoryRepository historyRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            RoleRepository roleRepository,
            UserRepository userRepository,
            IncidentRepository incidentRepository,
            IncidentAssignmentRepository assignmentRepository,
            InvestigationNoteRepository noteRepository,
            IncidentHistoryRepository historyRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.incidentRepository = incidentRepository;
        this.assignmentRepository = assignmentRepository;
        this.noteRepository = noteRepository;
        this.historyRepository = historyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Role adminRole = ensureRole(RoleName.ROLE_ADMIN, "System administrator with full access");
        Role analystRole = ensureRole(RoleName.ROLE_ANALYST, "Security analyst investigating incidents");
        Role employeeRole = ensureRole(RoleName.ROLE_EMPLOYEE, "Employee reporting security incidents");

        if (userRepository.count() > 0) {
            return;
        }

        User admin = createUser("Elena Vance", "admin@cybershield.io", "Admin@1234", "Security Operations", "CISO / Lead Admin", adminRole);
        User analyst1 = createUser("Marcus Chen", "analyst@cybershield.io", "Analyst@1234", "SOC Tier-2", "Senior Security Analyst", analystRole);
        User analyst2 = createUser("Priya Nair", "priya.nair@cybershield.io", "Analyst@1234", "Threat Intelligence", "Incident Responder", analystRole);
        User employee1 = createUser("David Miller", "employee@cybershield.io", "Employee@1234", "Finance", "Financial Controller", employeeRole);
        User employee2 = createUser("Sofia Alvarez", "sofia.alvarez@cybershield.io", "Employee@1234", "Engineering", "Platform Engineer", employeeRole);

        if (incidentRepository.count() == 0) {
            Incident inc1 = createIncident(
                    "INC-2026-0001",
                    "Suspicious Credential Harvesting Email Targeting Finance Team",
                    "Multiple Finance department employees received an email spoofing the payroll portal asking to re-verify MFA tokens via an external lookalike domain.",
                    IncidentCategory.PHISHING,
                    IncidentSeverity.HIGH,
                    IncidentStatus.UNDER_INVESTIGATION,
                    "O365 Exchange Gateway / Finance Mailboxes",
                    LocalDateTime.now().minusDays(3),
                    employee1
            );
            assign(inc1, analyst1, admin, "Prioritize email header forensics and domain blocklist.");
            addNote(inc1, analyst1, "Identified spoofed SPF alignment failure from 185.220.x.x relay. Purged 14 matching messages from user inboxes.", "Quarantined email campaign and blocked sender domain at SEG");

            Incident inc2 = createIncident(
                    "INC-2026-0002",
                    "Unauthorized SSH Brute-Force Attempts on Staging Bastion",
                    "Automated alerting flagged 4,200 failed root SSH login attempts against staging-bastion-01 over a 15-minute window.",
                    IncidentCategory.UNAUTHORIZED_ACCESS,
                    IncidentSeverity.CRITICAL,
                    IncidentStatus.IN_PROGRESS,
                    "staging-bastion-01.internal",
                    LocalDateTime.now().minusDays(1),
                    employee2
            );
            assign(inc2, analyst2, admin, "Verify fail2ban rules and confirm no successful key auth.");
            addNote(inc2, analyst2, "Audited /var/log/auth.log; zero successful authentications recorded. Applying geo-IP allowlist.", "Blocked offending ASN CIDR blocks on edge firewall");

            Incident inc3 = createIncident(
                    "INC-2026-0003",
                    "Unsigned Binary Execution Alert on Workstation FIN-LT-089",
                    "EDR quarantined a macro-dropped PowerShell payload launched from an invoice PDF attachment.",
                    IncidentCategory.MALWARE,
                    IncidentSeverity.CRITICAL,
                    IncidentStatus.REPORTED,
                    "FIN-LT-089 (Windows 11 Endpoint)",
                    LocalDateTime.now().minusHours(5),
                    employee1
            );

            Incident inc4 = createIncident(
                    "INC-2026-0004",
                    "Outdated OpenSSL Package Identified on Public API Proxy",
                    "Weekly vulnerability scan detected CVE exposure on reverse proxy node api-edge-03 requiring immediate patch window.",
                    IncidentCategory.VULNERABILITY,
                    IncidentSeverity.MEDIUM,
                    IncidentStatus.RESOLVED,
                    "api-edge-03.cybershield.io",
                    LocalDateTime.now().minusDays(9),
                    employee2
            );
            assign(inc4, analyst1, admin, "Coordinate rolling upgrade with Platform team.");
            addNote(inc4, analyst1, "Upgraded OpenSSL package to patched release and re-ran Qualys verification scan.", "Deployed patched container image across edge cluster");
        }
    }

    private Role ensureRole(RoleName name, String description) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(new Role(name, description)));
    }

    private User createUser(String fullName, String email, String rawPassword, String dept, String title, Role role) {
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        u.setDepartment(dept);
        u.setJobTitle(title);
        u.setRole(role);
        u.setActive(true);
        return userRepository.save(u);
    }

    private Incident createIncident(
            String code, String title, String desc,
            IncidentCategory category, IncidentSeverity severity, IncidentStatus status,
            String system, LocalDateTime occurredAt, User reporter) {
        Incident inc = new Incident();
        inc.setIncidentCode(code);
        inc.setTitle(title);
        inc.setDescription(desc);
        inc.setCategory(category);
        inc.setSeverity(severity);
        inc.setStatus(status);
        inc.setAffectedSystem(system);
        inc.setOccurredAt(occurredAt);
        inc.setReporter(reporter);
        inc.setReporterContact(reporter.getEmail());
        Incident saved = incidentRepository.save(inc);

        IncidentHistory h = new IncidentHistory();
        h.setIncident(saved);
        h.setChangedBy(reporter);
        h.setActionType("INCIDENT_CREATED");
        h.setFieldName("status");
        h.setNewValue(IncidentStatus.REPORTED.name());
        h.setDetails("Initial incident report submitted");
        historyRepository.save(h);
        return saved;
    }

    private void assign(Incident inc, User analyst, User admin, String notes) {
        IncidentAssignment a = new IncidentAssignment();
        a.setIncident(inc);
        a.setAnalyst(analyst);
        a.setAssignedBy(admin);
        a.setActive(true);
        a.setAssignmentNotes(notes);
        assignmentRepository.save(a);

        IncidentHistory h = new IncidentHistory();
        h.setIncident(inc);
        h.setChangedBy(admin);
        h.setActionType("ANALYST_ASSIGNED");
        h.setFieldName("assignedAnalyst");
        h.setOldValue("Unassigned");
        h.setNewValue(analyst.getFullName());
        h.setDetails(notes);
        historyRepository.save(h);
    }

    private void addNote(Incident inc, User author, String noteText, String actionTaken) {
        InvestigationNote note = new InvestigationNote();
        note.setIncident(inc);
        note.setAuthor(author);
        note.setNoteText(noteText);
        note.setActionTaken(actionTaken);
        noteRepository.save(note);
    }
}
