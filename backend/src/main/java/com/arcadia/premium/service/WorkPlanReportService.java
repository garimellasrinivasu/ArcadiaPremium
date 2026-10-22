package com.arcadia.premium.service;

import com.arcadia.premium.model.ClusterIncharge;
import com.arcadia.premium.model.VillaConstructionStatus;
import com.arcadia.premium.model.WorkPlanMailConfig;
import com.arcadia.premium.repository.ClusterInchargeRepository;
import com.arcadia.premium.repository.VillaConstructionStatusRepository;
import com.arcadia.premium.repository.WorkPlanMailConfigRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * Planned vs completed for any period (day / week / month), plus the daily and weekly work-plan emails.
 * A stage is "planned" in a period when its planned target date falls inside it; it counts as completed on
 * its actual completion date, or else the day it was ticked done in the app. Stages finished inside the
 * period that were not planned for it are reported separately as extra work.
 */
@Service
public class WorkPlanReportService {

    private static final Logger log = LoggerFactory.getLogger(WorkPlanReportService.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("dd-MMM-yyyy");
    private static final DateTimeFormatter DS = DateTimeFormatter.ofPattern("dd-MMM");

    public static final List<String> PHASES = List.of("EXCAVATION", "PCC", "FOOTINGS", "NECK_COLUMNS", "BACK_FILLING_COMPACTION",
            "PLINTH_BEAM", "COLUMNS", "GROUND_FLOOR_SLAB", "FIRST_FLOOR_COLUMNS", "FIRST_FLOOR_SLAB", "SECOND_FLOOR_COLUMNS", "SECOND_FLOOR_SLAB");
    private static final Map<String, String> LABELS = new LinkedHashMap<>();
    static {
        String[] l = {"Excavation", "PCC", "Footings", "Neck Columns", "Back Filling & Compaction", "Plinth Beam", "Ground Floor Columns",
                "Ground Floor Slab", "First Floor Columns", "First Floor Slab", "Second Floor Columns", "Second Floor Slab"};
        for (int i = 0; i < l.length; i++) LABELS.put(PHASES.get(i), l[i]);
    }

    private final VillaConstructionStatusRepository repository;
    private final ClusterInchargeRepository inchargeRepository;
    private final WorkPlanMailConfigRepository mailRepo;
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@arcadiapremium.com}")
    private String fromAddress;

    public WorkPlanReportService(VillaConstructionStatusRepository repository, ClusterInchargeRepository inchargeRepository,
                                 WorkPlanMailConfigRepository mailRepo, JavaMailSender mailSender) {
        this.repository = repository;
        this.inchargeRepository = inchargeRepository;
        this.mailRepo = mailRepo;
        this.mailSender = mailSender;
    }

    /** Stages ticked by a schedule import before the flag existed must not count as completed on the import day. */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfillImportedCompletions() {
        int n = repository.markImportedCompletions(LocalDate.of(2026, 10, 22).atStartOfDay());
        if (n > 0) log.info("Marked {} schedule-import completions as imported", n);
    }

    public static LocalDate today() { return LocalDate.now(IST); }

    /** The day a done stage was completed, or null when unknown (e.g. ticked by a schedule import). */
    private static LocalDate completionDay(VillaConstructionStatus s) {
        if (!s.isActivity1Done()) return null;
        if (s.getActualCompletionDate() != null) return s.getActualCompletionDate();
        if (s.getCompletedAt() != null) return s.getCompletedAt().toLocalDate();
        return null;
    }

    private Map<Integer, String> inchargeByVilla() {
        Map<Integer, String> m = new HashMap<>();
        for (ClusterIncharge ci : inchargeRepository.findByActiveTrueOrderByClusterNumberAsc()) {
            if (ci.getVillaNumbers() == null) continue;
            for (String v : ci.getVillaNumbers().split(",")) {
                try { m.putIfAbsent(Integer.parseInt(v.trim()), ci.getInchargeName()); } catch (NumberFormatException ignored) {}
            }
        }
        return m;
    }

