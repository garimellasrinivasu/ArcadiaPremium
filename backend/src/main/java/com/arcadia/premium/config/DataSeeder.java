package com.arcadia.premium.config;

import com.arcadia.premium.model.*;
import com.arcadia.premium.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final ApprovalChainRepository approvalChainRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      PermissionRepository permissionRepository,
                      ApprovalChainRepository approvalChainRepository,
                      ProjectRepository projectRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.approvalChainRepository = approvalChainRepository;
        this.projectRepository = projectRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // FORCE RESET ADMIN PASSWORD FOR LOCAL TESTING
        userRepository.findByEmail("admin@arcadiapremium.com").ifPresent(admin -> {
            admin.setPassword(passwordEncoder.encode("admin123"));
            userRepository.save(admin);
            log.info("FORCED RESET: admin@arcadiapremium.com password has been reset to 'admin123'");
        });

        if (roleRepository.count() > 0) {
            log.info("Database already seeded — skipping role/user seeding.");
            migrateUsersToSingleRole();
            seedApprovalChainsIfNeeded();
            return;
        }

        log.info("Seeding default data...");

        // Permissions
        var userRead   = savePerm("USER_READ",   "View users",          "USER_MANAGEMENT");
        var userWrite  = savePerm("USER_WRITE",  "Create/edit users",   "USER_MANAGEMENT");
        var userDelete = savePerm("USER_DELETE", "Delete users",        "USER_MANAGEMENT");
        var roleRead   = savePerm("ROLE_READ",   "View roles",          "ACCESS_MANAGEMENT");
        var roleWrite  = savePerm("ROLE_WRITE",  "Create/edit roles",   "ACCESS_MANAGEMENT");

        var attendRead  = savePerm("ATTENDANCE_READ",  "View attendance",  "ATTENDANCE");
        var attendWrite = savePerm("ATTENDANCE_WRITE", "Submit attendance", "ATTENDANCE");
        var attendApprove = savePerm("ATTENDANCE_APPROVE", "Approve attendance", "ATTENDANCE");

        // Roles
        Role adminRole = new Role(null, "ADMIN", "Full system administrator",
                Set.of(userRead, userWrite, userDelete, roleRead, roleWrite, attendRead, attendWrite, attendApprove));
        adminRole = roleRepository.save(adminRole);

        roleRepository.save(new Role(null, "SALES", "Sales team",
                Set.of(userRead, roleRead)));

        roleRepository.save(new Role(null, "ENGINEERING", "Engineering team",
                Set.of(userRead, roleRead, attendRead, attendApprove)));

        roleRepository.save(new Role(null, "OPERATIONS", "Operations team",
                Set.of(userRead, roleRead, attendRead)));

        roleRepository.save(new Role(null, "ACCOUNTS", "Accounts & Finance team",
                Set.of(userRead, roleRead, attendRead)));

        // New roles for approval workflow
        roleRepository.save(new Role(null, "OFFICE_ASSISTANT", "Office Assistant",
                Set.of(userRead, roleRead, attendRead, attendWrite)));

        roleRepository.save(new Role(null, "SUPERVISOR", "Site Supervisor",
                Set.of(userRead, roleRead, attendRead, attendWrite, attendApprove)));

        roleRepository.save(new Role(null, "PARTNER", "Partner / Senior Management",
                Set.of(userRead, roleRead, attendRead, attendApprove)));

        roleRepository.save(new Role(null, "ACCOUNTING", "Accounting / Finance Recording",
                Set.of(userRead, roleRead, attendRead)));

        // Default admin user
        User admin = new User();
        admin.setFirstName("Admin");
        admin.setLastName("Arcadia");
        admin.setEmail("admin@arcadiapremium.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setActive(true);
        admin.setRole(adminRole);
        userRepository.save(admin);

        log.info("Seeding complete — default admin: admin@arcadiapremium.com / admin123");
        log.info("NOTE: Approval chains must be configured from Admin > Approval Chains after creating users.");
    }

    /**
     * One-time migration: for users that still have role_id = NULL (from the old
     * ManyToMany user_roles model), assign the first role found in the legacy
     * join table, or ADMIN role for admin@arcadiapremium.com.
     */
    private void migrateUsersToSingleRole() {
        var usersWithoutRole = userRepository.findAll().stream()
                .filter(u -> u.getRole() == null)
                .toList();
        if (usersWithoutRole.isEmpty()) return;

        log.info("Migrating {} users from old multi-role to single-role model...", usersWithoutRole.size());
        Role adminRole = roleRepository.findByName("ADMIN").orElse(null);

        for (User user : usersWithoutRole) {
            // For the default admin, always assign ADMIN role
            if ("admin@arcadiapremium.com".equalsIgnoreCase(user.getEmail()) && adminRole != null) {
                user.setRole(adminRole);
                userRepository.save(user);
                log.info("  Assigned ADMIN role to {}", user.getEmail());
                continue;
            }
            // For other users, try to find their role from the old user_roles table
            // Since getRoles() returns data from the convenience method, we use a native fallback
            var legacyRoles = user.getRoles();
            if (!legacyRoles.isEmpty()) {
                Role firstRole = legacyRoles.iterator().next();
                user.setRole(firstRole);
                userRepository.save(user);
                log.info("  Migrated user {} to role {}", user.getEmail(), firstRole.getName());
            } else {
                // No legacy role found — assign a default role
                Role defaultRole = roleRepository.findByName("OPERATIONS").orElse(adminRole);
                if (defaultRole != null) {
                    user.setRole(defaultRole);
                    userRepository.save(user);
                    log.info("  Assigned default role {} to {}", defaultRole.getName(), user.getEmail());
                }
            }
        }
        log.info("Role migration complete.");
    }

    private void seedApprovalChainsIfNeeded() {
        // Ensure core roles exist for existing databases
        ensureRole("ADMIN", "Full system administrator");
        ensureRole("SALES", "Sales team");
        ensureRole("ENGINEERING", "Engineering team");
        ensureRole("OPERATIONS", "Operations team");
        ensureRole("ACCOUNTS", "Accounts & Finance team");
        ensureRole("OFFICE_ASSISTANT", "Office Assistant");
        ensureRole("SUPERVISOR", "Site Supervisor");
        ensureRole("PARTNER", "Partner / Senior Management");
        ensureRole("ACCOUNTING", "Accounting / Finance Recording");

        // Seed default projects if none exist
        seedProjectsIfNeeded();
    }

    private void seedProjectsIfNeeded() {
        if (projectRepository.count() == 0) {
            projectRepository.save(new Project("Praneeth Arcadia Premium", "Premium villa project"));
            projectRepository.save(new Project("Praneeth Redfern Square", "Redfern Square project"));
            log.info("Seeded default projects: Praneeth Arcadia Premium, Praneeth Redfern Square");
        }
    }

    private void ensureRole(String name, String description) {
        if (roleRepository.findByName(name).isEmpty()) {
            var userRead = permissionRepository.findAll().stream()
                    .filter(p -> "USER_READ".equals(p.getName())).findFirst().orElse(null);
            var roleRead = permissionRepository.findAll().stream()
                    .filter(p -> "ROLE_READ".equals(p.getName())).findFirst().orElse(null);
            Set<Permission> perms = new java.util.HashSet<>();
            if (userRead != null) perms.add(userRead);
            if (roleRead != null) perms.add(roleRead);
            roleRepository.save(new Role(null, name, description, perms));
            log.info("Created missing role: {}", name);
        }
    }

    private Permission savePerm(String name, String desc, String module) {
        return permissionRepository.save(new Permission(null, name, desc, module));
    }
}
