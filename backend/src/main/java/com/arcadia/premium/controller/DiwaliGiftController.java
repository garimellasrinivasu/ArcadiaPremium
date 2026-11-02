package com.arcadia.premium.controller;

import com.arcadia.premium.model.DiwaliGift;
import com.arcadia.premium.repository.DiwaliGiftRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/** Deewali gifts & invitations: recipients, addresses, contact numbers and who delivers each. */
@RestController
@RequestMapping("/api/diwali-gifts")
public class DiwaliGiftController {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final Set<String> STATUSES = Set.of("PLANNED", "PACKED", "DISPATCHED", "DELIVERED", "CANCELLED");
    private static final String VIEW = "hasRole('ADMIN') or @pageAccess.hasAnyAccess(authentication, 'DIWALI_INVITES')";
    private static final String EDIT = "hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'DIWALI_INVITES')";

    private final DiwaliGiftRepository repo;

    public DiwaliGiftController(DiwaliGiftRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize(VIEW)
    public List<DiwaliGift> list(@RequestParam(required = false) Integer year) {
        return repo.findByFestivalYearOrderByRecipientNameAsc(year != null ? year : LocalDate.now(IST).getYear());
    }

    @GetMapping("/years")
    @PreAuthorize(VIEW)
    public List<Integer> years() {
        List<Integer> y = new ArrayList<>(repo.findYears());
        int now = LocalDate.now(IST).getYear();
        if (!y.contains(now)) y.add(0, now);
        return y;
    }

    @PostMapping
    @PreAuthorize(EDIT)
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            DiwaliGift g = new DiwaliGift();
            g.setCreatedBy(auth.getName());
            g.setCreatedAt(LocalDateTime.now(IST));
            apply(g, body, auth.getName());
            return ResponseEntity.ok(repo.save(g));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize(EDIT)
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        try {
            DiwaliGift g = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("Not found"));
            apply(g, body, auth.getName());
            return ResponseEntity.ok(repo.save(g));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(EDIT)
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    /** Bulk add from Excel. A row with the same name and contact number in the same year updates that entry. */
    @PostMapping("/import")
    @PreAuthorize(EDIT)
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> importRows(@RequestBody Map<String, Object> body, Authentication auth) {
        List<Map<String, Object>> rows = (List<Map<String, Object>>) body.get("rows");
        if (rows == null || rows.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "No rows to import"));
        if (rows.size() > 3000) return ResponseEntity.badRequest().body(Map.of("error", "Too many rows (max 3000)"));
        int year = body.get("year") instanceof Number n ? n.intValue() : LocalDate.now(IST).getYear();
        List<DiwaliGift> existing = repo.findByFestivalYearOrderByRecipientNameAsc(year);
        int created = 0, updated = 0;
        List<String> errors = new ArrayList<>();
        int rowNo = 1;
        for (Map<String, Object> r : rows) {
            rowNo++;
            r.put("festivalYear", year);
            String name = str(r.get("recipientName")), phone = digits(str(r.get("contactNumber")));
            if (name == null) { errors.add("Row " + rowNo + ": name missing — skipped"); continue; }
            DiwaliGift g = existing.stream().filter(e -> e.getRecipientName().equalsIgnoreCase(name)
                    && Objects.equals(digits(e.getContactNumber()), phone)).findFirst().orElse(null);
            try {
                if (g == null) {
                    g = new DiwaliGift();
                    g.setCreatedBy(auth.getName());
                    g.setCreatedAt(LocalDateTime.now(IST));
                    apply(g, r, auth.getName());
                    existing.add(repo.save(g));
                    created++;
                } else {
                    Map<String, Object> merged = new HashMap<>();
                    r.forEach((k, v) -> { if (str(v) != null) merged.put(k, v); }); // blank cells keep current values
                    apply(g, merged, auth.getName());
                    repo.save(g);
                    updated++;
                }
            } catch (IllegalArgumentException e) {
                errors.add("Row " + rowNo + " (" + name + "): " + e.getMessage());
            }
        }
        return ResponseEntity.ok(Map.of("created", created, "updated", updated, "errors", errors));
    }

