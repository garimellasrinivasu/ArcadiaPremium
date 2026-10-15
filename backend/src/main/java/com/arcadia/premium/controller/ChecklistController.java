package com.arcadia.premium.controller;

import com.arcadia.premium.model.ChecklistDocument;
import com.arcadia.premium.model.ChecklistItem;
import com.arcadia.premium.model.ChecklistMailConfig;
import com.arcadia.premium.repository.ChecklistDocumentRepository;
import com.arcadia.premium.service.ChecklistService;
import com.arcadia.premium.service.ChecklistService.Perms;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.function.Supplier;

/**
 * Sales Preparation Data (SALES_PREP) and RERA Documentation (RERA_DOCS) pages.
 * Every action is checked against the caller's per-page permissions (admins can do everything).
 */
@RestController
@RequestMapping("/api/checklists")
public class ChecklistController {

    private final ChecklistService service;

    public ChecklistController(ChecklistService service) {
        this.service = service;
    }

    private static boolean isAdmin(Authentication auth) {
        return auth != null && auth.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch("ROLE_ADMIN"::equals);
    }

    private Perms perms(Authentication auth, String tracker) {
        return service.permsFor(auth.getName(), isAdmin(auth), tracker);
    }

    private ResponseEntity<?> run(Supplier<Object> body) {
        try {
            return ResponseEntity.ok(body.get());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Permissions ──

    @GetMapping("/my-permissions")
    public Map<String, Perms> myPermissions(Authentication auth) {
        Map<String, Perms> out = new LinkedHashMap<>();
        for (String t : List.of("SALES_PREP", "RERA_DOCS")) out.put(t, perms(auth, t));
        return out;
    }

    @GetMapping("/permissions")
    public ResponseEntity<?> listPermissions(Authentication auth) {
        return run(() -> {
            service.require(isAdmin(auth), "manage permissions");
            return service.listPermissions();
        });
    }

    @PutMapping("/permissions")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> savePermission(@RequestBody Map<String, Object> body, Authentication auth) {
        return run(() -> {
            service.require(isAdmin(auth), "manage permissions");
            service.savePermission(String.valueOf(body.get("email")), String.valueOf(body.get("tracker")),
                    (Map<String, Boolean>) body.getOrDefault("flags", Map.of()));
            return Map.of("message", "Saved");
        });
    }

    // ── Items ──

    @GetMapping("/{tracker}/items")
    public ResponseEntity<?> items(@PathVariable String tracker, @RequestParam String project, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).view(), "view");
            List<ChecklistItem> items = service.items(tracker, project);
            Map<Long, List<ChecklistDocumentRepository.Summary>> docs = service.documentsFor(items);
            Map<Long, List<com.arcadia.premium.model.ChecklistFolder>> folders = service.foldersFor(items);
            List<Map<String, Object>> out = new ArrayList<>();
            for (ChecklistItem i : items) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", i.getId());
                m.put("section", i.getSection());
                m.put("title", i.getTitle());
                m.put("details", i.getDetails());
                m.put("status", i.getStatus());
                m.put("owner", i.getOwner());
                m.put("technicalOwner", i.getTechnicalOwner());
                m.put("targetDate", i.getTargetDate());
                m.put("completedDate", i.getCompletedDate());
                m.put("remarks", i.getRemarks());
                m.put("updatedBy", i.getUpdatedBy());
                m.put("updatedAt", i.getUpdatedAt());
                m.put("documents", docs.getOrDefault(i.getId(), List.of()));
                m.put("folders", folders.getOrDefault(i.getId(), List.of()).stream()
                        .map(f -> Map.of("id", f.getId(), "parentId", f.getParentId() == null ? "" : f.getParentId(), "name", f.getName()))
                        .toList());
                out.add(m);
            }
            return out;
        });
    }

    @PostMapping("/{tracker}/items")
    public ResponseEntity<?> create(@PathVariable String tracker, @RequestParam String project,
                                    @RequestBody Map<String, Object> body, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).editStatus(), "add items");
            return service.create(tracker, project, body, auth.getName());
        });
    }

    @PutMapping("/{tracker}/items/{id}")
    public ResponseEntity<?> update(@PathVariable String tracker, @PathVariable Long id,
                                    @RequestBody Map<String, Object> body, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).editStatus(), "edit status");
            return service.update(tracker, id, body, auth.getName());
        });
    }

    @DeleteMapping("/{tracker}/items/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable String tracker, @PathVariable Long id, Authentication auth) {
        return run(() -> {
            Perms p = perms(auth, tracker);
            service.require(p.editStatus() && p.delete(), "delete items");
            service.deleteItem(tracker, id);
            return Map.of("message", "Deleted");
        });
    }

    // ── Documents ──

    @PostMapping(value = "/{tracker}/items/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(@PathVariable String tracker, @PathVariable Long id,
                                    @RequestParam("file") MultipartFile file,
                                    @RequestParam(value = "folderId", required = false) Long folderId, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).upload(), "upload");
            try {
                ChecklistDocument d = service.upload(tracker, id, folderId, file, auth.getName());
                return Map.of("id", d.getId(), "fileName", d.getFileName());
            } catch (java.io.IOException e) {
                throw new IllegalStateException("Upload failed: " + e.getMessage());
            }
        });
    }

    /** View inline (needs View) or download as attachment (needs Download). */
    @GetMapping("/{tracker}/documents/{docId}")
    public ResponseEntity<?> document(@PathVariable String tracker, @PathVariable Long docId,
                                      @RequestParam(defaultValue = "false") boolean download, Authentication auth) {
        Perms p = perms(auth, tracker);
        if (!(download ? p.download() : p.view())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "You don't have permission to " + (download ? "download" : "view") + " documents on this page."));
        }
        try {
            ChecklistDocument d = service.document(tracker, docId);
            java.nio.file.Path file = service.fileOf(d);
            if (!java.nio.file.Files.exists(file)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "The stored file is missing on the server."));
            }
            HttpHeaders h = new HttpHeaders();
            h.setContentType(MediaType.parseMediaType(d.getContentType()));
            h.setContentLength(java.nio.file.Files.size(file));
            h.setContentDisposition((download ? ContentDisposition.attachment() : ContentDisposition.inline())
                    .filename(d.getFileName(), java.nio.charset.StandardCharsets.UTF_8).build());
            // Streamed from disk, not loaded into memory
            return new ResponseEntity<>(new org.springframework.core.io.FileSystemResource(file), h, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (java.io.IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Could not read the file: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{tracker}/documents/{docId}")
    public ResponseEntity<?> deleteDocument(@PathVariable String tracker, @PathVariable Long docId, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).delete(), "delete documents");
            service.deleteDocument(tracker, docId);
            return Map.of("message", "Deleted");
        });
    }

    // ── Sub-folders (create/rename need Upload; delete needs Delete) ──

    @PostMapping("/{tracker}/items/{id}/folders")
    public ResponseEntity<?> createFolder(@PathVariable String tracker, @PathVariable Long id,
                                          @RequestBody Map<String, Object> body, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).upload(), "create folders");
            Object p = body.get("parentId");
            Long parentId = p == null || String.valueOf(p).isBlank() ? null : Long.valueOf(String.valueOf(p));
            var f = service.createFolder(tracker, id, parentId, Objects.toString(body.get("name"), ""), auth.getName());
            return Map.of("id", f.getId(), "name", f.getName(), "parentId", f.getParentId() == null ? "" : f.getParentId());
        });
    }

    @PutMapping("/{tracker}/folders/{folderId}")
    public ResponseEntity<?> renameFolder(@PathVariable String tracker, @PathVariable Long folderId,
                                          @RequestBody Map<String, Object> body, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).upload(), "rename folders");
            var f = service.renameFolder(tracker, folderId, Objects.toString(body.get("name"), ""));
            return Map.of("id", f.getId(), "name", f.getName());
        });
    }

    @DeleteMapping("/{tracker}/folders/{folderId}")
    public ResponseEntity<?> deleteFolder(@PathVariable String tracker, @PathVariable Long folderId, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).delete(), "delete folders");
            int files = service.deleteFolder(tracker, folderId);
            return Map.of("message", "Folder deleted", "filesDeleted", files);
        });
    }

    // ── Summary & email ──

    @GetMapping("/{tracker}/summary")
    public ResponseEntity<?> summary(@PathVariable String tracker, @RequestParam String project, Authentication auth) {
        return run(() -> {
            service.require(perms(auth, tracker).view(), "view");
            return service.summary(tracker, project);
        });
    }

    @GetMapping("/{tracker}/mail-config")
    public ResponseEntity<?> mailConfig(@PathVariable String tracker, @RequestParam String project, Authentication auth) {
        return run(() -> {
            service.require(isAdmin(auth), "configure summary emails");
            return service.mailConfig(tracker, project);
        });
    }

    @PutMapping("/{tracker}/mail-config")
    public ResponseEntity<?> saveMailConfig(@PathVariable String tracker, @RequestParam String project,
                                            @RequestBody Map<String, Object> body, Authentication auth) {
        return run(() -> {
            service.require(isAdmin(auth), "configure summary emails");
            ChecklistMailConfig c = service.saveMailConfig(tracker, project,
                    Objects.toString(body.get("recipients"), ""), Boolean.TRUE.equals(body.get("dailyEnabled")));
            return c;
        });
    }

    /** The summary email exactly as recipients will see it */
    @GetMapping(value = "/{tracker}/summary-email-preview", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> previewEmail(@PathVariable String tracker, @RequestParam String project, Authentication auth) {
        if (!isAdmin(auth)) return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can preview the summary email.");
        return ResponseEntity.ok(service.summaryHtml(tracker, project));
    }

    @PostMapping("/{tracker}/send-summary")
    public ResponseEntity<?> sendSummary(@PathVariable String tracker, @RequestParam String project, Authentication auth) {
        return run(() -> {
            Perms p = perms(auth, tracker);
            service.require(isAdmin(auth) || p.editStatus(), "send the summary email");
            return Map.of("message", service.sendSummary(tracker, project, "sent by " + auth.getName()));
        });
    }
}