    /** Planned vs completed between from and to (inclusive). */
    public Map<String, Object> report(String projectName, LocalDate from, LocalDate to) {
        if (to.isBefore(from)) throw new IllegalArgumentException("'to' is before 'from'");
        LocalDate today = today();
        Map<Integer, String> incharges = inchargeByVilla();
        List<Map<String, Object>> planned = new ArrayList<>();
        List<Map<String, Object>> extra = new ArrayList<>();
        Map<String, int[]> byPhase = new LinkedHashMap<>();   // planned, completed, extra
        Map<String, int[]> byCluster = new TreeMap<>();
        for (String p : PHASES) byPhase.put(p, new int[3]);
        int completed = 0, onTime = 0, late = 0, pending = 0, overdue = 0, notUpdated = 0;

        for (VillaConstructionStatus s : repository.findByProjectName(projectName)) {
            if (!LABELS.containsKey(s.getPhase())) continue;
            LocalDate plan = s.getPlannedTargetDate();
            LocalDate done = completionDay(s);
            boolean inPlan = plan != null && !plan.isBefore(from) && !plan.isAfter(to);
            boolean doneInPeriod = done != null && !done.isBefore(from) && !done.isAfter(to);
            String cluster = WorkExecutionReportService.VILLA_CLUSTER_MAP.getOrDefault(s.getVillaNumber(), "-");
            if (inPlan) {
                String status;
                if (s.isActivity1Done()) {
                    completed++;
                    if (done == null) status = "COMPLETED";
                    else if (!done.isAfter(plan)) { status = "ON_TIME"; onTime++; }
                    else { status = "LATE"; late++; }
                } else if (plan.isBefore(today)) { status = "OVERDUE"; overdue++; }
                else { status = "PENDING"; pending++; }
                if (s.isPlannedDateDefaulted()) notUpdated++;
                Map<String, Object> r = row(s, cluster, incharges, plan, done);
                r.put("status", status);
                if (s.isPlannedDateDefaulted()) r.put("notUpdated", true);
                if (done != null && done.isAfter(plan)) r.put("daysLate", ChronoUnit.DAYS.between(plan, done));
                if ("OVERDUE".equals(status)) r.put("daysOverdue", ChronoUnit.DAYS.between(plan, today));
                planned.add(r);
                byPhase.get(s.getPhase())[0]++;
                byCluster.computeIfAbsent(cluster, k -> new int[3])[0]++;
                if (s.isActivity1Done()) {
                    byPhase.get(s.getPhase())[1]++;
                    byCluster.get(cluster)[1]++;
                }
            } else if (doneInPeriod) {
                String reason = plan == null ? "NO_PLAN" : plan.isAfter(to) ? "AHEAD" : "BACKLOG";
                Map<String, Object> r = row(s, cluster, incharges, plan, done);
                r.put("reason", reason);
                if (plan != null) r.put("daysFromPlan", ChronoUnit.DAYS.between(plan, done));
                extra.add(r);
                byPhase.get(s.getPhase())[2]++;
                byCluster.computeIfAbsent(cluster, k -> new int[3])[2]++;
            }
        }
        Comparator<Map<String, Object>> order = Comparator
                .comparing((Map<String, Object> m) -> String.valueOf(m.getOrDefault("plannedDate", "9999")))
                .thenComparing(m -> PHASES.indexOf(String.valueOf(m.get("phase"))))
                .thenComparing(m -> (Integer) m.get("villa"));
        planned.sort(order);
        extra.sort(Comparator.comparing((Map<String, Object> m) -> String.valueOf(m.get("completedDate")))
                .thenComparing(m -> (Integer) m.get("villa")));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("projectName", projectName);
        out.put("from", from.toString());
        out.put("to", to.toString());
        out.put("today", today.toString());
        Map<String, Object> sum = new LinkedHashMap<>();
        sum.put("planned", planned.size());
        sum.put("completed", completed);
        sum.put("onTime", onTime);
        sum.put("late", late);
        sum.put("pending", pending);
        sum.put("overdue", overdue);
        sum.put("notUpdated", notUpdated);
        sum.put("extra", extra.size());
        sum.put("totalCompleted", completed + extra.size());
        sum.put("percent", planned.isEmpty() ? 0 : Math.round(completed * 100.0 / planned.size()));
        out.put("summary", sum);
        List<Map<String, Object>> phases = new ArrayList<>();
        byPhase.forEach((k, v) -> { if (v[0] + v[2] > 0) phases.add(Map.of("phase", k, "label", LABELS.get(k), "planned", v[0], "completed", v[1], "extra", v[2])); });
        out.put("byPhase", phases);
        List<Map<String, Object>> clusters = new ArrayList<>();
        byCluster.forEach((k, v) -> clusters.add(Map.of("cluster", k, "planned", v[0], "completed", v[1], "extra", v[2])));
        out.put("byCluster", clusters);
        out.put("planned", planned);
        out.put("extra", extra);
        return out;
    }

