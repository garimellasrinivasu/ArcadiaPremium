package com.arcadia.premium.controller;

import com.arcadia.premium.dto.DocumentFolderDto;
import com.arcadia.premium.service.DocumentFolderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/document-folders")
public class DocumentFolderController {

    private final DocumentFolderService service;

    public DocumentFolderController(DocumentFolderService service) {
        this.service = service;
    }

    /** Create a new folder */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            String projectName = (String) request.get("projectName");
            String name = (String) request.get("name");
            Long parentId = request.get("parentId") != null
                    ? Long.valueOf(request.get("parentId").toString())
                    : null;
            DocumentFolderDto dto = service.create(projectName, name, parentId, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Get the full folder tree for a project */
    @GetMapping("/tree")
    public ResponseEntity<List<DocumentFolderDto>> getTree(@RequestParam String projectName) {
        return ResponseEntity.ok(service.getTree(projectName));
    }

    /** Get breadcrumb path for a folder */
    @GetMapping("/{id}/breadcrumb")
    public ResponseEntity<List<DocumentFolderDto>> getBreadcrumb(@PathVariable Long id) {
        return ResponseEntity.ok(service.getBreadcrumb(id));
    }

    /** Rename a folder */
    @PutMapping("/{id}")
    public ResponseEntity<?> rename(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String newName = request.get("name");
            return ResponseEntity.ok(service.rename(id, newName));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /** Delete a folder */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PROJECT_DOCUMENTS')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Folder deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
