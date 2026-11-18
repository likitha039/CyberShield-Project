package com.cybershield.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsDto {
    private long totalIncidents;
    private long openIncidents;
    private long criticalIncidents;
    private long resolvedIncidents;
    private Map<String, Long> severityCounts;
    private Map<String, Long> statusCounts;
    private Map<String, Long> categoryCounts;
    private List<MonthlyCount> monthlyTrend;
    private List<IncidentDto> recentIncidents;

    public static class MonthlyCount {
        private String month;
        private long count;
        private long criticalCount;

        public MonthlyCount() {
        }

        public MonthlyCount(String month, long count, long criticalCount) {
            this.month = month;
            this.count = count;
            this.criticalCount = criticalCount;
        }

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public long getCount() {
            return count;
        }

        public void setCount(long count) {
            this.count = count;
        }

        public long getCriticalCount() {
            return criticalCount;
        }

        public void setCriticalCount(long criticalCount) {
            this.criticalCount = criticalCount;
        }
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

    public long getCriticalIncidents() {
        return criticalIncidents;
    }

    public void setCriticalIncidents(long criticalIncidents) {
        this.criticalIncidents = criticalIncidents;
    }

    public long getResolvedIncidents() {
        return resolvedIncidents;
    }

    public void setResolvedIncidents(long resolvedIncidents) {
        this.resolvedIncidents = resolvedIncidents;
    }

    public Map<String, Long> getSeverityCounts() {
        return severityCounts;
    }

    public void setSeverityCounts(Map<String, Long> severityCounts) {
        this.severityCounts = severityCounts;
    }

    public Map<String, Long> getStatusCounts() {
        return statusCounts;
    }

    public void setStatusCounts(Map<String, Long> statusCounts) {
        this.statusCounts = statusCounts;
    }

    public Map<String, Long> getCategoryCounts() {
        return categoryCounts;
    }

    public void setCategoryCounts(Map<String, Long> categoryCounts) {
        this.categoryCounts = categoryCounts;
    }

    public List<MonthlyCount> getMonthlyTrend() {
        return monthlyTrend;
    }

    public void setMonthlyTrend(List<MonthlyCount> monthlyTrend) {
        this.monthlyTrend = monthlyTrend;
    }

    public List<IncidentDto> getRecentIncidents() {
        return recentIncidents;
    }

    public void setRecentIncidents(List<IncidentDto> recentIncidents) {
        this.recentIncidents = recentIncidents;
    }
}
