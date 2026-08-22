package com.arcadia.premium.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Runs database migrations on application startup.
 * Fixes stale constraints that Hibernate's ddl-auto=update cannot remove.
 * Each migration is idempotent — safe to run multiple times.
 */
@Component
@Order(0) // Run before DataSeeder
public class DatabaseMigration implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigration.class);

    private final JdbcTemplate jdbc;

    public DatabaseMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        log.info("Running database migrations...");
        dropSingleColumnVillaBlockingConstraint();
        log.info("Database migrations complete.");
    }

    /**
     * Drop any unique constraint on villa_blockings that covers ONLY villa_number.
     * The correct constraint is the composite (project_name, villa_number).
     * Hibernate ddl-auto=update adds new constraints but never removes old ones.
     */
    private void dropSingleColumnVillaBlockingConstraint() {
        try {
            // Find all unique constraints on villa_blockings table
            String sql = """
                SELECT con.conname AS constraint_name,
                       array_agg(att.attname ORDER BY u.ordinality) AS columns
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, ordinality)
                JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = u.attnum
                WHERE rel.relname = 'villa_blockings'
                  AND con.contype = 'u'
                  AND nsp.nspname = 'public'
                GROUP BY con.conname
                """;

            List<Map<String, Object>> constraints = jdbc.queryForList(sql);

            for (Map<String, Object> row : constraints) {
                String constraintName = (String) row.get("constraint_name");
                String columnsStr = row.get("columns").toString(); // e.g., {villa_number}

                // Drop constraints that ONLY have villa_number (not the composite one)
                if (columnsStr.equals("{villa_number}")) {
                    log.info("Dropping stale single-column constraint '{}' on villa_blockings (columns: {})",
                            constraintName, columnsStr);
                    jdbc.execute("ALTER TABLE villa_blockings DROP CONSTRAINT " + constraintName);
                    log.info("Successfully dropped constraint '{}'", constraintName);
                }
            }
        } catch (Exception e) {
            // Non-fatal — the constraint may already be gone
            log.warn("Migration check for villa_blockings constraint: {}", e.getMessage());
        }
    }
}
