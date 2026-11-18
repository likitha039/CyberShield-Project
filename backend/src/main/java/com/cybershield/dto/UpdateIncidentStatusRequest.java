package com.cybershield.dto;

import com.cybershield.entity.IncidentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateIncidentStatusRequest {

    @NotNull(message = "Status is required")
    private IncidentStatus status;

    @Size(max = 500)
    private String note;

    public IncidentStatus getStatus() {
        return status;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
