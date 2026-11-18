package com.cybershield.dto;

import com.cybershield.entity.IncidentSeverity;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateIncidentSeverityRequest {

    @NotNull(message = "Severity is required")
    private IncidentSeverity severity;

    @Size(max = 500)
    private String reason;

    public IncidentSeverity getSeverity() {
        return severity;
    }

    public void setSeverity(IncidentSeverity severity) {
        this.severity = severity;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
