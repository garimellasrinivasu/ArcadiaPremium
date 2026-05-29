package com.arcadia.premium.controller;

import com.arcadia.premium.dto.ProjectDocumentDto;
import com.arcadia.premium.model.ProjectDocument;
import com.arcadia.premium.service.ProjectDocumentService;
import org.apache.poi.openxml4j.util.ZipSecureFile;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.security.Principal;
import java.util.*;
import java.util.List;
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
     *  Admin/Partner see all; others see admin/partner docs + their own. */
    @GetMapping
    public ResponseEntity<List<ProjectDocumentDto>> listByProject(
            @RequestParam("projectName") String projectName,
            @RequestParam(value = "folderId", required = false) Long folderId,
            Principal principal) {
        boolean isAdminOrPartner = isCurrentUserAdminOrPartner();
        return ResponseEntity.ok(
            service.listByProjectAndFolder(projectName, folderId, principal.getName(), isAdminOrPartner));
    }

    private boolean isCurrentUserAdminOrPartner() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN") || a.equals("ROLE_PARTNER"));
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

    /** Delete a document — admin/partner can delete any; regular users only their own */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PROJECT_DOCUMENTS')")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        try {
            boolean isAdminOrPartner = isCurrentUserAdminOrPartner();
            service.delete(id, principal.getName(), isAdminOrPartner);
            return ResponseEntity.ok(Map.of("message", "Document deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /** Bulk delete documents — admin/partner can delete any; regular users only their own */
    @DeleteMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'PROJECT_DOCUMENTS')")
    public ResponseEntity<?> bulkDelete(@RequestBody Map<String, List<Long>> request, Principal principal) {
        try {
            List<Long> ids = request.get("ids");
            if (ids == null || ids.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No document IDs provided."));
            }
            boolean isAdminOrPartner = isCurrentUserAdminOrPartner();
            int count = service.deleteMultiple(ids, principal.getName(), isAdminOrPartner);
            return ResponseEntity.ok(Map.of("message", count + " document(s) deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<ProjectDocumentDto>> search(
            @RequestParam("q") String query,
            Principal principal) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.ok(List.of());
        }
        boolean isAdminOrPartner = isCurrentUserAdminOrPartner();
        return ResponseEntity.ok(service.searchDocuments(query.trim(), principal.getName(), isAdminOrPartner));
    }

    /**
     * Preview PPTX files as slide images.
     * Returns JSON array of base64-encoded PNG images (one per slide).
     */
    /**
     * Get slide count for a PPTX file (lightweight — just opens and counts).
     */
    @GetMapping("/{id}/slides")
    public ResponseEntity<?> getSlideCount(@PathVariable Long id) {
        try {
            ProjectDocument doc = service.getById(id);
            String ct = doc.getContentType().toLowerCase();
            if (!ct.contains("presentation") && !ct.contains("powerpoint")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Not a PowerPoint file"));
            }
            ZipSecureFile.setMinInflateRatio(0.0);
            try (ByteArrayInputStream bis = new ByteArrayInputStream(doc.getFileData());
                 XMLSlideShow ppt = new XMLSlideShow(bis)) {
                return ResponseEntity.ok(Map.of("totalSlides", ppt.getSlides().size()));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to read presentation: " + e.getMessage()));
        }
    }

    /**
     * Render a single slide as a JPEG image (on demand).
     * Returns raw image bytes — much more efficient than base64 JSON.
     */
    @GetMapping("/{id}/slides/{slideIndex}")
    public ResponseEntity<?> getSlideImage(@PathVariable Long id,
                                            @PathVariable int slideIndex,
                                            @RequestParam(value = "width", defaultValue = "960") int width) {
        try {
            ProjectDocument doc = service.getById(id);
            String ct = doc.getContentType().toLowerCase();
            if (!ct.contains("presentation") && !ct.contains("powerpoint")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Not a PowerPoint file"));
            }
            ZipSecureFile.setMinInflateRatio(0.0);
            try (ByteArrayInputStream bis = new ByteArrayInputStream(doc.getFileData());
                 XMLSlideShow ppt = new XMLSlideShow(bis)) {

                List<XSLFSlide> slides = ppt.getSlides();
                if (slideIndex < 0 || slideIndex >= slides.size()) {
                    return ResponseEntity.badRequest().body(Map.of("error",
                            "Slide index out of range. Total slides: " + slides.size()));
                }

                Dimension pgSize = ppt.getPageSize();
                double scale = (double) width / pgSize.getWidth();
                int imgW = width;
                int imgH = (int) (pgSize.getHeight() * scale);

                BufferedImage img = new BufferedImage(imgW, imgH, BufferedImage.TYPE_INT_RGB);
                Graphics2D g2 = img.createGraphics();
                g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
                g2.setPaint(Color.WHITE);
                g2.fill(new Rectangle2D.Double(0, 0, imgW, imgH));
                g2.transform(AffineTransform.getScaleInstance(scale, scale));

                try {
                    slides.get(slideIndex).draw(g2);
                } catch (Exception drawErr) {
                    g2.setPaint(Color.LIGHT_GRAY);
                    g2.setFont(new Font("Arial", Font.PLAIN, 14));
                    g2.drawString("Slide " + (slideIndex + 1) + " (partial render)", 20, 30);
                }
                g2.dispose();

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                // Use JPEG for smaller file size
                ImageIO.write(img, "jpg", baos);
                byte[] imageBytes = baos.toByteArray();

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.IMAGE_JPEG);
                headers.setContentLength(imageBytes.length);
                headers.setCacheControl("public, max-age=3600");
                return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to render slide: " + e.getMessage()));
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
