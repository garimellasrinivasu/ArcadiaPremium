package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreateProjectRequest;
import com.arcadia.premium.dto.ProjectDto;
import com.arcadia.premium.model.User;
import com.arcadia.premium.repository.UserRepository;
import com.arcadia.premium.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final UserRepository userRepository;

    public ProjectController(ProjectService projectService, UserRepository userRepository) {
        this.projectService = projectService;
        this.userRepository = userRepository;
    }

    /** Get active projects — used by all authenticated users for dropdowns. */
    @GetMapping("/active")
    public ResponseEntity<List<ProjectDto>> getActiveProjects() {
        return ResponseEntity.ok(projectService.getActiveProjects());
    }

    /**
     * Get projects the current user has access to.
     * Admins get all active projects. Non-admins get only their assigned projects.
     */
    @GetMapping("/my-projects")
    public ResponseEntity<List<ProjectDto>> getMyProjects() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            return ResponseEntity.ok(projectService.getActiveProjects());
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Set<String> allowedProjects = user.getAllowedProjects();

        if (allowedProjects == null || allowedProjects.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(projectService.getActiveProjectsByNames(allowedProjects));
    }

    /** Get all projects (including inactive) — admin only. */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PROJECTS')")
    public ResponseEntity<List<ProjectDto>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PROJECTS')")
    public ResponseEntity<ProjectDto> create(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.ok(projectService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PROJECTS')")
    public ResponseEntity<ProjectDto> update(@PathVariable Long id, @Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.ok(projectService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PROJECTS')")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
    }
}
