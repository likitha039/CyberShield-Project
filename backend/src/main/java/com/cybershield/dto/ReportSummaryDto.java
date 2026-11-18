package com.cybershield.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ReportSummaryDto {
    private LocalDateTime generatedAt;
    private long totalIncidents;
    private long openIncidents;
    private long resolvedOrClosedIncidents;
    private double resolutionRatePercent;
    private Map<String, Long> bySeverity;
    private Map<String, Long> byStatus;
    private Map<String, Long> byCategory;
    private List<DashboardStatsDto.MonthlyCount> monthlyStatistics;

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public long getTotalIncidents() {
        return totalIncidents;
    }

    public void setTotalIncidents(long totalIncidents) {
        this.totalIncidents = totalIncidents;
    }

    public long getOpenIncidents() {
        return openIncidents;
    }

    public void setOpenIncidents(long openIncidents) {
        this.openIncidents = openIncidents;
    }

    public long getResolvedOrClosedIncidents() {
        return resolvedOrClosedIncidents;
    }

    public void setResolvedOrClosedIncidents(long resolvedOrClosedIncidents) {
        this.resolvedOrClosedIncidents = resolvedOrClosedIncidents;
    }

    public double getResolutionRatePercent() {
        return resolutionRatePercent;
    }

    public void setResolutionRatePercent(double resolutionRatePercent) {
        this.resolutionRatePercent = resolutionRatePercent;
    }

    public Map<String, Long> getBySeverity() {
        return bySeverity;
    }

    public void setBySeverity(Map<String, Long> bySeverity) {
        this.bySeverity = bySeverity;
    }

    public Map<String, Long> getByStatus() {
        return byStatus;
    }

    public void setByStatus(Map<String, Long> byStatus) {
        this.byStatus = byStatus;
    }

    public Map<String, Long> getByCategory() {
        return byCategory;
    }

    public void setByCategory(Map<String, Long> byCategory) {
        this.byCategory = byCategory;
    }

    public List<DashboardStatsDto.MonthlyCount> getMonthlyStatistics() {
        return monthlyStatistics;
    }

    public void setMonthlyStatistics(List<DashboardStatsDto.MonthlyCount> monthlyStatistics) {
        this.monthlyStatistics = monthlyStatistics;
    }
}
