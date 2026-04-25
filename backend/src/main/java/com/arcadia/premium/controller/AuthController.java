package com.arcadia.premium.controller;

import com.arcadia.premium.dto.*;
import com.arcadia.premium.security.JwtUtil;
import com.arcadia.premium.service.EmailService;
import com.arcadia.premium.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final EmailService emailService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                          UserService userService, EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.emailService = emailService;
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
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            principal.getName(), request.getCurrentPassword()));

            userService.changePassword(principal.getName(), request.getNewPassword());

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password is incorrect"));
        }
    }

    @PutMapping("/admin-reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> adminResetPassword(@Valid @RequestBody AdminResetPasswordRequest request) {
        try {
            UserDto user = userService.getUserById(request.getUserId());

            userService.changePasswordById(request.getUserId(), request.getNewPassword());

            // Try to send email with new password
            try {
                emailService.sendPasswordResetEmail(
                        user.getEmail(),
                        user.getFirstName() + " " + user.getLastName(),
                        request.getNewPassword()
                );
                return ResponseEntity.ok(Map.of(
                        "message", "Password reset successfully. Email sent to " + user.getEmail()
                ));
            } catch (Exception emailEx) {
                // Password was reset but email failed — inform admin
                return ResponseEntity.ok(Map.of(
                        "message", "Password reset successfully but email could not be sent to " + user.getEmail() + ". Please share the new password manually.",
                        "emailError", emailEx.getMessage()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to reset password: " + e.getMessage()));
        }
    }
}
