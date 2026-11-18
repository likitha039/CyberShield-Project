package com.cybershield.service;

import com.cybershield.dto.DashboardStatsDto;
import com.cybershield.dto.IncidentDto;
import com.cybershield.entity.*;
import com.cybershield.repository.IncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DashboardService {

    private final IncidentRepository incidentRepository;
    private final IncidentService incidentService;

    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM yyyy");

    public DashboardService(IncidentRepository incidentRepository, IncidentService incidentService) {
        this.incidentRepository = incidentRepository;
        this.incidentService = incidentService;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats(Long currentUserId, String roleName) {
        List<Incident> scopedIncidents = "ROLE_EMPLOYEE".equals(roleName)
                ? incidentRepository.findByReporterIdOrderByCreatedAtDesc(currentUserId)
                : incidentRepository.findAllByOrderByCreatedAtDesc();

        long total = scopedIncidents.size();
        long open = scopedIncidents.stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.CLOSED)
                .count();
        long critical = scopedIncidents.stream()
                .filter(i -> i.getSeverity() == IncidentSeverity.CRITICAL
                        && i.getStatus() != IncidentStatus.RESOLVED
                        && i.getStatus() != IncidentStatus.CLOSED)
                .count();
        long resolved = scopedIncidents.stream()
                .filter(i -> i.getStatus() == IncidentStatus.RESOLVED || i.getStatus() == IncidentStatus.CLOSED)
                .count();

        Map<String, Long> severityCounts = new LinkedHashMap<>();
        for (IncidentSeverity sev : IncidentSeverity.values()) {
            severityCounts.put(sev.name(), scopedIncidents.stream().filter(i -> i.getSeverity() == sev).count());
        }

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (IncidentStatus st : IncidentStatus.values()) {
            statusCounts.put(st.name(), scopedIncidents.stream().filter(i -> i.getStatus() == st).count());
        }

        Map<String, Long> categoryCounts = new LinkedHashMap<>();
        for (IncidentCategory cat : IncidentCategory.values()) {
            long c = scopedIncidents.stream().filter(i -> i.getCategory() == cat).count();
            if (c > 0) {
                categoryCounts.put(cat.name(), c);
            }
        }

        Map<String, long[]> monthlyMap = new LinkedHashMap<>();
        scopedIncidents.stream()
                .sorted(Comparator.comparing(Incident::getCreatedAt))
                .forEach(incident -> {
                    String monthKey = incident.getCreatedAt().format(MONTH_FORMATTER);
                    monthlyMap.putIfAbsent(monthKey, new long[]{0L, 0L});
                    monthlyMap.get(monthKey)[0]++;
                    if (incident.getSeverity() == IncidentSeverity.CRITICAL) {
                        monthlyMap.get(monthKey)[1]++;
                    }
                });

        List<DashboardStatsDto.MonthlyCount> monthlyTrend = monthlyMap.entrySet().stream()
                .map(e -> new DashboardStatsDto.MonthlyCount(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        List<IncidentDto> recentIncidents = scopedIncidents.stream()
                .limit(6)
                .map(incidentService::toDto)
                .toList();

        DashboardStatsDto dto = new DashboardStatsDto();
        dto.setTotalIncidents(total);
        dto.setOpenIncidents(open);
        dto.setCriticalIncidents(critical);
        dto.setResolvedIncidents(resolved);
        dto.setSeverityCounts(severityCounts);
        dto.setStatusCounts(statusCounts);
        dto.setCategoryCounts(categoryCounts);
        dto.setMonthlyTrend(monthlyTrend);
        dto.setRecentIncidents(recentIncidents);
        return dto;
    }
}
