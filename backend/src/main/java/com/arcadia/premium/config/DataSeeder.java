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
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      PermissionRepository permissionRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (roleRepository.count() > 0) {
            log.info("Database already seeded — skipping.");
            return;
        }

        log.info("Seeding default data...");

        // Permissions
        var userRead   = savePerm("USER_READ",   "View users",          "USER_MANAGEMENT");
        var userWrite  = savePerm("USER_WRITE",  "Create/edit users",   "USER_MANAGEMENT");
        var userDelete = savePerm("USER_DELETE", "Delete users",        "USER_MANAGEMENT");
        var roleRead   = savePerm("ROLE_READ",   "View roles",          "ACCESS_MANAGEMENT");
        var roleWrite  = savePerm("ROLE_WRITE",  "Create/edit roles",   "ACCESS_MANAGEMENT");

        // Roles
        Role adminRole = new Role(null, "ADMIN", "Full system administrator",
                Set.of(userRead, userWrite, userDelete, roleRead, roleWrite));
        adminRole = roleRepository.save(adminRole);

        roleRepository.save(new Role(null, "AGENT", "Real estate agent",
                Set.of(userRead, roleRead)));

        roleRepository.save(new Role(null, "VIEWER", "Read-only access",
                Set.of(userRead, roleRead)));

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
    }

    private Permission savePerm(String name, String desc, String module) {
        return permissionRepository.save(new Permission(null, name, desc, module));
    }
}
