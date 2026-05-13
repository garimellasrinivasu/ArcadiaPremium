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

import com.arcadia.premium.model.User;

import java.security.Principal;
import java.util.List;
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
        UserDto userDto = userService.getUserByEmail(auth.getName());

        // Check if user must change password (temp password login)
        User rawUser = userService.findRawUserByEmail(auth.getName());
        boolean mustChange = rawUser.isMustChangePassword();

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, userDto, mustChange));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Principal principal) {
        return ResponseEntity.ok(userService.getUserByEmail(principal.getName()));
    }

    /** Lightweight user list — any authenticated user. Returns id, name, email, roles only.
     *  Used by pages like Approval Chains and Site Attendance for dropdowns. */
    @GetMapping("/users-basic")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserDto>> getAllUsersBasic() {
        return ResponseEntity.ok(userService.getAllUsersBasic());
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Principal principal,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            principal.getName(), request.getCurrentPassword()));

            userService.changePassword(principal.getName(), request.getNewPassword());
            // Clear the mustChangePassword flag if it was set
            userService.clearMustChangePassword(principal.getName());

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Current password is incorrect"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email address is required."));
        }
        try {
            String tempPassword = userService.generateTempPassword(email.trim());
            // Look up user name for the email
            UserDto user = userService.getUserByEmail(email.trim());
            String fullName = user.getFirstName() + " " + user.getLastName();

            emailService.sendForgotPasswordEmail(email.trim(), fullName, tempPassword);

            return ResponseEntity.ok(Map.of(
                "message", "A temporary password has been sent to your email address. Please check your inbox."
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
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
