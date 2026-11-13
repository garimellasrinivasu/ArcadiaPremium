package com.arcadia.premium.controller;

import com.arcadia.premium.model.TripExpense;
import com.arcadia.premium.repository.TripExpenseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/** Vietnam trip expenses: each friend logs what they paid and who it was for; the page works out the settlement. */
@RestController
@RequestMapping("/api/trip-expenses")
public class TripExpenseController {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final String TRIP = "VIETNAM_2026";
    public static final List<String> FRIENDS = List.of(
            "MD Sir", "Narsireddy", "Venkat P", "Suresh K", "Prakash N", "Garimella", "Vamshi", "Sridhar", "Murali");
    private static final Set<String> CURRENCIES = Set.of("INR", "VND", "USD");
    private static final Set<String> CATEGORIES = Set.of("FOOD", "STAY", "TRAVEL", "SIGHTSEEING", "SHOPPING", "OTHER");
    private static final String VIEW = "hasRole('ADMIN') or @pageAccess.hasAnyAccess(authentication, 'VIETNAM_TRIP')";
    private static final String EDIT = "hasRole('ADMIN') or @pageAccess.hasAccess(authentication, 'VIETNAM_TRIP')";

    private final TripExpenseRepository repo;

    public TripExpenseController(TripExpenseRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    @PreAuthorize(VIEW)
    public Map<String, Object> list() {
        return Map.of("friends", FRIENDS, "expenses", repo.findByTripOrderByExpenseDateDescIdDesc(TRIP));
    }

    @PostMapping
    @PreAuthorize(EDIT)
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            TripExpense e = new TripExpense();
            e.setTrip(TRIP);
            e.setCreatedBy(auth.getName());
            e.setCreatedAt(LocalDateTime.now(IST));
            apply(e, body);
            return ResponseEntity.ok(repo.save(e));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize(EDIT)
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        try {
            TripExpense e = repo.findById(id).filter(x -> TRIP.equals(x.getTrip()))
                    .orElseThrow(() -> new IllegalArgumentException("Not found"));
            apply(e, body);
            e.setUpdatedBy(auth.getName());
            e.setUpdatedAt(LocalDateTime.now(IST));
            return ResponseEntity.ok(repo.save(e));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize(EDIT)
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repo.findById(id).filter(x -> TRIP.equals(x.getTrip())).ifPresent(repo::delete);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    private static void apply(TripExpense e, Map<String, Object> b) {
        String paidBy = str(b.get("paidBy"));
        if (paidBy == null || !FRIENDS.contains(paidBy)) throw new IllegalArgumentException("Choose who paid");
        String desc = str(b.get("description"));
        if (desc == null) throw new IllegalArgumentException("Enter what the amount was for");
        if (desc.length() > 200) desc = desc.substring(0, 200);
        double amount = num(b.get("amount"));
        if (!(amount > 0)) throw new IllegalArgumentException("Enter an amount greater than 0");
        String currency = Optional.ofNullable(str(b.get("currency"))).orElse("INR").toUpperCase();
        if (!CURRENCIES.contains(currency)) throw new IllegalArgumentException("Currency must be INR, VND or USD");
        double rate = "INR".equals(currency) ? 1 : num(b.get("rateToInr"));
        if (!(rate > 0)) throw new IllegalArgumentException("Enter the rupee rate for " + currency);
        String category = Optional.ofNullable(str(b.get("category"))).orElse("OTHER").toUpperCase();
        if (!CATEGORIES.contains(category)) category = "OTHER";

        Object sw = b.get("sharedWith");
        List<String> shared = new ArrayList<>();
        if (sw instanceof Collection<?> c) c.forEach(x -> { String s = str(x); if (s != null && FRIENDS.contains(s) && !shared.contains(s)) shared.add(s); });
        if (shared.isEmpty()) throw new IllegalArgumentException("Choose at least one friend to share this with");

        LocalDate date;
        try {
            String d = str(b.get("expenseDate"));
            date = d == null ? LocalDate.now(IST) : LocalDate.parse(d);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid date");
        }

        e.setPaidBy(paidBy);
        e.setDescription(desc);
        e.setCategory(category);
        e.setAmount(amount);
        e.setCurrency(currency);
        e.setRateToInr(rate);
        e.setAmountInr(Math.round(amount * rate * 100.0) / 100.0);
        e.setSharedWith(String.join("|", shared));
        e.setExpenseDate(date);
    }

    private static String str(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private static double num(Object o) {
        if (o instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(String.valueOf(o).replace(",", "").trim()); } catch (Exception ex) { return Double.NaN; }
    }
}
