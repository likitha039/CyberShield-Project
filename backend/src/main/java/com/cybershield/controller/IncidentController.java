package com.cybershield.controller;

import com.cybershield.dto.*;
import com.cybershield.entity.IncidentCategory;
import com.cybershield.entity.IncidentSeverity;
import com.cybershield.entity.IncidentStatus;
import com.cybershield.security.CustomUserDetails;
import com.cybershield.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public ResponseEntity<List<IncidentDto>> getIncidents(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) IncidentSeverity severity,
            @RequestParam(required = false) IncidentCategory category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean assignedToMe) {

        String role = extractRole(currentUser);
        return ResponseEntity.ok(
                incidentService.getIncidents(
                        currentUser.getId(),
                        role,
                        status,
                        severity,
                        category,
                        search,
                        assignedToMe
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentDto> getIncidentById(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(incidentService.getIncidentById(id, currentUser.getId(), extractRole(currentUser)));
    }

    @PostMapping
    public ResponseEntity<IncidentDto> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(incidentService.createIncident(request, currentUser.getId()));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<IncidentDto> assignAnalyst(
            @PathVariable Long id,
            @Valid @RequestBody AssignIncidentRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(incidentService.assignAnalyst(id, request, currentUser.getId()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<IncidentDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidentStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(incidentService.updateStatus(id, request, currentUser.getId()));
    }

    @PatchMapping("/{id}/severity")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<IncidentDto> updateSeverity(
            @PathVariable Long id,
            @Valid @RequestBody UpdateIncidentSeverityRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(incidentService.updateSeverity(id, request, currentUser.getId()));
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<List<InvestigationNoteDto>> getNotes(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(
                incidentService.getInvestigationNotes(id, currentUser.getId(), extractRole(currentUser))
        );
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<InvestigationNoteDto> addNote(
            @PathVariable Long id,
            @Valid @RequestBody InvestigationNoteRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(incidentService.addInvestigationNote(id, request, currentUser.getId()));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<IncidentHistoryDto>> getHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(
                incidentService.getIncidentHistory(id, currentUser.getId(), extractRole(currentUser))
        );
    }

    private String extractRole(CustomUserDetails user) {
        return user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_EMPLOYEE");
    }
}
