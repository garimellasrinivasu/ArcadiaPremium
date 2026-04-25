package com.arcadia.premium.controller;

import com.arcadia.premium.dto.*;
import com.arcadia.premium.security.JwtUtil;
import com.arcadia.premium.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                          UserService userService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        String token = jwtUtil.generateToken(auth.getName());
        String refreshToken = jwtUtil.generateRefreshToken(auth.getName());
        UserDto user = userService.getUserByEmail(auth.getName());

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, user));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Principal principal) {
        return ResponseEntity.ok(userService.getUserByEmail(principal.getName()));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Principal principal,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            // Verify current password by attempting authentication
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            principal.getName(), request.getCurrentPassword()));

            // Update password
            userService.changePassword(principal.getName(), request.getNewPassword());

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password is incorrect"));
        }
    }
}
