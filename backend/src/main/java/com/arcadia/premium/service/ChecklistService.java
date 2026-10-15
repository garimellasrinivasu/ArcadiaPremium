package com.arcadia.premium.service;

import com.arcadia.premium.model.*;
import com.arcadia.premium.repository.*;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Document checklist pages: Sales Preparation Data (SALES_PREP) and RERA Documentation (RERA_DOCS).
 * Items per project with status/owner/target date, attached documents, per-user permissions,
 * and a summary email (on demand and nightly at 11 PM IST).
 */
@Service
public class ChecklistService {

    private static final Logger log = LoggerFactory.getLogger(ChecklistService.class);
    public static final Set<String> TRACKERS = Set.of(ChecklistTemplates.SALES_PREP, ChecklistTemplates.RERA_DOCS);
    public static final Set<String> STATUSES = Set.of("NOT_STARTED", "IN_PROGRESS", "COMPLETED", "NOT_APPLICABLE");
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final long MAX_SIZE = 2L * 1024 * 1024 * 1024; // 2 GB per file
    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    private final ChecklistItemRepository itemRepo;
    private final ChecklistDocumentRepository docRepo;
    private final ChecklistPermissionRepository permRepo;
    private final ChecklistMailConfigRepository mailRepo;
    private final ChecklistFolderRepository folderRepo;
    private final UserRepository userRepo;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@arcadiapremium.com}")
    private String fromAddress;

    @Value("${app.checklist.storage-dir:./data/checklist-files}")
    private String storageDir;

    @Value("${app.checklist.min-free-disk-mb:1500}")
    private long minFreeDiskMb;

    public ChecklistService(ChecklistItemRepository itemRepo, ChecklistDocumentRepository docRepo,
                            ChecklistPermissionRepository permRepo, ChecklistMailConfigRepository mailRepo,
                            ChecklistFolderRepository folderRepo, UserRepository userRepo, JavaMailSender mailSender) {
        this.folderRepo = folderRepo;
        this.itemRepo = itemRepo;
        this.docRepo = docRepo;
        this.permRepo = permRepo;
        this.mailRepo = mailRepo;
        this.userRepo = userRepo;
        this.mailSender = mailSender;
    }

    public static String pageLabel(String tracker) {
        return ChecklistTemplates.SALES_PREP.equals(tracker) ? "Sales Preparation Data" : "RERA Documentation";
    }

    static void requireTracker(String tracker) {
        if (!TRACKERS.contains(tracker)) throw new IllegalArgumentException("Unknown checklist: " + tracker);
    }

    // ── Permissions ─────────────────────────────────────────────

    public record Perms(boolean view, boolean upload, boolean download, boolean delete, boolean editStatus) {
        static final Perms ALL = new Perms(true, true, true, true, true);
        static final Perms NONE = new Perms(false, false, false, false, false);
    }

    /** Admins can do everything; others per their permission row. */
    public Perms permsFor(String email, boolean isAdmin, String tracker) {
        if (isAdmin) return Perms.ALL;
        return permRepo.findByUserEmailAndTrackerType(email, tracker)
                .map(p -> new Perms(p.isCanView(), p.isCanUpload(), p.isCanDownload(), p.isCanDelete(), p.isCanEditStatus()))
                .orElse(Perms.NONE);
    }

    public void require(boolean allowed, String action) {
        if (!allowed) throw new SecurityException("You don't have permission to " + action + " on this page.");
    }

    /** All users with their permissions for both pages (admin screen). */
    public List<Map<String, Object>> listPermissions() {
        Map<String, List<ChecklistPermission>> byUser = permRepo.findAll().stream()
                .collect(Collectors.groupingBy(ChecklistPermission::getUserEmail));
        List<Map<String, Object>> out = new ArrayList<>();
        for (User u : userRepo.findAll()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("email", u.getEmail());
            row.put("name", ((u.getFirstName() == null ? "" : u.getFirstName()) + " " + (u.getLastName() == null ? "" : u.getLastName())).trim());
            row.put("role", u.getRole() != null ? u.getRole().getName() : null);
            Map<String, Object> perTracker = new LinkedHashMap<>();
            for (String t : List.of(ChecklistTemplates.SALES_PREP, ChecklistTemplates.RERA_DOCS)) {
                ChecklistPermission p = byUser.getOrDefault(u.getEmail(), List.of()).stream()
                        .filter(x -> t.equals(x.getTrackerType())).findFirst().orElse(null);
                perTracker.put(t, Map.of(
                        "view", p != null && p.isCanView(), "upload", p != null && p.isCanUpload(),
                        "download", p != null && p.isCanDownload(), "delete", p != null && p.isCanDelete(),
                        "editStatus", p != null && p.isCanEditStatus()));
            }
            row.put("permissions", perTracker);
            out.add(row);
        }
        out.sort(Comparator.comparing(m -> String.valueOf(m.get("email"))));
        return out;
    }

    /**
     * Save one user's permissions for one page. "View" also adds/removes the page from the user's
     * menu (allowedPages), so the existing page-access rules keep working.
     */
    @Transactional
    public void savePermission(String email, String tracker, Map<String, Boolean> flags) {
        requireTracker(tracker);
        User user = userRepo.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        ChecklistPermission p = permRepo.findByUserEmailAndTrackerType(email, tracker).orElseGet(() -> {
            ChecklistPermission n = new ChecklistPermission();
            n.setUserEmail(email);
            n.setTrackerType(tracker);
            return n;
        });
        boolean view = Boolean.TRUE.equals(flags.get("view"));
        p.setCanView(view);
        // Anything beyond viewing implies viewing
        p.setCanUpload(view && Boolean.TRUE.equals(flags.get("upload")));
        p.setCanDownload(view && Boolean.TRUE.equals(flags.get("download")));
        p.setCanDelete(view && Boolean.TRUE.equals(flags.get("delete")));
        p.setCanEditStatus(view && Boolean.TRUE.equals(flags.get("editStatus")));
        permRepo.save(p);
        Set<String> pages = new HashSet<>(user.getAllowedPages() == null ? Set.of() : user.getAllowedPages());
        if (view) pages.add(tracker); else pages.remove(tracker);
        user.setAllowedPages(pages);
        if (!view && user.getViewOnlyPages() != null) {
            Set<String> vo = new HashSet<>(user.getViewOnlyPages());
            vo.remove(tracker);
            user.setViewOnlyPages(vo);
        }
        userRepo.save(user);
    }

    // ── Items ────────────────────────────────────────────────────

    private final Object seedLock = new Object();

    /**
     * Items for a project; the first time a project is opened its checklist is created from the template.
     * Not transactional on purpose: the page loads items and summary in parallel, and the seed must be
     * committed before the lock is released so the second request sees it instead of seeding again.
     */
    public List<ChecklistItem> items(String tracker, String project) {
        requireTracker(tracker);
        if (itemRepo.countByTrackerTypeAndProjectName(tracker, project) == 0) {
            synchronized (seedLock) {
                if (itemRepo.countByTrackerTypeAndProjectName(tracker, project) == 0) seed(tracker, project);
            }
        }
        return itemRepo.findByTrackerTypeAndProjectNameOrderBySortOrderAscIdAsc(tracker, project);
    }

    private void seed(String tracker, String project) {
        boolean withStatus = ChecklistTemplates.statusesApply(tracker, project);
        int order = 0;
        LocalDateTime now = LocalDateTime.now(IST);
        List<ChecklistItem> batch = new ArrayList<>();
        for (ChecklistTemplates.Item t : ChecklistTemplates.forTracker(tracker)) {
            ChecklistItem i = new ChecklistItem();
            i.setTrackerType(tracker);
            i.setProjectName(project);
            i.setSection(t.section());
            i.setSortOrder(order += 10);
            i.setTitle(t.title());
            i.setDetails(t.details());
            i.setOwner(t.owner());
            i.setStatus(withStatus ? t.status() : "NOT_STARTED");
            i.setCreatedAt(now);
            i.setUpdatedAt(now);
            i.setUpdatedBy("system (from shared checklist)");
            batch.add(i);
        }
        itemRepo.saveAll(batch); // one transaction: all items appear together
        log.info("Created {} checklist for project {} ({} items, statuses {})", tracker, project,
                ChecklistTemplates.forTracker(tracker).size(), withStatus ? "from sheet" : "not started");
    }

    public ChecklistItem item(String tracker, Long id) {
        ChecklistItem i = itemRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Item not found"));
        if (!i.getTrackerType().equals(tracker)) throw new IllegalArgumentException("Item not found");
        return i;
    }

    @Transactional
    public ChecklistItem update(String tracker, Long id, Map<String, Object> body, String user) {
        ChecklistItem i = item(tracker, id);
        if (body.containsKey("status")) {
            String s = String.valueOf(body.get("status"));
            if (!STATUSES.contains(s)) throw new IllegalArgumentException("Invalid status " + s);
            if ("COMPLETED".equals(s) && !"COMPLETED".equals(i.getStatus()) && i.getCompletedDate() == null) {
                i.setCompletedDate(LocalDate.now(IST));
            }
            if (!"COMPLETED".equals(s)) i.setCompletedDate(null);
            i.setStatus(s);
        }
        if (body.containsKey("owner")) i.setOwner(blankToNull(body.get("owner")));
        if (body.containsKey("technicalOwner")) i.setTechnicalOwner(blankToNull(body.get("technicalOwner")));
        if (body.containsKey("remarks")) i.setRemarks(blankToNull(body.get("remarks")));
        if (body.containsKey("details")) i.setDetails(blankToNull(body.get("details")));
        if (body.containsKey("title")) {
            String t = blankToNull(body.get("title"));
            if (t == null) throw new IllegalArgumentException("Title can't be empty");
            i.setTitle(t);
        }
        if (body.containsKey("section")) {
            String s = blankToNull(body.get("section"));
            if (s != null) i.setSection(s);
        }
        if (body.containsKey("targetDate")) i.setTargetDate(parseDate(body.get("targetDate")));
        if (body.containsKey("completedDate")) i.setCompletedDate(parseDate(body.get("completedDate")));
        i.setUpdatedBy(user);
        i.setUpdatedAt(LocalDateTime.now(IST));
        return itemRepo.save(i);
    }

    @Transactional
    public ChecklistItem create(String tracker, String project, Map<String, Object> body, String user) {
        requireTracker(tracker);
        List<ChecklistItem> existing = items(tracker, project);
        ChecklistItem i = new ChecklistItem();
        i.setTrackerType(tracker);
        i.setProjectName(project);
        String section = blankToNull(body.get("section"));
        i.setSection(section != null ? section : "Other");
        i.setSortOrder(existing.stream().mapToInt(ChecklistItem::getSortOrder).max().orElse(0) + 10);
        String title = blankToNull(body.get("title"));
        if (title == null) throw new IllegalArgumentException("Title is required");
        i.setTitle(title);
        i.setCreatedAt(LocalDateTime.now(IST));
        itemRepo.save(i);
        return update(tracker, i.getId(), body, user);
    }

    @Transactional
    public void deleteItem(String tracker, Long id) {
        ChecklistItem i = item(tracker, id);
        for (ChecklistDocument d : docRepo.findByItemId(i.getId())) deleteFileQuietly(d);
        docRepo.deleteByItemId(i.getId());
        folderRepo.deleteByItemId(i.getId());
        itemRepo.delete(i);
    }

    // ── Documents ────────────────────────────────────────────────

    public Map<Long, List<ChecklistDocumentRepository.Summary>> documentsFor(List<ChecklistItem> items) {
        if (items.isEmpty()) return Map.of();
        return docRepo.findByItemIdInOrderByUploadedAtDesc(items.stream().map(ChecklistItem::getId).toList())
                .stream().collect(Collectors.groupingBy(ChecklistDocumentRepository.Summary::getItemId));
    }

    private java.nio.file.Path root() throws IOException {
        java.nio.file.Path p = java.nio.file.Paths.get(storageDir).toAbsolutePath().normalize();
        java.nio.file.Files.createDirectories(p);
        return p;
    }

    /** Absolute path of a stored document; refuses paths that escape the storage folder. */
    public java.nio.file.Path fileOf(ChecklistDocument d) throws IOException {
        java.nio.file.Path root = root();
        java.nio.file.Path p = root.resolve(d.getStoragePath()).normalize();
        if (!p.startsWith(root)) throw new IllegalStateException("Invalid storage path");
        return p;
    }

    /** Streams the upload to disk (the file is never loaded into memory). */
    @Transactional
    public ChecklistDocument upload(String tracker, Long itemId, Long folderId, MultipartFile file, String user) throws IOException {
        ChecklistItem i = item(tracker, itemId);
        if (folderId != null) folder(tracker, folderId, i.getId());
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (file.getSize() > MAX_SIZE) throw new IllegalArgumentException("File is larger than the 2 GB limit");
        java.nio.file.Path root = root();
        long freeMb = java.nio.file.Files.getFileStore(root).getUsableSpace() / (1024 * 1024);
        if (freeMb - file.getSize() / (1024 * 1024) < minFreeDiskMb) {
            throw new IllegalStateException("The server disk is nearly full (" + freeMb + " MB free), so this file can't be stored safely. "
                    + "Please ask the administrator to increase the server disk.");
        }
        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String safe = original.replaceAll("[^A-Za-z0-9._ -]", "_");
        if (safe.length() > 120) safe = safe.substring(safe.length() - 120);
        String rel = tracker + "/" + i.getId() + "/" + UUID.randomUUID() + "-" + safe;
        java.nio.file.Path target = root.resolve(rel).normalize();
        java.nio.file.Files.createDirectories(target.getParent());
        file.transferTo(target);
        try {
            ChecklistDocument d = new ChecklistDocument();
            d.setItemId(i.getId());
            d.setFolderId(folderId);
            d.setFileName(original);
            d.setContentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
            d.setFileSize(java.nio.file.Files.size(target));
            d.setStoragePath(rel);
            d.setUploadedBy(user);
            d.setUploadedAt(LocalDateTime.now(IST));
            docRepo.save(d);
            i.setUpdatedBy(user);
            i.setUpdatedAt(LocalDateTime.now(IST));
            itemRepo.save(i);
            return d;
        } catch (RuntimeException e) {
            java.nio.file.Files.deleteIfExists(target); // don't leave orphan files behind
            throw e;
        }
    }

    public ChecklistDocument document(String tracker, Long docId) {
        ChecklistDocument d = docRepo.findById(docId).orElseThrow(() -> new IllegalArgumentException("Document not found"));
        item(tracker, d.getItemId()); // belongs to this page
        return d;
    }

    @Transactional
    public void deleteDocument(String tracker, Long docId) {
        ChecklistDocument d = document(tracker, docId);
        docRepo.delete(d);
        deleteFileQuietly(d);
    }

    private void deleteFileQuietly(ChecklistDocument d) {
        try {
            java.nio.file.Files.deleteIfExists(fileOf(d));
        } catch (Exception e) {
            log.warn("Could not delete stored file {}: {}", d.getStoragePath(), e.getMessage());
        }
    }

    // ── Sub-folders inside items ─────────────────────────────────

    private static final int MAX_FOLDER_DEPTH = 3; // folder / sub-folder / sub-sub-folder under an item

    public Map<Long, List<ChecklistFolder>> foldersFor(List<ChecklistItem> items) {
        if (items.isEmpty()) return Map.of();
        return folderRepo.findByItemIdInOrderByNameAsc(items.stream().map(ChecklistItem::getId).toList())
                .stream().collect(Collectors.groupingBy(ChecklistFolder::getItemId));
    }

    /** A folder that belongs to this page (and to the given item, when itemId is not null). */
    public ChecklistFolder folder(String tracker, Long folderId, Long itemId) {
        ChecklistFolder f = folderRepo.findById(folderId).orElseThrow(() -> new IllegalArgumentException("Folder not found"));
        item(tracker, f.getItemId());
        if (itemId != null && !itemId.equals(f.getItemId())) throw new IllegalArgumentException("Folder not found in this item");
        return f;
    }

    @Transactional
    public ChecklistFolder createFolder(String tracker, Long itemId, Long parentId, String name, String user) {
        ChecklistItem i = item(tracker, itemId);
        String n = blankToNull(name);
        if (n == null) throw new IllegalArgumentException("Folder name is required");
        int depth = 1;
        if (parentId != null) {
            ChecklistFolder p = folder(tracker, parentId, i.getId());
            for (ChecklistFolder x = p; x != null; x = x.getParentId() == null ? null : folderRepo.findById(x.getParentId()).orElse(null)) depth++;
        }
        if (depth > MAX_FOLDER_DEPTH) throw new IllegalArgumentException("Folders can be nested up to " + MAX_FOLDER_DEPTH + " levels inside an item");
        boolean exists = folderRepo.findByItemId(i.getId()).stream()
                .anyMatch(f -> Objects.equals(f.getParentId(), parentId) && f.getName().equalsIgnoreCase(n));
        if (exists) throw new IllegalArgumentException("A folder named \"" + n + "\" already exists here");
        ChecklistFolder f = new ChecklistFolder();
        f.setItemId(i.getId());
        f.setParentId(parentId);
        f.setName(n);
        f.setCreatedBy(user);
        f.setCreatedAt(LocalDateTime.now(IST));
        return folderRepo.save(f);
    }

    @Transactional
    public ChecklistFolder renameFolder(String tracker, Long folderId, String name) {
        ChecklistFolder f = folder(tracker, folderId, null);
        String n = blankToNull(name);
        if (n == null) throw new IllegalArgumentException("Folder name is required");
        f.setName(n);
        return folderRepo.save(f);
    }

    /** Deletes the folder, its sub-folders and every file in them. */
    @Transactional
    public int deleteFolder(String tracker, Long folderId) {
        ChecklistFolder root = folder(tracker, folderId, null);
        List<ChecklistFolder> all = folderRepo.findByItemId(root.getItemId());
        Set<Long> ids = new HashSet<>(List.of(root.getId()));
        boolean grew = true;
        while (grew) {
            grew = false;
            for (ChecklistFolder f : all) if (f.getParentId() != null && ids.contains(f.getParentId()) && ids.add(f.getId())) grew = true;
        }
        List<ChecklistDocument> docs = docRepo.findByFolderIdIn(ids);
        for (ChecklistDocument d : docs) { docRepo.delete(d); deleteFileQuietly(d); }
        folderRepo.deleteAllById(ids);
        return docs.size();
    }

    // ── Summary ──────────────────────────────────────────────────

    public Map<String, Object> summary(String tracker, String project) {
        List<ChecklistItem> items = items(tracker, project);
        LocalDate today = LocalDate.now(IST);
        Map<String, Object> s = new LinkedHashMap<>();
        long total = items.stream().filter(i -> !"NOT_APPLICABLE".equals(i.getStatus())).count();
        long completed = count(items, "COMPLETED"), inProgress = count(items, "IN_PROGRESS"), notStarted = count(items, "NOT_STARTED");
        List<ChecklistItem> open = items.stream().filter(i -> isOpen(i)).toList();
        List<ChecklistItem> overdue = open.stream().filter(i -> i.getTargetDate() != null && i.getTargetDate().isBefore(today)).toList();
        List<ChecklistItem> dueSoon = open.stream().filter(i -> i.getTargetDate() != null && !i.getTargetDate().isBefore(today)
                && !i.getTargetDate().isAfter(today.plusDays(7))).toList();
        s.put("total", total);
        s.put("completed", completed);
        s.put("inProgress", inProgress);
        s.put("notStarted", notStarted);
        s.put("notApplicable", count(items, "NOT_APPLICABLE"));
        s.put("overdue", overdue.size());
        s.put("dueThisWeek", dueSoon.size());
        s.put("noTargetDate", open.stream().filter(i -> i.getTargetDate() == null).count());
        s.put("percentComplete", total == 0 ? 0 : Math.round(completed * 100.0 / total));
        // Owner-wise
        Map<String, Map<String, Object>> owners = new TreeMap<>();
        for (ChecklistItem i : items) {
            if ("NOT_APPLICABLE".equals(i.getStatus())) continue;
            String o = i.getOwner() == null || i.getOwner().isBlank() ? "Unassigned" : i.getOwner().trim();
            Map<String, Object> m = owners.computeIfAbsent(o, k -> new LinkedHashMap<>(Map.of(
                    "owner", k, "total", 0L, "completed", 0L, "pending", 0L, "overdue", 0L)));
            m.put("total", (long) m.get("total") + 1);
            if ("COMPLETED".equals(i.getStatus())) m.put("completed", (long) m.get("completed") + 1);
            else {
                m.put("pending", (long) m.get("pending") + 1);
                if (i.getTargetDate() != null && i.getTargetDate().isBefore(today)) m.put("overdue", (long) m.get("overdue") + 1);
                LocalDate next = (LocalDate) m.get("nextTarget");
                if (i.getTargetDate() != null && (next == null || i.getTargetDate().isBefore(next))) m.put("nextTarget", i.getTargetDate());
            }
        }
        s.put("owners", new ArrayList<>(owners.values()));
        // Section-wise
        Map<String, long[]> sections = new LinkedHashMap<>();
        for (ChecklistItem i : items) {
            if ("NOT_APPLICABLE".equals(i.getStatus())) continue;
            long[] a = sections.computeIfAbsent(i.getSection(), k -> new long[2]);
            a[0]++;
            if ("COMPLETED".equals(i.getStatus())) a[1]++;
        }
        s.put("sections", sections.entrySet().stream().map(e -> Map.of("section", e.getKey(), "total", e.getValue()[0], "completed", e.getValue()[1])).toList());
        s.put("upcoming", open.stream().filter(i -> i.getTargetDate() != null)
                .sorted(Comparator.comparing(ChecklistItem::getTargetDate)).limit(10)
                .map(i -> Map.of("id", i.getId(), "title", i.getTitle(), "owner", Objects.toString(i.getOwner(), ""),
                        "targetDate", i.getTargetDate().toString(), "status", i.getStatus(),
                        "overdue", i.getTargetDate().isBefore(today)))
                .toList());
        return s;
    }

    private static boolean isOpen(ChecklistItem i) {
        return !"COMPLETED".equals(i.getStatus()) && !"NOT_APPLICABLE".equals(i.getStatus());
    }

    private static long count(List<ChecklistItem> items, String status) {
        return items.stream().filter(i -> status.equals(i.getStatus())).count();
    }

    // ── Summary email ────────────────────────────────────────────

    public ChecklistMailConfig mailConfig(String tracker, String project) {
        requireTracker(tracker);
        return mailRepo.findByTrackerTypeAndProjectName(tracker, project).orElseGet(() -> {
            ChecklistMailConfig c = new ChecklistMailConfig();
            c.setTrackerType(tracker);
            c.setProjectName(project);
            c.setRecipients("");
            c.setDailyEnabled(false);
            return c;
        });
    }

    @Transactional
    public ChecklistMailConfig saveMailConfig(String tracker, String project, String recipients, boolean dailyEnabled) {
        List<String> list = parseRecipients(recipients);
        for (String r : list) {
            if (!r.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) throw new IllegalArgumentException("Not a valid email address: " + r);
        }
        ChecklistMailConfig c = mailConfig(tracker, project);
        c.setRecipients(String.join(", ", list));
        c.setDailyEnabled(dailyEnabled);
        return mailRepo.save(c);
    }

    /** Not transactional: the last-send result must be stored even when sending fails. */
    public String sendSummary(String tracker, String project, String trigger) {
        ChecklistMailConfig c = mailConfig(tracker, project);
        List<String> to = parseRecipients(c.getRecipients());
        if (to.isEmpty()) throw new IllegalArgumentException("No email recipients configured for this page and project.");
        String result;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to.toArray(new String[0]));
            helper.setSubject(pageLabel(tracker) + " summary — " + project + " — " + LocalDate.now(IST).format(D));
            helper.setText(summaryHtml(tracker, project), true);
            mailSender.send(message);
            result = "Sent to " + to.size() + " recipient" + (to.size() == 1 ? "" : "s") + " (" + trigger + ")";
        } catch (Exception e) {
            log.error("Checklist summary email failed for {} / {}: {}", tracker, project, e.getMessage());
            result = "Failed (" + trigger + "): " + e.getMessage();
        }
        c.setLastSentAt(LocalDateTime.now(IST));
        c.setLastSendResult(result);
        mailRepo.save(c);
        if (result.startsWith("Failed")) throw new IllegalStateException(result);
        return result;
    }

    /** Nightly summary at 11 PM IST for every page/project with the daily email switched on. */
    @Scheduled(cron = "0 0 23 * * *", zone = "Asia/Kolkata")
    public void nightlySummaries() {
        for (ChecklistMailConfig c : mailRepo.findByDailyEnabledTrue()) {
            try {
                sendSummary(c.getTrackerType(), c.getProjectName(), "daily 11 PM");
            } catch (Exception e) {
                log.warn("Nightly checklist summary skipped for {} / {}: {}", c.getTrackerType(), c.getProjectName(), e.getMessage());
            }
        }
    }

    @SuppressWarnings("unchecked")
    public String summaryHtml(String tracker, String project) {
        Map<String, Object> s = summary(tracker, project);
        List<ChecklistItem> items = items(tracker, project);
        LocalDate today = LocalDate.now(IST);
        StringBuilder h = new StringBuilder();
        String td = "style='border:1px solid #ddd;padding:6px 8px'";
        String th = "style='border:1px solid #ddd;padding:6px 8px;background:#1F4E5F;color:#fff;text-align:left'";
        h.append("<div style='font-family:Arial,sans-serif;font-size:13px;color:#222'>");
        h.append("<h2 style='color:#1F4E5F;margin:0 0 4px'>").append(esc(pageLabel(tracker))).append(" — ").append(esc(project)).append("</h2>");
        h.append("<p style='color:#666;margin:0 0 12px'>Status as on ").append(LocalDateTime.now(IST).format(DateTimeFormatter.ofPattern("dd-MMM-yyyy hh:mm a"))).append(" IST</p>");
        h.append("<table style='border-collapse:collapse;margin-bottom:14px'><tr>");
        for (String[] k : new String[][]{{"Total", "total"}, {"Completed", "completed"}, {"In progress", "inProgress"}, {"Not started", "notStarted"}, {"Overdue", "overdue"}, {"Due in 7 days", "dueThisWeek"}, {"% complete", "percentComplete"}}) {
            h.append("<td style='border:1px solid #ddd;padding:8px 12px;text-align:center'><div style='font-size:20px;font-weight:bold;color:")
             .append("overdue".equals(k[1]) && ((Number) s.get("overdue")).intValue() > 0 ? "#C00000" : "#1F4E5F").append("'>")
             .append(s.get(k[1])).append("percentComplete".equals(k[1]) ? "%" : "").append("</div><div style='color:#666'>").append(k[0]).append("</div></td>");
        }
        h.append("</tr></table>");
        // Owner-wise
        h.append("<h3 style='color:#1F4E5F;margin:8px 0 4px'>By SPG owner</h3><table style='border-collapse:collapse'><tr>")
         .append("<th ").append(th).append(">SPG owner</th><th ").append(th).append(">Total</th><th ").append(th).append(">Completed</th><th ")
         .append(th).append(">Pending</th><th ").append(th).append(">Overdue</th><th ").append(th).append(">Next target</th></tr>");
        for (Map<String, Object> o : (List<Map<String, Object>>) s.get("owners")) {
            LocalDate next = (LocalDate) o.get("nextTarget");
            h.append("<tr><td ").append(td).append(">").append(esc(String.valueOf(o.get("owner")))).append("</td><td ").append(td).append(">").append(o.get("total"))
             .append("</td><td ").append(td).append(">").append(o.get("completed")).append("</td><td ").append(td).append(">").append(o.get("pending"))
             .append("</td><td ").append(td).append(" style='color:#C00000'>").append(o.get("overdue")).append("</td><td ").append(td).append(">")
             .append(next == null ? "—" : next.format(D)).append("</td></tr>");
        }
        h.append("</table>");
        // Item-wise summary (all items, grouped by section)
        h.append("<h3 style='color:#1F4E5F;margin:14px 0 4px'>Item summary (").append(items.size()).append(")</h3>");
        h.append("<table style='border-collapse:collapse'><tr>");
        for (String c : new String[]{"#", "Section", "Item", "Description", "SPG owner", "Technical owner", "Status", "Target date", "Completed on", "Remarks"})
            h.append("<th ").append(th).append(">").append(c).append("</th>");
        h.append("</tr>");
        int n = 0;
        for (ChecklistItem i : items) {
            boolean late = isOpen(i) && i.getTargetDate() != null && i.getTargetDate().isBefore(today);
            String due = i.getTargetDate() == null ? "Not set" : i.getTargetDate().format(D)
                    + (late ? " (" + ChronoUnit.DAYS.between(i.getTargetDate(), today) + " days overdue)" : "");
            String statusColor = switch (i.getStatus()) {
                case "COMPLETED" -> "#2E7D32"; case "IN_PROGRESS" -> "#1565C0"; case "NOT_APPLICABLE" -> "#888"; default -> "#555";
            };
            h.append("<tr").append(late ? " style='background:#FDECEA'" : "").append(">");
            h.append("<td ").append(td).append(">").append(++n).append("</td>");
            h.append("<td ").append(td).append(">").append(esc(i.getSection())).append("</td>");
            h.append("<td ").append(td).append("><b>").append(esc(i.getTitle())).append("</b></td>");
            h.append("<td ").append(td).append(">").append(esc(Objects.toString(i.getDetails(), ""))).append("</td>");
            h.append("<td ").append(td).append(">").append(esc(Objects.toString(i.getOwner(), "—"))).append("</td>");
            h.append("<td ").append(td).append(">").append(esc(Objects.toString(i.getTechnicalOwner(), "—"))).append("</td>");
            h.append("<td style='border:1px solid #ddd;padding:6px 8px;color:").append(statusColor).append(";font-weight:bold'>").append(statusLabel(i.getStatus())).append("</td>");
            h.append("<td style='border:1px solid #ddd;padding:6px 8px").append(late ? ";color:#C00000;font-weight:bold" : "").append("'>").append(due).append("</td>");
            h.append("<td ").append(td).append(">").append(i.getCompletedDate() == null ? "—" : i.getCompletedDate().format(D)).append("</td>");
            h.append("<td ").append(td).append(">").append(esc(Objects.toString(i.getRemarks(), ""))).append("</td></tr>");
        }
        h.append("</table>");
        long recentlyDone = items.stream().filter(i -> i.getCompletedDate() != null && !i.getCompletedDate().isBefore(today.minusDays(1))).count();
        h.append("<p style='color:#666;margin-top:14px'>Completed today/yesterday: ").append(recentlyDone)
         .append(". Open the ").append(esc(pageLabel(tracker))).append(" page in Arcadia Premium for documents and details.</p></div>");
        return h.toString();
    }

    // ── helpers ──────────────────────────────────────────────────

    private static String statusLabel(String s) {
        return switch (s) {
            case "COMPLETED" -> "Completed"; case "IN_PROGRESS" -> "In progress"; case "NOT_APPLICABLE" -> "Not applicable"; default -> "Not started";
        };
    }

    private static List<String> parseRecipients(String raw) {
        if (raw == null) return List.of();
        return Arrays.stream(raw.split("[,;\\s]+")).map(String::trim).filter(x -> !x.isEmpty()).distinct().toList();
    }

    private static String blankToNull(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private static LocalDate parseDate(Object o) {
        String s = blankToNull(o);
        return s == null ? null : LocalDate.parse(s.length() > 10 ? s.substring(0, 10) : s);
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
