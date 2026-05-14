package com.arcadia.premium.model;

public enum FolderPermissionLevel {
    VIEW(0),
    UPLOAD(1),
    DELETE(2),
    MANAGE(3);

    private final int rank;

    FolderPermissionLevel(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }

    /**
     * Returns true if this permission level is at least as high as the required level.
     * Hierarchy: MANAGE > DELETE > UPLOAD > VIEW
     */
    public boolean isAtLeast(FolderPermissionLevel required) {
        return this.rank >= required.rank;
    }
}
