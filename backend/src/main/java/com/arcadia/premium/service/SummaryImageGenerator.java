package com.arcadia.premium.service;

import com.arcadia.premium.model.VillaConstructionStatus;
import com.arcadia.premium.repository.VillaConstructionStatusRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.RoundRectangle2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SummaryImageGenerator {

    private static final Logger log = LoggerFactory.getLogger(SummaryImageGenerator.class);

    // --- Layout constants ---
    private static final int IMG_WIDTH = 1400;
    private static final int PADDING = 30;
    private static final int CARD_PADDING = 20;
    private static final int SECTION_GAP = 30;
    private static final int ARC = 16; // rounded corner radius

    // --- Colors ---
    private static final Color COLOR_WHITE = new Color(255, 255, 255);
    private static final Color COLOR_CARD_BG = new Color(249, 250, 251);       // #f9fafb
    private static final Color COLOR_CARD_BORDER = new Color(229, 231, 235);   // #e5e7eb
    private static final Color COLOR_TEXT_PRIMARY = new Color(17, 24, 39);      // #111827
    private static final Color COLOR_TEXT_SECONDARY = new Color(107, 114, 128); // #6b7280
    private static final Color COLOR_TEXT_MUTED = new Color(156, 163, 175);     // #9ca3af
    private static final Color COLOR_TRACK = new Color(229, 231, 235);         // #e5e7eb
    private static final Color COLOR_BLUE = new Color(37, 99, 235);            // #2563eb
    private static final Color COLOR_GREEN = new Color(22, 163, 74);           // #16a34a
    private static final Color COLOR_ORANGE = new Color(217, 119, 6);          // #d97706
    private static final Color COLOR_PURPLE = new Color(147, 51, 234);         // #9333ea
    private static final Color COLOR_RED = new Color(220, 38, 38);             // #dc2626
    private static final Color COLOR_BLUE_LIGHT = new Color(219, 234, 254);    // #dbeafe
    private static final Color COLOR_GREEN_LIGHT = new Color(220, 252, 231);   // #dcfce7
    private static final Color COLOR_ORANGE_LIGHT = new Color(254, 243, 199);  // #fef3c7
    private static final Color COLOR_PURPLE_LIGHT = new Color(243, 232, 255);  // #f3e8ff
    private static final Color COLOR_PROGRESS_BG = new Color(243, 244, 246);   // #f3f4f6

    // --- Phases ---
    private static final String[] PHASES = {
            "EXCAVATION", "PCC", "FOOTINGS", "NECK_COLUMNS", "BACK_FILLING_COMPACTION",
            "PLINTH_BEAM", "COLUMNS", "GROUND_FLOOR_SLAB", "FIRST_FLOOR_SLAB", "SECOND_FLOOR_SLAB"
    };

    private static final Map<String, String> PHASE_LABELS = new LinkedHashMap<>();
    static {
        PHASE_LABELS.put("EXCAVATION", "Excavation");
        PHASE_LABELS.put("PCC", "PCC");
        PHASE_LABELS.put("FOOTINGS", "Footings");
        PHASE_LABELS.put("NECK_COLUMNS", "Neck Columns");
        PHASE_LABELS.put("BACK_FILLING_COMPACTION", "Back Filling & Compaction");
        PHASE_LABELS.put("PLINTH_BEAM", "Plinth Beam");
        PHASE_LABELS.put("COLUMNS", "Columns");
        PHASE_LABELS.put("GROUND_FLOOR_SLAB", "Ground Floor Slab");
        PHASE_LABELS.put("FIRST_FLOOR_SLAB", "First Floor Slab");
        PHASE_LABELS.put("SECOND_FLOOR_SLAB", "Second Floor Slab");
    }

    private static final int TOTAL_VILLAS = 237;
    private static final int TOTAL_PHASES = 10;
    private static final int TOTAL_ACTIVITIES = TOTAL_VILLAS * TOTAL_PHASES; // 2370

    // --- Cluster definitions ---
    private static final int[] CLUSTER_1_VILLAS = {
            1,2,3,4,17,18,19,20,21,22,23,24,25,26,55,56,57,58,59,60,61,62,63,64,65,66,67,
            100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,
            149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,
            202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221
    };

    private static final int[] CLUSTER_2_VILLAS = {
            9,10,11,12,13,14,15,16,27,28,29,30,31,32,49,50,51,52,53,54,
            68,69,70,71,72,73,94,95,96,97,98,99,
            115,116,117,118,119,120,143,144,145,146,147,148,
            167,168,169,170,171,172,173,174,194,195,196,197,198,199,200,201,
            222,223,224,225,226,227,228,229
    };

    private static final int[] CLUSTER_3_VILLAS = {
            5,6,7,8,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,
            74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93
    };

    private static final int[] CLUSTER_4_VILLAS = {
            121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,
            175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
            230,231,232,233,234,235,236,237
    };

    private final VillaConstructionStatusRepository repository;

    public SummaryImageGenerator(VillaConstructionStatusRepository repository) {
        this.repository = repository;
    }

    /**
     * Generate a PNG image of the Work Execution Summary dashboard.
     *
     * @param projectName the project name to query data for
     * @return PNG image bytes
     */
    public byte[] generateSummaryImage(String projectName) {
        // Fetch data
        List<VillaConstructionStatus> allStatuses = repository.findByProjectName(projectName);
        Map<String, Object> summary = buildSummary(allStatuses, projectName);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> phases = (List<Map<String, Object>>) summary.get("phases");
        int totalCompleted = ((Number) summary.get("totalCompleted")).intValue();
        int totalInProgress = ((Number) summary.get("totalInProgress")).intValue();
        int totalNotStarted = ((Number) summary.get("totalNotStarted")).intValue();

        // Build cluster data
        Set<Integer> villaSet1 = toSet(CLUSTER_1_VILLAS);
        Set<Integer> villaSet2 = toSet(CLUSTER_2_VILLAS);
        Set<Integer> villaSet3 = toSet(CLUSTER_3_VILLAS);
        Set<Integer> villaSet4 = toSet(CLUSTER_4_VILLAS);

        Map<String, Object> cluster1 = buildClusterData("Cluster 1", villaSet1, allStatuses);
        Map<String, Object> cluster2 = buildClusterData("Cluster 2", villaSet2, allStatuses);
        Map<String, Object> cluster3 = buildClusterData("Cluster 3", villaSet3, allStatuses);
        Map<String, Object> cluster4 = buildClusterData("Cluster 4", villaSet4, allStatuses);

        // --- Calculate dynamic image height ---
        // Section 1: Overall progress
        int section1Height = 140;
        // Section 2: Cluster-wise summary (2 rows of 2 cluster cards)
        int clusterCardHeight = 60 + TOTAL_PHASES * 28 + 20; // header + phase rows + bottom padding
        int section2Height = 50 + clusterCardHeight * 2 + 20 + 20; // title + 2 card rows + inter-row gap + bottom
        // Section 3: Phase-wise summary
        int phaseCardHeight = 100;
        int section3Height = 50 + phaseCardHeight * 2 + 15 + 20; // title + 2 rows + gap between rows + bottom

        int totalHeight = PADDING + section1Height + SECTION_GAP + section2Height + SECTION_GAP + section3Height + PADDING;

        // --- Create image ---
        BufferedImage image = new BufferedImage(IMG_WIDTH, totalHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // Enable anti-aliasing
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_LCD_HRGB);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        // White background
        g.setColor(COLOR_WHITE);
        g.fillRect(0, 0, IMG_WIDTH, totalHeight);

        int y = PADDING;

        // ============================================================
        // SECTION 1: Overall Construction Progress
        // ============================================================
        y = drawOverallProgress(g, y, totalCompleted, phases);

        y += SECTION_GAP;

        // ============================================================
        // SECTION 2: Cluster-wise Summary
        // ============================================================
        y = drawClusterSection(g, y, cluster1, cluster2, cluster3, cluster4);

        y += SECTION_GAP;

        // ============================================================
        // SECTION 3: Phase-wise Summary
        // ============================================================
        drawPhaseSection(g, y, phases);

        g.dispose();

        // Write PNG
        try {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", bos);
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate summary image: {}", e.getMessage(), e);
            return new byte[0];
        }
    }

    // ================================================================
    // Section drawing methods
    // ================================================================

    private int drawOverallProgress(Graphics2D g, int y, int totalCompleted,
                                    List<Map<String, Object>> phases) {
        int cardX = PADDING;
        int cardW = IMG_WIDTH - 2 * PADDING;
        int cardH = 130;

        // Card background
        drawRoundedCard(g, cardX, y, cardW, cardH, COLOR_CARD_BG, COLOR_CARD_BORDER);

        int cx = cardX + CARD_PADDING;
        int cy = y + CARD_PADDING;

        // Title row
        Font titleFont = new Font("SansSerif", Font.BOLD, 18);
        g.setFont(titleFont);
        g.setColor(COLOR_TEXT_PRIMARY);
        g.drawString("Overall Construction Progress", cx, cy + 18);

        // Percentage on right
        double overallPct = TOTAL_ACTIVITIES > 0 ? (totalCompleted * 100.0 / TOTAL_ACTIVITIES) : 0;
        String pctStr = String.format("%.0f%%", overallPct);
        Font pctFont = new Font("SansSerif", Font.BOLD, 22);
        g.setFont(pctFont);
        Color pctColor = overallPct == 0 ? COLOR_RED : (overallPct < 50 ? COLOR_ORANGE : COLOR_GREEN);
        g.setColor(pctColor);
        int pctWidth = g.getFontMetrics().stringWidth(pctStr);
        g.drawString(pctStr, cardX + cardW - CARD_PADDING - pctWidth, cy + 20);

        // Progress bar
        int barY = cy + 38;
        int barW = cardW - 2 * CARD_PADDING;
        int barH = 18;
        drawProgressBar(g, cx, barY, barW, barH, overallPct / 100.0, COLOR_BLUE, 9);

        // Subtitle text
        cy = barY + barH + 14;
        Font subtitleFont = new Font("SansSerif", Font.PLAIN, 14);
        g.setFont(subtitleFont);
        g.setColor(COLOR_TEXT_SECONDARY);
        String subtitle = totalCompleted + " of " + TOTAL_ACTIVITIES + " activities completed across " + TOTAL_VILLAS + " villas";
        g.drawString(subtitle, cx, cy + 12);

        return y + cardH;
    }

    private int drawClusterSection(Graphics2D g, int y, Map<String, Object> c1,
                                   Map<String, Object> c2, Map<String, Object> c3, Map<String, Object> c4) {
        int cx = PADDING;

        // Section title
        Font sectionFont = new Font("SansSerif", Font.BOLD, 18);
        g.setFont(sectionFont);
        g.setColor(COLOR_TEXT_PRIMARY);
        g.drawString("Cluster-wise Summary", cx, y + 18);
        y += 36;

        // 4 cluster cards: 2 per row
        int gap = 20;
        int cardW = (IMG_WIDTH - 2 * PADDING - gap) / 2;
        int phaseRowHeight = 28;
        int cardH = 70 + TOTAL_PHASES * phaseRowHeight + 10;

        Color[] accentColors = {COLOR_BLUE, COLOR_GREEN, COLOR_ORANGE, COLOR_PURPLE};
        Color[] lightColors = {COLOR_BLUE_LIGHT, COLOR_GREEN_LIGHT, COLOR_ORANGE_LIGHT, COLOR_PURPLE_LIGHT};
        @SuppressWarnings("unchecked")
        Map<String, Object>[] clusters = new Map[]{c1, c2, c3, c4};

        // Row 1: clusters 1 & 2
        for (int i = 0; i < 2; i++) {
            int cardX = PADDING + i * (cardW + gap);
            drawClusterCard(g, cardX, y, cardW, cardH, clusters[i], accentColors[i], lightColors[i], phaseRowHeight);
        }
        y += cardH + gap;

        // Row 2: clusters 3 & 4
        for (int i = 2; i < 4; i++) {
            int cardX = PADDING + (i - 2) * (cardW + gap);
            drawClusterCard(g, cardX, y, cardW, cardH, clusters[i], accentColors[i], lightColors[i], phaseRowHeight);
        }

        return y + cardH;
    }

    @SuppressWarnings("unchecked")
    private void drawClusterCard(Graphics2D g, int x, int y, int w, int h,
                                 Map<String, Object> cluster, Color accent, Color lightBg, int phaseRowH) {
        // Card with light accent background
        drawRoundedCard(g, x, y, w, h, lightBg, accent.brighter());

        int cx = x + CARD_PADDING;
        int cy = y + CARD_PADDING;

        String name = (String) cluster.get("name");
        int villaCount = (int) cluster.get("villaCount");
        int totalAct = (int) cluster.get("totalActivities");
        int completed = (int) cluster.get("completed");
        double pct = totalAct > 0 ? (completed * 100.0 / totalAct) : 0;

        // Cluster name
        Font nameFont = new Font("SansSerif", Font.BOLD, 15);
        g.setFont(nameFont);
        g.setColor(COLOR_TEXT_PRIMARY);
        g.drawString(name, cx, cy + 14);

        // Percentage on right
        String pctStr = String.format("%.0f%%", pct);
        Font pctFont = new Font("SansSerif", Font.BOLD, 16);
        g.setFont(pctFont);
        g.setColor(accent);
        int pctWidth = g.getFontMetrics().stringWidth(pctStr);
        g.drawString(pctStr, x + w - CARD_PADDING - pctWidth, cy + 14);

        // Progress bar
        cy += 24;
        int barW = w - 2 * CARD_PADDING;
        drawProgressBar(g, cx, cy, barW, 10, pct / 100.0, accent, 5);

        // Activity text
        cy += 18;
        Font smallFont = new Font("SansSerif", Font.PLAIN, 12);
        g.setFont(smallFont);
        g.setColor(COLOR_TEXT_SECONDARY);
        g.drawString(completed + "/" + totalAct + " activities  ·  " + villaCount + " villas", cx, cy + 10);

        // Phase rows
        cy += 22;
        List<Map<String, Object>> phaseData = (List<Map<String, Object>>) cluster.get("phases");
        for (Map<String, Object> pd : phaseData) {
            String label = (String) pd.get("label");
            int phaseTotal = (int) pd.get("total");
            int phaseCompleted = (int) pd.get("completed");
            double phasePct = phaseTotal > 0 ? (phaseCompleted * 100.0 / phaseTotal) : 0;

            // Phase label
            Font phaseFont = new Font("SansSerif", Font.PLAIN, 11);
            g.setFont(phaseFont);
            g.setColor(COLOR_TEXT_PRIMARY);

            // Truncate label if needed
            String displayLabel = label;
            FontMetrics fm = g.getFontMetrics();
            int maxLabelW = (w - 2 * CARD_PADDING) / 2 - 10;
            while (fm.stringWidth(displayLabel) > maxLabelW && displayLabel.length() > 3) {
                displayLabel = displayLabel.substring(0, displayLabel.length() - 1);
            }
            if (!displayLabel.equals(label)) {
                displayLabel += "..";
            }
            g.drawString(displayLabel, cx, cy + 10);

            // Mini progress bar (right side)
            int miniBarX = cx + (w - 2 * CARD_PADDING) / 2 + 5;
            int miniBarW = (w - 2 * CARD_PADDING) / 2 - 45;
            drawProgressBar(g, miniBarX, cy + 2, miniBarW, 8, phasePct / 100.0, accent, 4);

            // Percentage
            String phasePctStr = String.format("%.0f%%", phasePct);
            g.setFont(new Font("SansSerif", Font.PLAIN, 10));
            g.setColor(COLOR_TEXT_SECONDARY);
            int ppw = g.getFontMetrics().stringWidth(phasePctStr);
            g.drawString(phasePctStr, x + w - CARD_PADDING - ppw, cy + 10);

            cy += phaseRowH;
        }
    }

    @SuppressWarnings("unchecked")
    private void drawPhaseSection(Graphics2D g, int y, List<Map<String, Object>> phases) {
        int cx = PADDING;

        // Section title
        Font sectionFont = new Font("SansSerif", Font.BOLD, 18);
        g.setFont(sectionFont);
        g.setColor(COLOR_TEXT_PRIMARY);
        g.drawString("Phase-wise Summary", cx, y + 18);
        y += 36;

        // 5 cards per row, 2 rows
        int gap = 15;
        int cols = 5;
        int cardW = (IMG_WIDTH - 2 * PADDING - (cols - 1) * gap) / cols;
        int cardH = 95;

        for (int i = 0; i < phases.size(); i++) {
            Map<String, Object> phase = phases.get(i);
            int row = i / cols;
            int col = i % cols;
            int cardX = PADDING + col * (cardW + gap);
            int cardY = y + row * (cardH + gap);

            drawPhaseCard(g, cardX, cardY, cardW, cardH, phase);
        }
    }

    private void drawPhaseCard(Graphics2D g, int x, int y, int w, int h, Map<String, Object> phase) {
        String label = (String) phase.get("phaseLabel");
        int total = TOTAL_VILLAS; // each phase applies to all 237 villas
        int completed = ((Number) phase.get("completed")).intValue();
        double pct = total > 0 ? (completed * 100.0 / total) : 0;

        drawRoundedCard(g, x, y, w, h, COLOR_CARD_BG, COLOR_CARD_BORDER);

        int cx = x + 12;
        int cy = y + 14;

        // Phase label
        Font labelFont = new Font("SansSerif", Font.BOLD, 12);
        g.setFont(labelFont);
        g.setColor(COLOR_TEXT_PRIMARY);
        g.drawString(label, cx, cy + 10);

        // "Phase: X/237"
        cy += 20;
        Font smallFont = new Font("SansSerif", Font.PLAIN, 11);
        g.setFont(smallFont);
        g.setColor(COLOR_TEXT_SECONDARY);
        g.drawString("Phase: " + completed + "/" + total, cx, cy + 10);

        // Progress bar
        cy += 18;
        int barW = w - 24;
        drawProgressBar(g, cx, cy, barW, 10, pct / 100.0, COLOR_BLUE, 5);

        // Percentage
        cy += 16;
        String pctStr = String.format("%.0f%%", pct);
        Color pctColor = pct == 0 ? COLOR_TEXT_MUTED : (pct < 50 ? COLOR_ORANGE : COLOR_GREEN);
        g.setFont(new Font("SansSerif", Font.BOLD, 11));
        g.setColor(pctColor);
        g.drawString(pctStr, cx, cy + 8);
    }

    // ================================================================
    // Data building methods
    // ================================================================

    private Map<String, Object> buildSummary(List<VillaConstructionStatus> allStatuses, String projectName) {
        Map<String, List<VillaConstructionStatus>> byPhase = allStatuses.stream()
                .collect(Collectors.groupingBy(VillaConstructionStatus::getPhase));

        List<Map<String, Object>> phaseSummaries = new ArrayList<>();
        int totalCompleted = 0;
        int totalInProgress = 0;
        int totalNotStarted = 0;

        for (String phase : PHASES) {
            List<VillaConstructionStatus> statuses = byPhase.getOrDefault(phase, Collections.emptyList());
            long completed = statuses.stream()
                    .filter(s -> s.isActivity1Done() && s.isActivity2Done()).count();
            long inProgress = statuses.stream()
                    .filter(s -> (s.isActivity1Done() || s.isActivity2Done())
                            && !(s.isActivity1Done() && s.isActivity2Done())).count();
            long delayed = statuses.stream().filter(s -> {
                LocalDate target = s.getRevisedPlannedDate() != null
                        ? s.getRevisedPlannedDate() : s.getPlannedTargetDate();
                return target != null && target.isBefore(LocalDate.now())
                        && !(s.isActivity1Done() && s.isActivity2Done());
            }).count();

            Map<String, Object> ps = new LinkedHashMap<>();
            ps.put("phase", phase);
            ps.put("phaseLabel", PHASE_LABELS.getOrDefault(phase, phase));
            ps.put("total", (int) statuses.size());
            ps.put("completed", (int) completed);
            ps.put("inProgress", (int) inProgress);
            ps.put("notStarted", (int) (statuses.size() - completed - inProgress));
            ps.put("delayed", (int) delayed);
            phaseSummaries.add(ps);

            totalCompleted += completed;
            totalInProgress += inProgress;
            totalNotStarted += (statuses.size() - completed - inProgress);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("projectName", projectName);
        result.put("reportDate", LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
        result.put("phases", phaseSummaries);
        result.put("totalCompleted", totalCompleted);
        result.put("totalInProgress", totalInProgress);
        result.put("totalNotStarted", totalNotStarted);
        return result;
    }

    private Map<String, Object> buildClusterData(String clusterName, Set<Integer> villaNumbers,
                                                  List<VillaConstructionStatus> allStatuses) {
        List<VillaConstructionStatus> clusterStatuses = allStatuses.stream()
                .filter(s -> villaNumbers.contains(s.getVillaNumber()))
                .collect(Collectors.toList());

        Map<String, List<VillaConstructionStatus>> byPhase = clusterStatuses.stream()
                .collect(Collectors.groupingBy(VillaConstructionStatus::getPhase));

        int villaCount = villaNumbers.size();
        int totalActivities = villaCount * TOTAL_PHASES;
        int clusterCompleted = 0;

        List<Map<String, Object>> phaseList = new ArrayList<>();
        for (String phase : PHASES) {
            List<VillaConstructionStatus> statuses = byPhase.getOrDefault(phase, Collections.emptyList());
            int completed = (int) statuses.stream()
                    .filter(s -> s.isActivity1Done() && s.isActivity2Done()).count();
            clusterCompleted += completed;

            Map<String, Object> pd = new LinkedHashMap<>();
            pd.put("phase", phase);
            pd.put("label", PHASE_LABELS.getOrDefault(phase, phase));
            pd.put("total", villaCount);
            pd.put("completed", completed);
            phaseList.add(pd);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("name", clusterName);
        result.put("villaCount", villaCount);
        result.put("totalActivities", totalActivities);
        result.put("completed", clusterCompleted);
        result.put("phases", phaseList);
        return result;
    }

    // ================================================================
    // Drawing helper methods
    // ================================================================

    private void drawRoundedCard(Graphics2D g, int x, int y, int w, int h,
                                 Color fill, Color border) {
        RoundRectangle2D rect = new RoundRectangle2D.Float(x, y, w, h, ARC, ARC);

        // Fill
        g.setColor(fill);
        g.fill(rect);

        // Border
        g.setColor(border);
        g.setStroke(new BasicStroke(1.0f));
        g.draw(rect);
    }

    private void drawProgressBar(Graphics2D g, int x, int y, int w, int h,
                                 double fraction, Color fillColor, int arc) {
        fraction = Math.max(0, Math.min(1, fraction));

        // Track
        RoundRectangle2D track = new RoundRectangle2D.Float(x, y, w, h, arc, arc);
        g.setColor(COLOR_TRACK);
        g.fill(track);

        // Fill
        if (fraction > 0) {
            int fillW = Math.max(arc, (int) (w * fraction));
            RoundRectangle2D fill = new RoundRectangle2D.Float(x, y, fillW, h, arc, arc);
            g.setColor(fillColor);
            g.fill(fill);
        }
    }

    private Set<Integer> toSet(int[] arr) {
        Set<Integer> set = new HashSet<>();
        for (int v : arr) {
            set.add(v);
        }
        return set;
    }
}
