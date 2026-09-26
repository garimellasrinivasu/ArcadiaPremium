package com.arcadia.premium.model;

/**
 * Constants for folder permission levels.
 * Permissions are now multi-select (comma-separated in the DB),
 * so the hierarchical rank is no longer used for access checks.
 * This enum is kept for validation and constant references.
 */
public enum FolderPermissionLevel {
    VIEW,
    UPLOAD,
    DELETE,
    MANAGE;

    /** All valid level names for validation */
    public static boolean isValid(String level) {
        try {
            valueOf(level.trim().toUpperCase());
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Check if a comma-separated permission string contains the required level.
     * E.g. containsLevel("VIEW,UPLOAD", "UPLOAD") returns true.
     */
    public static boolean containsLevel(String permissionLevels, String requiredLevel) {
        if (permissionLevels == null || requiredLevel == null) return false;
        for (String level : permissionLevels.split(",")) {
            if (level.trim().equalsIgnoreCase(requiredLevel.trim())) return true;
        }
        return false;
    }

    /**
     * Check if a comma-separated permission string contains any access at all
     * (i.e., at least VIEW).
     */
    public static boolean hasAnyAccess(String permissionLevels) {
        return permissionLevels != null && !permissionLevels.isBlank();
    }
}
