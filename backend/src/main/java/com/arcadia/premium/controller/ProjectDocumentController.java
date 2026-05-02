package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ProjectDocumentDto;
import com.arcadia.premium.model.ProjectDocument;
import com.arcadia.premium.service.ProjectDocumentService;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/documents")
public class ProjectDocumentController {

    private final ProjectDocumentService service;

    /**
     * Temporary share tokens: token → { docId, expiresAt }.
     * Used to give Office Online / Google Docs a short-lived public URL.
     */
    private static final ConcurrentHashMap<String, long[]> shareTokens = new ConcurrentHashMap<>();

    public ProjectDocumentController(ProjectDocumentService service) {
        this.service = service;
    }

    /** Upload a document for a project (optionally into a folder) */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @RequestParam("projectName") String projectName,
            @RequestParam(value = "fileName", required = false) String fileName,
            @RequestParam(value = "folderId", required = false) Long folderId,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        try {
            ProjectDocumentDto dto = service.upload(projectName, fileName, file, principal.getName(), folderId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** List documents for a project in a specific folder (or root if folderId absent).
     *  Admins see all; others see only their own. */
    @GetMapping
    public ResponseEntity<List<ProjectDocumentDto>> listByProject(
            @RequestParam("projectName") String projectName,
            @RequestParam(value = "folderId", required = false) Long folderId,
            Principal principal) {
        boolean isAdmin = isCurrentUserAdmin();
        return ResponseEntity.ok(
            service.listByProjectAndFolder(projectName, folderId, principal.getName(), isAdmin));
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }

    /** Download / view a document by ID (requires JWT) */
    @GetMapping("/{id}")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        ProjectDocument doc = service.getById(id);
        return buildFileResponse(doc);
    }

    /**
     * Create a temporary share token for a document (valid 10 minutes).
     * The token can be used with the /api/documents/public/{token} endpoint.
     */
    @PostMapping("/{id}/share")
    public ResponseEntity<?> createShareToken(@PathVariable Long id) {
        // Verify doc exists
        service.getById(id);

        // Clean expired tokens
        long now = System.currentTimeMillis();
        shareTokens.entrySet().removeIf(e -> e.getValue()[1] < now);

        String token = UUID.randomUUID().toString();
        long expiresAt = now + 10 * 60 * 1000; // 10 minutes
        shareTokens.put(token, new long[]{id, expiresAt});

        return ResponseEntity.ok(Map.of("token", token));
    }

    /**
     * Public endpoint — no JWT required. Serves a document using a temporary share token.
     * Used by Office Online / Google Docs viewer to fetch the file.
     */
    @GetMapping("/public/{token}")
    public ResponseEntity<?> publicDownload(@PathVariable String token) {
        long[] entry = shareTokens.get(token);
        if (entry == null || entry[1] < System.currentTimeMillis()) {
            shareTokens.remove(token);
            return ResponseEntity.status(HttpStatus.GONE)
                    .body("This link has expired.");
        }

        ProjectDocument doc = service.getById(entry[0]);
        return buildFileResponse(doc);
    }

    /** Delete a document (admin only) */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Document deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** Bulk delete documents (admin only) */
    @DeleteMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> bulkDelete(@RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> ids = request.get("ids");
            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No document IDs provided."));
            }
            int count = service.deleteMultiple(ids);
            return ResponseEntity.ok(Map.of("message", count + " document(s) deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private ResponseEntity<byte[]> buildFileResponse(ProjectDocument doc) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(doc.getContentType()));
        headers.setContentLength(doc.getFileSize());

        // For PDF and images, display inline; for DOCX/PPT, force download
        if (doc.getContentType().startsWith("image/") || doc.getContentType().equals("application/pdf")) {
            headers.setContentDisposition(
                ContentDisposition.inline().filename(doc.getFileName()).build());
        } else {
            headers.setContentDisposition(
                ContentDisposition.inline().filename(doc.getFileName()).build());
        }

        return new ResponseEntity<>(doc.getFileData(), headers, HttpStatus.OK);
    }
}