    private static Map<String, Object> row(VillaConstructionStatus s, String cluster, Map<Integer, String> incharges, LocalDate plan, LocalDate done) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("villa", s.getVillaNumber());
        r.put("cluster", cluster);
        r.put("phase", s.getPhase());
        r.put("stage", LABELS.get(s.getPhase()));
        String inc = s.getIncharge() != null && !s.getIncharge().isBlank() ? s.getIncharge() : incharges.get(s.getVillaNumber());
        r.put("incharge", inc == null ? "" : inc);
        if (plan != null) r.put("plannedDate", plan.toString());
        if (s.getRevisedPlannedDate() != null) r.put("revisedDate", s.getRevisedPlannedDate().toString());
        if (done != null) r.put("completedDate", done.toString());
        r.put("done", s.isActivity1Done());
        return r;
    }

    // ── Work-plan emails ─────────────────────────────────────────

    public WorkPlanMailConfig mailConfig(String projectName) {
        return mailRepo.findByProjectName(projectName).orElseGet(() -> {
            WorkPlanMailConfig c = new WorkPlanMailConfig();
            c.setProjectName(projectName);
            c.setRecipients("");
            return c;
        });
    }

    @Transactional
    public WorkPlanMailConfig saveMailConfig(String projectName, String recipients, boolean daily, boolean weekly) {
        List<String> list = parseRecipients(recipients);
        for (String r : list) if (!r.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) throw new IllegalArgumentException("Not a valid email address: " + r);
        WorkPlanMailConfig c = mailConfig(projectName);
        c.setRecipients(String.join(", ", list));
        c.setDailyEnabled(daily);
        c.setWeeklyEnabled(weekly);
        return mailRepo.save(c);
    }

    /** Daily at 7:00 AM IST: today's work plan + yesterday's planned vs completed. */
    @Scheduled(cron = "0 0 7 * * *", zone = "Asia/Kolkata")
    public void dailyMails() {
        for (WorkPlanMailConfig c : mailRepo.findAll()) {
            if (!c.isDailyEnabled()) continue;
            try { send(c.getProjectName(), "daily", "daily 7 AM"); } catch (Exception e) { log.warn("Daily work plan mail failed for {}: {}", c.getProjectName(), e.getMessage()); }
        }
    }

    /** Mondays at 7:30 AM IST: this week's work plan + last week's planned vs completed. */
    @Scheduled(cron = "0 30 7 * * MON", zone = "Asia/Kolkata")
    public void weeklyMails() {
        for (WorkPlanMailConfig c : mailRepo.findAll()) {
            if (!c.isWeeklyEnabled()) continue;
            try { send(c.getProjectName(), "weekly", "Monday 7:30 AM"); } catch (Exception e) { log.warn("Weekly work plan mail failed for {}: {}", c.getProjectName(), e.getMessage()); }
        }
    }

    /** Not transactional: the result is stored even when sending fails. */
    public String send(String projectName, String type, String trigger) {
        WorkPlanMailConfig c = mailConfig(projectName);
        List<String> to = parseRecipients(c.getRecipients());
        if (to.isEmpty()) throw new IllegalArgumentException("No email recipients configured for " + projectName);
        boolean weekly = "weekly".equals(type);
        String subject = (weekly ? "Weekly work plan — " : "Daily work plan — ") + projectName + " — " + periodLabel(type);
        String result;
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to.toArray(new String[0]));
            helper.setSubject(subject);
            helper.setText(mailHtml(projectName, type), true);
            mailSender.send(message);
            result = (weekly ? "Weekly" : "Daily") + " plan sent to " + to.size() + " recipient" + (to.size() == 1 ? "" : "s") + " (" + trigger + ")";
        } catch (Exception e) {
            log.error("Work plan email failed for {}: {}", projectName, e.getMessage());
            result = "Failed (" + type + ", " + trigger + "): " + e.getMessage();
        }
        c.setLastSentAt(LocalDateTime.now(IST));
        c.setLastSendResult(result);
        mailRepo.save(c);
        if (result.startsWith("Failed")) throw new IllegalStateException(result);
        return result;
    }

    private static String periodLabel(String type) {
        LocalDate t = today();
        if (!"weekly".equals(type)) return t.format(D);
        LocalDate mon = t.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        return mon.format(DS) + " to " + mon.plusDays(6).format(D);
    }

    /** Email body: the work plan for the coming day/week, then planned vs completed for the one just gone. */
    @SuppressWarnings("unchecked")
    public String mailHtml(String projectName, String type) {
        boolean weekly = "weekly".equals(type);
        LocalDate t = today();
        LocalDate planFrom = weekly ? t.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)) : t;
        LocalDate planTo = weekly ? planFrom.plusDays(6) : t;
        LocalDate prevFrom = weekly ? planFrom.minusDays(7) : t.minusDays(1);
        LocalDate prevTo = weekly ? planFrom.minusDays(1) : t.minusDays(1);

        Map<String, Object> plan = report(projectName, planFrom, planTo);
        Map<String, Object> prev = report(projectName, prevFrom, prevTo);
        // Still-open work that was due before this period (carried over)
        List<Map<String, Object>> carried = new ArrayList<>();
        for (Map<String, Object> r : (List<Map<String, Object>>) report(projectName, LocalDate.of(2000, 1, 1), planFrom.minusDays(1)).get("planned")) {
            if ("OVERDUE".equals(r.get("status"))) carried.add(r);
        }

        String th = "style='border:1px solid #ddd;padding:5px 8px;background:#1F4E5F;color:#fff;text-align:left;font-size:12px'";
        StringBuilder h = new StringBuilder("<div style='font-family:Arial,sans-serif;font-size:13px;color:#222'>");
        h.append("<h2 style='color:#1F4E5F;margin:0 0 2px'>").append(weekly ? "Weekly" : "Daily").append(" work plan — ").append(esc(projectName)).append("</h2>");
        h.append("<p style='color:#666;margin:0 0 12px'>").append(weekly ? "Week of " + planFrom.format(DS) + " to " + planTo.format(D) : t.format(DateTimeFormatter.ofPattern("EEEE, dd-MMM-yyyy"))).append("</p>");

        // 1. Work plan (assignment) grouped by cluster
        List<Map<String, Object>> todo = new ArrayList<>();
        for (Map<String, Object> r : (List<Map<String, Object>>) plan.get("planned")) if (!Boolean.TRUE.equals(r.get("done"))) todo.add(r);
        h.append("<h3 style='color:#1F4E5F;margin:10px 0 4px'>").append(weekly ? "Planned this week" : "Planned for today").append(" (").append(todo.size()).append(")</h3>");
        h.append(workTable(todo, th, weekly));
        if (!carried.isEmpty()) {
            h.append("<h3 style='color:#C00000;margin:14px 0 4px'>Overdue — planned earlier, still pending (").append(carried.size()).append(")</h3>");
            h.append(workTable(carried, th, true));
        }

        // 2. Planned vs completed for the previous day / week
        Map<String, Object> ps = (Map<String, Object>) prev.get("summary");
        h.append("<h3 style='color:#1F4E5F;margin:16px 0 4px'>").append(weekly ? "Last week (" + prevFrom.format(DS) + " – " + prevTo.format(DS) + ")" : "Yesterday (" + prevFrom.format(D) + ")")
         .append(": planned vs completed</h3>");
        h.append("<table style='border-collapse:collapse;margin-bottom:8px'><tr>");
        Object[][] cards = {{"Planned", ps.get("planned"), "#1F4E5F"}, {"Completed", ps.get("completed"), "#2E7D32"}, {"Not completed", ((Integer) ps.get("pending")) + ((Integer) ps.get("overdue")), "#C00000"},
                {"Extra (not planned)", ps.get("extra"), "#6A1B9A"}, {"Achieved", ps.get("percent") + "%", "#1F4E5F"}};
        for (Object[] c : cards) h.append("<td style='border:1px solid #ddd;padding:6px 12px;text-align:center'><div style='font-size:18px;font-weight:bold;color:").append(c[2]).append("'>").append(c[1]).append("</div><div style='color:#666;font-size:11px'>").append(c[0]).append("</div></td>");
        h.append("</tr></table>");
        List<Map<String, Object>> missed = new ArrayList<>();
        for (Map<String, Object> r : (List<Map<String, Object>>) prev.get("planned")) if (!Boolean.TRUE.equals(r.get("done"))) missed.add(r);
        if (!missed.isEmpty()) {
            h.append("<div style='font-weight:bold;color:#C00000;margin:8px 0 2px'>Planned but not completed</div>");
            h.append(workTable(missed, th, true));
        }
        List<Map<String, Object>> extra = (List<Map<String, Object>>) prev.get("extra");
        if (!extra.isEmpty()) {
            h.append("<div style='font-weight:bold;color:#6A1B9A;margin:10px 0 2px'>Extra work done — not planned for this ").append(weekly ? "week" : "day").append("</div>");
            h.append("<table style='border-collapse:collapse'><tr><th ").append(th).append(">Villa</th><th ").append(th).append(">Cluster</th><th ").append(th).append(">Stage</th><th ")
             .append(th).append(">Completed</th><th ").append(th).append(">Note</th></tr>");
            for (Map<String, Object> r : extra) {
                h.append("<tr style='background:#F3E5F5'>").append(td(r.get("villa"))).append(td(r.get("cluster"))).append(td(r.get("stage")))
                 .append(td(fmt((String) r.get("completedDate")))).append(td(extraNote(r))).append("</tr>");
            }
            h.append("</table>");
        }
        h.append("<p style='color:#888;font-size:11px;margin-top:14px'>Open Work Execution Updates → Plan vs Actual in Arcadia Premium for day / week / month reports.</p></div>");
        return h.toString();
    }

    public static String extraNote(Map<String, Object> r) {
        Object reason = r.get("reason");
        if ("NO_PLAN".equals(reason)) return "Not in the plan (no planned date)";
        long d = r.get("daysFromPlan") == null ? 0 : ((Number) r.get("daysFromPlan")).longValue();
        if ("AHEAD".equals(reason)) return "Ahead of plan — planned " + fmt((String) r.get("plannedDate")) + " (" + (-d) + " days early)";
        return "Backlog cleared — was planned " + fmt((String) r.get("plannedDate")) + " (" + d + " days late)";
    }

    private static String workTable(List<Map<String, Object>> rows, String th, boolean showDate) {
        if (rows.isEmpty()) return "<p style='color:#666;margin:2px 0'>Nothing planned.</p>";
        StringBuilder h = new StringBuilder("<table style='border-collapse:collapse'><tr>");
        for (String c : showDate ? new String[]{"Cluster", "Incharge", "Villa", "Stage", "Planned date", "Note"} : new String[]{"Cluster", "Incharge", "Villa", "Stage", "Note"})
            h.append("<th ").append(th).append(">").append(c).append("</th>");
        h.append("</tr>");
        List<Map<String, Object>> sorted = new ArrayList<>(rows);
        sorted.sort(Comparator.comparing((Map<String, Object> m) -> String.valueOf(m.get("cluster")))
                .thenComparing(m -> String.valueOf(m.getOrDefault("plannedDate", "")))
                .thenComparing(m -> (Integer) m.get("villa")));
        for (Map<String, Object> r : sorted) {
            boolean od = "OVERDUE".equals(r.get("status"));
            boolean nu = Boolean.TRUE.equals(r.get("notUpdated"));
            String note = od ? r.get("daysOverdue") + " days overdue" : "";
            if (nu) note = (note.isEmpty() ? "" : note + "; ") + "planned date not updated";
            h.append("<tr").append(od ? " style='background:#FDECEA'" : nu ? " style='background:#FFF8E1'" : "").append(">")
             .append(td(r.get("cluster"))).append(td(r.get("incharge"))).append(td(r.get("villa"))).append(td(r.get("stage")));
            if (showDate) h.append(td(fmt((String) r.get("plannedDate"))));
            h.append(td(note)).append("</tr>");
        }
        return h.append("</table>").toString();
    }

    private static String td(Object v) { return "<td style='border:1px solid #ddd;padding:5px 8px;font-size:12px'>" + esc(v == null ? "" : String.valueOf(v)) + "</td>"; }
    private static String fmt(String iso) { return iso == null ? "" : LocalDate.parse(iso).format(D); }
    private static String esc(String s) { return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"); }

    private static List<String> parseRecipients(String raw) {
        if (raw == null) return List.of();
        return Arrays.stream(raw.split("[,;\\s]+")).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
    }
}
