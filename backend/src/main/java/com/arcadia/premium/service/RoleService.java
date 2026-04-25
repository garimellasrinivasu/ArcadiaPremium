package com.arcadia.premium.service;

import com.arcadia.premium.dto.RoleDto;
import com.arcadia.premium.repository.RoleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(RoleDto::fromEntity)
                .collect(Collectors.toList());
    }

    public RoleDto getRoleById(Long id) {
        return roleRepository.findById(id)
                .map(RoleDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
    }
}
