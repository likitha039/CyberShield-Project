package com.cybershield.dto;

import com.cybershield.entity.IncidentCategory;
import com.cybershield.entity.IncidentSeverity;
import com.cybershield.entity.IncidentStatus;

import java.time.LocalDateTime;

public class IncidentDto {
    private Long id;
    private String incidentCode;
    private String title;
    private String description;
    private IncidentCategory category;
    private IncidentSeverity severity;
    private IncidentStatus status;
    private String affectedSystem;
    private LocalDateTime occurredAt;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private String reporterDepartment;
    private String reporterContact;
    private Long assignedAnalystId;
    private String assignedAnalystName;
    private String assignedAnalystEmail;
    private LocalDateTime assignedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIncidentCode() {
        return incidentCode;
    }

    public void setIncidentCode(String incidentCode) {
        this.incidentCode = incidentCode;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public IncidentCategory getCategory() {
        return category;
    }

    public void setCategory(IncidentCategory category) {
        this.category = category;
    }

    public IncidentSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(IncidentSeverity severity) {
        this.severity = severity;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public String getAffectedSystem() {
        return affectedSystem;
    }

    public void setAffectedSystem(String affectedSystem) {
        this.affectedSystem = affectedSystem;
    }

    public LocalDateTime getOccurredAt() {
        return occurredAt;
    }

    public void setOccurredAt(LocalDateTime occurredAt) {
        this.occurredAt = occurredAt;
    }

    public Long getReporterId() {
        return reporterId;
    }

    public void setReporterId(Long reporterId) {
        this.reporterId = reporterId;
    }

    public String getReporterName() {
        return reporterName;
    }

    public void setReporterName(String reporterName) {
        this.reporterName = reporterName;
    }

    public String getReporterEmail() {
        return reporterEmail;
    }

    public void setReporterEmail(String reporterEmail) {
        this.reporterEmail = reporterEmail;
    }

    public String getReporterDepartment() {
        return reporterDepartment;
    }

    public void setReporterDepartment(String reporterDepartment) {
        this.reporterDepartment = reporterDepartment;
    }

    public String getReporterContact() {
        return reporterContact;
    }

    public void setReporterContact(String reporterContact) {
        this.reporterContact = reporterContact;
    }

    public Long getAssignedAnalystId() {
        return assignedAnalystId;
    }

    public void setAssignedAnalystId(Long assignedAnalystId) {
        this.assignedAnalystId = assignedAnalystId;
    }

    public String getAssignedAnalystName() {
        return assignedAnalystName;
    }

    public void setAssignedAnalystName(String assignedAnalystName) {
        this.assignedAnalystName = assignedAnalystName;
    }

    public String getAssignedAnalystEmail() {
        return assignedAnalystEmail;
    }

    public void setAssignedAnalystEmail(String assignedAnalystEmail) {
        this.assignedAnalystEmail = assignedAnalystEmail;
    }

    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
