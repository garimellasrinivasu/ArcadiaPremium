package com.arcadia.premium.config;

import com.arcadia.premium.model.*;
import com.arcadia.premium.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final ApprovalChainRepository approvalChainRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      PermissionRepository permissionRepository,
                      ApprovalChainRepository approvalChainRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.approvalChainRepository = approvalChainRepository;
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
        admin.setRoles(Set.of(adminRole));
        userRepository.save(admin);

        log.info("Seeding complete — default admin: admin@arcadiapremium.com / admin123");
        log.info("NOTE: Approval chains must be configured from Admin > Approval Chains after creating users.");
    }

    private void seedApprovalChainsIfNeeded() {
        // Ensure new roles exist for existing databases
        ensureRole("OFFICE_ASSISTANT", "Office Assistant");
        ensureRole("SUPERVISOR", "Site Supervisor");
        ensureRole("PARTNER", "Partner / Senior Management");
        ensureRole("ACCOUNTING", "Accounting / Finance Recording");
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
