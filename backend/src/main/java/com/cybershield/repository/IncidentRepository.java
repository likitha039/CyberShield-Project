package com.cybershield.repository;

import com.cybershield.entity.Incident;
import com.cybershield.entity.IncidentCategory;
import com.cybershield.entity.IncidentSeverity;
import com.cybershield.entity.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    Optional<Incident> findByIncidentCode(String incidentCode);

    List<Incident> findAllByOrderByCreatedAtDesc();

    List<Incident> findByReporterIdOrderByCreatedAtDesc(Long reporterId);

    @Query("""
        SELECT DISTINCT i FROM Incident i
        LEFT JOIN i.assignments a ON a.active = true
        WHERE (:reporterId IS NULL OR i.reporter.id = :reporterId)
          AND (:analystId IS NULL OR a.analyst.id = :analystId)
          AND (:status IS NULL OR i.status = :status)
          AND (:severity IS NULL OR i.severity = :severity)
          AND (:category IS NULL OR i.category = :category)
          AND (:search IS NULL OR :search = '' OR
               LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(i.incidentCode) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(i.affectedSystem) LIKE LOWER(CONCAT('%', :search, '%')) OR
               LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY i.createdAt DESC
    """)
    List<Incident> searchIncidents(
            @Param("reporterId") Long reporterId,
            @Param("analystId") Long analystId,
            @Param("status") IncidentStatus status,
            @Param("severity") IncidentSeverity severity,
            @Param("category") IncidentCategory category,
            @Param("search") String search
    );

    long countByStatusIn(List<IncidentStatus> statuses);

    long countBySeverityAndStatusNotIn(IncidentSeverity severity, List<IncidentStatus> excludedStatuses);

    long countBySeverity(IncidentSeverity severity);

    long countByStatus(IncidentStatus status);
}
