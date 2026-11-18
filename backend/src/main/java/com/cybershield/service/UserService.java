package com.cybershield.service;

import com.cybershield.dto.CreateUserRequest;
import com.cybershield.dto.UpdateUserRequest;
import com.cybershield.dto.UserDto;
import com.cybershield.entity.Role;
import com.cybershield.entity.RoleName;
import com.cybershield.entity.User;
import com.cybershield.exception.BadRequestException;
import com.cybershield.exception.DuplicateResourceException;
import com.cybershield.exception.ResourceNotFoundException;
import com.cybershield.repository.RoleRepository;
import com.cybershield.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UserDto> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<UserDto> getActiveAnalysts() {
        return userRepository.findAllByRole_NameAndActiveTrueOrderByFullNameAsc(RoleName.ROLE_ANALYST)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return toDto(user);
    }

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("A user with email " + normalizedEmail + " already exists.");
        }

        Role role = resolveRole(request.getRole());

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setDepartment(request.getDepartment());
        user.setJobTitle(request.getJobTitle());
        user.setRole(role);
        user.setActive(true);

        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest request, Long currentAdminId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new DuplicateResourceException("Another user already uses email " + normalizedEmail);
            }
        });

        Role role = resolveRole(request.getRole());

        user.setFullName(request.getFullName().trim());
        user.setEmail(normalizedEmail);
        user.setDepartment(request.getDepartment());
        user.setJobTitle(request.getJobTitle());
        user.setRole(role);

        if (request.getActive() != null) {
            if (user.getId().equals(currentAdminId) && !request.getActive()) {
                throw new BadRequestException("Administrators cannot deactivate their own active session account.");
            }
            user.setActive(request.getActive());
        }

        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserDto toggleUserStatus(Long id, boolean active, Long currentAdminId) {
        if (id.equals(currentAdminId) && !active) {
            throw new BadRequestException("Administrators cannot deactivate their own account.");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        user.setActive(active);
        return toDto(userRepository.save(user));
    }

    private Role resolveRole(String roleInput) {
        String normalized = roleInput.trim().toUpperCase();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        RoleName roleName;
        try {
            roleName = RoleName.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid role specified: " + roleInput);
        }
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found: " + roleName));
    }

    public UserDto toDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setDepartment(user.getDepartment());
        dto.setJobTitle(user.getJobTitle());
        dto.setActive(user.isActive());
        dto.setRole(user.getRole().getName().name());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
