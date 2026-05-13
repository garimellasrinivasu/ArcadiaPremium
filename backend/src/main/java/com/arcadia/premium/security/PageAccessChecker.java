package com.arcadia.premium.security;

import com.arcadia.premium.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

/**
 * Spring bean used inside @PreAuthorize SpEL expressions to check
 * whether the authenticated user has been granted access to a specific page.
 *
 * Usage:
 *   @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'APPROVAL_CHAINS')")
 */
@Component("pageAccess")
public class PageAccessChecker {

    private final UserRepository userRepository;

    public PageAccessChecker(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Returns true if the user identified by {@code authentication} has been
     * granted access to the page identified by {@code pageKey}.
     * Admin users always return true (they bypass page-level access).
     */
    public boolean hasAccess(Authentication authentication, String pageKey) {
        if (authentication == null || pageKey == null) return false;

        // If user already has ADMIN role, allow everything
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
        if (isAdmin) return true;

        // Look up user from DB to check allowedPages
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(user -> user.getAllowedPages() != null && user.getAllowedPages().contains(pageKey))
                .orElse(false);
    }
}
