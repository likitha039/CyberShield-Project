package com.cybershield.controller;

import com.cybershield.dto.ReportSummaryDto;
import com.cybershield.security.CustomUserDetails;
import com.cybershield.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<ReportSummaryDto> getSummaryReport(@AuthenticationPrincipal CustomUserDetails currentUser) {
        String role = currentUser.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_EMPLOYEE");
        return ResponseEntity.ok(reportService.generateSummaryReport(currentUser.getId(), role));
    }
}
