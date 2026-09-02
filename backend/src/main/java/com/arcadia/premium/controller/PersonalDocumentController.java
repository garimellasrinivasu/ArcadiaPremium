package com.arcadia.premium.controller;

import com.arcadia.premium.dto.PersonalDocumentDto;
import com.arcadia.premium.model.PersonalDocument;
import com.arcadia.premium.service.PersonalDocumentService;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/personal-documents")
public class PersonalDocumentController {

    private final PersonalDocumentService service;

    public PersonalDocumentController(PersonalDocumentService service) {
        this.service = service;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PERSONAL_DOCUMENTS')")
    public ResponseEntity<?> upload(
            @RequestParam(value = "category", defaultValue = "General") String category,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file,
            Principal principal) {
        try {
            PersonalDocumentDto dto = service.upload(category, description, file, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PERSONAL_DOCUMENTS')")
    public ResponseEntity<List<PersonalDocumentDto>> list(
            @RequestParam(value = "category", required = false) String category,
            Principal principal) {
        boolean isAdmin = isCurrentUserAdmin();
        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(service.listByCategory(category, principal.getName(), isAdmin));
        }
        if (isAdmin) {
            return ResponseEntity.ok(service.listAll());
        }
        return ResponseEntity.ok(service.listForUser(principal.getName()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PERSONAL_DOCUMENTS')")
    public ResponseEntity<?> download(@PathVariable Long id, Principal principal) {
        try {
            PersonalDocument doc = service.getById(id);
            boolean isAdmin = isCurrentUserAdmin();
            if (!isAdmin && !doc.getUploadedBy().equals(principal.getName())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(doc.getContentType()));
            headers.setContentLength(doc.getFileSize());
            headers.setContentDisposition(ContentDisposition.inline().filename(doc.getFileName()).build());
            return new ResponseEntity<>(doc.getFileData(), headers, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PERSONAL_DOCUMENTS')")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        try {
            boolean isAdmin = isCurrentUserAdmin();
            service.delete(id, principal.getName(), isAdmin);
            return ResponseEntity.ok(Map.of("message", "Document deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }
}
