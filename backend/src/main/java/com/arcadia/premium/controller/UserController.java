package com.arcadia.premium.controller;

import com.arcadia.premium.dto.*;
import com.arcadia.premium.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /** Lightweight user list for permission pickers — all authenticated users */
    @GetMapping("/simple")
    public ResponseEntity<List<SimpleUserDto>> getSimpleUserList() {
        return ResponseEntity.ok(userService.getSimpleUserList());
    }

    /** Full user list — admin only (includes allowedPages, phone, etc.) */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateUser(@PathVariable Long id,
                                               @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    /** Update page access for a user (full access + view-only + download toggle) */
    @PutMapping("/{id}/page-access")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updatePageAccess(@PathVariable Long id,
                                                     @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        Set<String> allowedPages = body.containsKey("allowedPages")
                ? new java.util.HashSet<>((java.util.Collection<String>) body.get("allowedPages"))
                : Set.of();
        @SuppressWarnings("unchecked")
        Set<String> viewOnlyPages = body.containsKey("viewOnlyPages")
                ? new java.util.HashSet<>((java.util.Collection<String>) body.get("viewOnlyPages"))
                : Set.of();
        Boolean downloadEnabled = body.containsKey("downloadEnabled")
                ? (Boolean) body.get("downloadEnabled")
                : null;
        return ResponseEntity.ok(userService.updatePageAccess(id, allowedPages, viewOnlyPages, downloadEnabled));
    }
}
