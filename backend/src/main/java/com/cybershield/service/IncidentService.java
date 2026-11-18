package com.cybershield.service;

import com.cybershield.dto.*;
import com.cybershield.entity.*;
import com.cybershield.exception.BadRequestException;
import com.cybershield.exception.ResourceNotFoundException;
import com.cybershield.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final IncidentAssignmentRepository assignmentRepository;
    private final InvestigationNoteRepository noteRepository;
    private final IncidentHistoryRepository historyRepository;

    public IncidentService(
            IncidentRepository incidentRepository,
            UserRepository userRepository,
            IncidentAssignmentRepository assignmentRepository,
            InvestigationNoteRepository noteRepository,
            IncidentHistoryRepository historyRepository) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.noteRepository = noteRepository;
        this.historyRepository = historyRepository;
    }

    @Transactional(readOnly = true)
    public List<IncidentDto> getIncidents(
            Long currentUserId,
            String roleName,
            IncidentStatus status,
            IncidentSeverity severity,
            IncidentCategory category,
            String search,
            boolean assignedToMeOnly) {

        Long reporterFilter = "ROLE_EMPLOYEE".equals(roleName) ? currentUserId : null;
        Long analystFilter = ("ROLE_ANALYST".equals(roleName) && assignedToMeOnly) ? currentUserId : null;

        return incidentRepository.searchIncidents(
                        reporterFilter,
                        analystFilter,
                        status,
                        severity,
                        category,
                        search != null ? search.trim() : null
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public IncidentDto getIncidentById(Long incidentId, Long currentUserId, String roleName) {
        Incident incident = findIncidentOrThrow(incidentId);
        enforceReadAccess(incident, currentUserId, roleName);
        return toDto(incident);
    }

    @Transactional
    public IncidentDto createIncident(CreateIncidentRequest request, Long reporterId) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new ResourceNotFoundException("Reporter user not found."));

        Incident incident = new Incident();
        incident.setIncidentCode(generateIncidentCode());
        incident.setTitle(request.getTitle().trim());
        incident.setDescription(request.getDescription().trim());
        incident.setCategory(request.getCategory());
        incident.setSeverity(request.getSeverity());
        incident.setStatus(IncidentStatus.REPORTED);
        incident.setAffectedSystem(request.getAffectedSystem().trim());
        incident.setOccurredAt(request.getOccurredAt());
        incident.setReporter(reporter);
        incident.setReporterContact(
                request.getReporterContact() != null && !request.getReporterContact().isBlank()
                        ? request.getReporterContact().trim()
                        : reporter.getEmail()
        );

        Incident saved = incidentRepository.save(incident);

        recordHistory(
                saved,
                reporter,
                "INCIDENT_CREATED",
                "status",
                null,
                IncidentStatus.REPORTED.name(),
                "Incident submitted with severity " + saved.getSeverity().name()
        );

        return toDto(saved);
    }

    @Transactional
    public IncidentDto assignAnalyst(Long incidentId, AssignIncidentRequest request, Long adminId) {
        Incident incident = findIncidentOrThrow(incidentId);
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found."));
        User analyst = userRepository.findById(request.getAnalystId())
                .orElseThrow(() -> new ResourceNotFoundException("Analyst not found with ID: " + request.getAnalystId()));

        if (analyst.getRole().getName() != RoleName.ROLE_ANALYST) {
            throw new BadRequestException("Selected user does not hold the Security Analyst role.");
        }
        if (!analyst.isActive()) {
            throw new BadRequestException("Cannot assign an incident to a deactivated analyst account.");
        }

        Optional<IncidentAssignment> currentActive = assignmentRepository
                .findFirstByIncidentIdAndActiveTrueOrderByAssignedAtDesc(incidentId);
        String previousAnalystName = currentActive.map(a -> a.getAnalyst().getFullName()).orElse("Unassigned");

        // Deactivate previous assignments
        List<IncidentAssignment> activeAssignments = assignmentRepository.findByIncidentIdAndActiveTrue(incidentId);
        for (IncidentAssignment existing : activeAssignments) {
            existing.setActive(false);
        }
        assignmentRepository.saveAll(activeAssignments);

        IncidentAssignment assignment = new IncidentAssignment();
        assignment.setIncident(incident);
        assignment.setAnalyst(analyst);
        assignment.setAssignedBy(admin);
        assignment.setActive(true);
        assignment.setAssignmentNotes(request.getAssignmentNotes());
        assignmentRepository.save(assignment);

        if (incident.getStatus() == IncidentStatus.REPORTED) {
            String oldStatus = incident.getStatus().name();
            incident.setStatus(IncidentStatus.UNDER_INVESTIGATION);
            incidentRepository.save(incident);
            recordHistory(
                    incident,
                    admin,
                    "STATUS_CHANGED",
                    "status",
                    oldStatus,
                    IncidentStatus.UNDER_INVESTIGATION.name(),
                    "Automatically transitioned upon analyst assignment"
            );
        }

        recordHistory(
                incident,
                admin,
                "ANALYST_ASSIGNED",
                "assignedAnalyst",
                previousAnalystName,
                analyst.getFullName(),
                request.getAssignmentNotes() != null ? request.getAssignmentNotes() : "Assigned to " + analyst.getFullName()
        );

        return toDto(incident);
    }

    @Transactional
    public IncidentDto updateStatus(Long incidentId, UpdateIncidentStatusRequest request, Long actorId) {
        Incident incident = findIncidentOrThrow(incidentId);
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor user not found."));

        String oldStatus = incident.getStatus().name();
        String newStatus = request.getStatus().name();

        if (!oldStatus.equals(newStatus)) {
            incident.setStatus(request.getStatus());
            incidentRepository.save(incident);

            recordHistory(
                    incident,
                    actor,
                    "STATUS_CHANGED",
                    "status",
                    oldStatus,
                    newStatus,
                    request.getNote() != null ? request.getNote() : "Status updated from " + oldStatus + " to " + newStatus
            );
        }

        return toDto(incident);
    }

    @Transactional
    public IncidentDto updateSeverity(Long incidentId, UpdateIncidentSeverityRequest request, Long actorId) {
        Incident incident = findIncidentOrThrow(incidentId);
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor user not found."));

        String oldSeverity = incident.getSeverity().name();
        String newSeverity = request.getSeverity().name();

        if (!oldSeverity.equals(newSeverity)) {
            incident.setSeverity(request.getSeverity());
            incidentRepository.save(incident);

            recordHistory(
                    incident,
                    actor,
                    "SEVERITY_CHANGED",
                    "severity",
                    oldSeverity,
                    newSeverity,
                    request.getReason() != null ? request.getReason() : "Severity adjusted from " + oldSeverity + " to " + newSeverity
            );
        }

        return toDto(incident);
    }

    @Transactional(readOnly = true)
    public List<InvestigationNoteDto> getInvestigationNotes(Long incidentId, Long currentUserId, String roleName) {
        Incident incident = findIncidentOrThrow(incidentId);
        enforceReadAccess(incident, currentUserId, roleName);

        return noteRepository.findByIncidentIdOrderByCreatedAtDesc(incidentId)
                .stream()
                .map(this::toNoteDto)
                .toList();
    }

    @Transactional
    public InvestigationNoteDto addInvestigationNote(Long incidentId, InvestigationNoteRequest request, Long authorId) {
        Incident incident = findIncidentOrThrow(incidentId);
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author user not found."));

        InvestigationNote note = new InvestigationNote();
        note.setIncident(incident);
        note.setAuthor(author);
        note.setNoteText(request.getNoteText().trim());
        note.setActionTaken(request.getActionTaken() != null ? request.getActionTaken().trim() : null);

        InvestigationNote saved = noteRepository.save(note);

        String detail = request.getActionTaken() != null && !request.getActionTaken().isBlank()
                ? "Action recorded: " + request.getActionTaken().trim()
                : "Investigation note added";

        recordHistory(
                incident,
                author,
                "NOTE_ADDED",
                "investigationNotes",
                null,
                "Note #" + saved.getId(),
                detail
        );

        return toNoteDto(saved);
    }

    @Transactional(readOnly = true)
    public List<IncidentHistoryDto> getIncidentHistory(Long incidentId, Long currentUserId, String roleName) {
        Incident incident = findIncidentOrThrow(incidentId);
        enforceReadAccess(incident, currentUserId, roleName);

        return historyRepository.findByIncidentIdOrderByChangedAtDesc(incidentId)
                .stream()
                .map(this::toHistoryDto)
                .toList();
    }

    private Incident findIncidentOrThrow(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with ID: " + id));
    }

    private void enforceReadAccess(Incident incident, Long currentUserId, String roleName) {
        if ("ROLE_EMPLOYEE".equals(roleName) && !incident.getReporter().getId().equals(currentUserId)) {
            throw new AccessDeniedException("Employees can only view incidents they reported.");
        }
    }

    private void recordHistory(
            Incident incident,
            User changedBy,
            String actionType,
            String fieldName,
            String oldValue,
            String newValue,
            String details) {
        IncidentHistory history = new IncidentHistory();
        history.setIncident(incident);
        history.setChangedBy(changedBy);
        history.setActionType(actionType);
        history.setFieldName(fieldName);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        history.setDetails(details);
        historyRepository.save(history);
    }

    private String generateIncidentCode() {
        long count = incidentRepository.count() + 1;
        return String.format("INC-%d-%04d", Year.now().getValue(), count);
    }

    public IncidentDto toDto(Incident incident) {
        IncidentDto dto = new IncidentDto();
        dto.setId(incident.getId());
        dto.setIncidentCode(incident.getIncidentCode());
        dto.setTitle(incident.getTitle());
        dto.setDescription(incident.getDescription());
        dto.setCategory(incident.getCategory());
        dto.setSeverity(incident.getSeverity());
        dto.setStatus(incident.getStatus());
        dto.setAffectedSystem(incident.getAffectedSystem());
        dto.setOccurredAt(incident.getOccurredAt());
        dto.setReporterId(incident.getReporter().getId());
        dto.setReporterName(incident.getReporter().getFullName());
        dto.setReporterEmail(incident.getReporter().getEmail());
        dto.setReporterDepartment(incident.getReporter().getDepartment());
        dto.setReporterContact(incident.getReporterContact());
        dto.setCreatedAt(incident.getCreatedAt());
        dto.setUpdatedAt(incident.getUpdatedAt());

        assignmentRepository.findFirstByIncidentIdAndActiveTrueOrderByAssignedAtDesc(incident.getId())
                .ifPresent(assignment -> {
                    dto.setAssignedAnalystId(assignment.getAnalyst().getId());
                    dto.setAssignedAnalystName(assignment.getAnalyst().getFullName());
                    dto.setAssignedAnalystEmail(assignment.getAnalyst().getEmail());
                    dto.setAssignedAt(assignment.getAssignedAt());
                });

        return dto;
    }

    private InvestigationNoteDto toNoteDto(InvestigationNote note) {
        InvestigationNoteDto dto = new InvestigationNoteDto();
        dto.setId(note.getId());
        dto.setIncidentId(note.getIncident().getId());
        dto.setAuthorId(note.getAuthor().getId());
        dto.setAuthorName(note.getAuthor().getFullName());
        dto.setAuthorRole(note.getAuthor().getRole().getName().name());
        dto.setNoteText(note.getNoteText());
        dto.setActionTaken(note.getActionTaken());
        dto.setCreatedAt(note.getCreatedAt());
        return dto;
    }

    private IncidentHistoryDto toHistoryDto(IncidentHistory history) {
        IncidentHistoryDto dto = new IncidentHistoryDto();
        dto.setId(history.getId());
        dto.setIncidentId(history.getIncident().getId());
        dto.setChangedById(history.getChangedBy().getId());
        dto.setChangedByName(history.getChangedBy().getFullName());
        dto.setChangedByRole(history.getChangedBy().getRole().getName().name());
        dto.setActionType(history.getActionType());
        dto.setFieldName(history.getFieldName());
        dto.setOldValue(history.getOldValue());
        dto.setNewValue(history.getNewValue());
        dto.setDetails(history.getDetails());
        dto.setChangedAt(history.getChangedAt());
        return dto;
    }
}
