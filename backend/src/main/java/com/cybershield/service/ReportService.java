package com.cybershield.service;

import com.cybershield.dto.DashboardStatsDto;
import com.cybershield.dto.ReportSummaryDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ReportService {

    private final DashboardService dashboardService;

    public ReportService(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Transactional(readOnly = true)
    public ReportSummaryDto generateSummaryReport(Long currentUserId, String roleName) {
        DashboardStatsDto stats = dashboardService.getDashboardStats(currentUserId, roleName);

        ReportSummaryDto report = new ReportSummaryDto();
        report.setGeneratedAt(LocalDateTime.now());
        report.setTotalIncidents(stats.getTotalIncidents());
        report.setOpenIncidents(stats.getOpenIncidents());
        report.setResolvedOrClosedIncidents(stats.getResolvedIncidents());

        double rate = stats.getTotalIncidents() == 0
                ? 0.0
                : Math.round(((double) stats.getResolvedIncidents() / stats.getTotalIncidents()) * 1000.0) / 10.0;
        report.setResolutionRatePercent(rate);

        report.setBySeverity(stats.getSeverityCounts());
        report.setByStatus(stats.getStatusCounts());
        report.setByCategory(stats.getCategoryCounts());
        report.setMonthlyStatistics(stats.getMonthlyTrend());
        return report;
    }
}
