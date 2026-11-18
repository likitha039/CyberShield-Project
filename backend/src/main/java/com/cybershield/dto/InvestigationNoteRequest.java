package com.cybershield.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class InvestigationNoteRequest {

    @NotBlank(message = "Investigation note text is required")
    @Size(min = 5, message = "Note must be at least 5 characters")
    private String noteText;

    @Size(max = 500)
    private String actionTaken;

    public String getNoteText() {
        return noteText;
    }

    public void setNoteText(String noteText) {
        this.noteText = noteText;
    }

    public String getActionTaken() {
        return actionTaken;
    }

    public void setActionTaken(String actionTaken) {
        this.actionTaken = actionTaken;
    }
}
