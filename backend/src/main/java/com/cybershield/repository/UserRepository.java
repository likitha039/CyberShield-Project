package com.cybershield.repository;

import com.cybershield.entity.RoleName;
import com.cybershield.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<User> findAllByRole_NameAndActiveTrueOrderByFullNameAsc(RoleName roleName);
    List<User> findAllByOrderByCreatedAtDesc();
}
