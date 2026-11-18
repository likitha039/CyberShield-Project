package com.cybershield.repository;

import com.cybershield.entity.IncidentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentAssignmentRepository extends JpaRepository<IncidentAssignment, Long> {
    Optional<IncidentAssignment> findFirstByIncidentIdAndActiveTrueOrderByAssignedAtDesc(Long incidentId);
    List<IncidentAssignment> findByIncidentIdAndActiveTrue(Long incidentId);
    List<IncidentAssignment> findByAnalystIdAndActiveTrue(Long analystId);
}