    private static void apply(DiwaliGift g, Map<String, Object> b, String user) {
        if (b.containsKey("recipientName")) {
            String n = str(b.get("recipientName"));
            if (n == null) throw new IllegalArgumentException("Name is required");
            g.setRecipientName(n);
        }
        if (g.getRecipientName() == null) throw new IllegalArgumentException("Name is required");
        if (b.containsKey("festivalYear")) g.setFestivalYear(Integer.valueOf(String.valueOf(b.get("festivalYear")).trim()));
        if (g.getFestivalYear() == null) g.setFestivalYear(LocalDate.now(IST).getYear());
        if (b.containsKey("organisation")) g.setOrganisation(str(b.get("organisation")));
        if (b.containsKey("category")) g.setCategory(upper(b.get("category")));
        if (b.containsKey("giftItem")) g.setGiftItem(str(b.get("giftItem")));
        if (b.containsKey("quantity")) {
            String q = str(b.get("quantity"));
            g.setQuantity(q == null ? null : (int) Double.parseDouble(q));
        }
        if (b.containsKey("address")) g.setAddress(str(b.get("address")));
        if (b.containsKey("city")) g.setCity(str(b.get("city")));
        if (b.containsKey("pincode")) g.setPincode(str(b.get("pincode")));
        if (b.containsKey("contactNumber")) g.setContactNumber(str(b.get("contactNumber")));
        if (b.containsKey("alternateNumber")) g.setAlternateNumber(str(b.get("alternateNumber")));
        if (b.containsKey("responsiblePerson")) g.setResponsiblePerson(str(b.get("responsiblePerson")));
        if (b.containsKey("deliveryMode")) g.setDeliveryMode(upper(b.get("deliveryMode")));
        if (b.containsKey("trackingNumber")) g.setTrackingNumber(str(b.get("trackingNumber")));
        if (b.containsKey("plannedDate")) g.setPlannedDate(date(b.get("plannedDate")));
        if (b.containsKey("invitationSent")) g.setInvitationSent(bool(b.get("invitationSent")));
        if (b.containsKey("remarks")) g.setRemarks(str(b.get("remarks")));
        if (b.containsKey("status")) {
            String s = upper(b.get("status"));
            if (s == null) s = "PLANNED";
            if (!STATUSES.contains(s)) throw new IllegalArgumentException("Unknown status " + s);
            if ("DELIVERED".equals(s) && !"DELIVERED".equals(g.getStatus()) && !b.containsKey("deliveredOn")) g.setDeliveredOn(LocalDate.now(IST));
            if (!"DELIVERED".equals(s)) g.setDeliveredOn(null);
            g.setStatus(s);
        }
        if (b.containsKey("deliveredOn") && "DELIVERED".equals(g.getStatus())) {
            LocalDate d = date(b.get("deliveredOn"));
            g.setDeliveredOn(d != null ? d : g.getDeliveredOn() != null ? g.getDeliveredOn() : LocalDate.now(IST));
        }
        g.setUpdatedBy(user);
        g.setUpdatedAt(LocalDateTime.now(IST));
    }

    private static String str(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }
    private static String upper(Object o) {
        String s = str(o);
        return s == null ? null : s.toUpperCase(Locale.ROOT).replace(' ', '_').replace('&', '_').replaceAll("_+", "_");
    }
    private static String digits(String s) { return s == null ? null : s.replaceAll("\\D", ""); }
    private static Boolean bool(Object o) {
        String s = str(o);
        return s != null && (s.equalsIgnoreCase("true") || s.equalsIgnoreCase("yes") || s.equalsIgnoreCase("y") || s.equals("1"));
    }
    private static LocalDate date(Object o) {
        String s = str(o);
        if (s == null) return null;
        for (String f : new String[]{"yyyy-MM-dd", "dd-MM-yyyy", "dd/MM/yyyy"}) {
            try { return LocalDate.parse(s, java.time.format.DateTimeFormatter.ofPattern(f)); } catch (Exception ignored) {}
        }
        throw new IllegalArgumentException("Not a date: " + s);
    }
}
