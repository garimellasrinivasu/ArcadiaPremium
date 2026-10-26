package com.arcadia.premium.service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/** Draws a report (title, summary cards, tables) as a PNG — for emails that are forwarded on WhatsApp. */
public class TableImageRenderer {

    public record Card(String label, String value, Color color) {}
    public record Section(String title, Color titleColor, String[] headers, List<String[]> rows, List<Color> rowBackgrounds, String emptyText) {}

    private static final int WIDTH = 1200, PAD = 28, ROW_H = 30, HEAD_H = 32, MAX_ROWS = 80;
    private static final Color NAVY = new Color(0x1F, 0x4E, 0x5F), GRID = new Color(0xDD, 0xDD, 0xDD), MUTED = new Color(0x66, 0x66, 0x66);
    private static final Font TITLE = new Font("SansSerif", Font.BOLD, 26), SUB = new Font("SansSerif", Font.PLAIN, 16),
            SECTION = new Font("SansSerif", Font.BOLD, 18), HEAD = new Font("SansSerif", Font.BOLD, 14), CELL = new Font("SansSerif", Font.PLAIN, 14),
            CARD_V = new Font("SansSerif", Font.BOLD, 24), CARD_L = new Font("SansSerif", Font.PLAIN, 13), FOOT = new Font("SansSerif", Font.PLAIN, 12);

    public static byte[] render(String title, String subtitle, List<Card> cards, List<Section> sections, String footer) {
        // height first
        int h = PAD + 34 + 26 + 12;
        if (cards != null && !cards.isEmpty()) h += 78 + 16;
        for (Section s : sections) {
            h += 36;
            int n = Math.min(s.rows().size(), MAX_ROWS);
            h += s.rows().isEmpty() ? 28 : HEAD_H + n * ROW_H + (s.rows().size() > MAX_ROWS ? 26 : 0);
            h += 18;
        }
        h += 30 + PAD;

        BufferedImage img = new BufferedImage(WIDTH, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, WIDTH, h);
        g.setColor(NAVY);
        g.fillRect(0, 0, WIDTH, 6);

        int y = PAD + 26;
        g.setFont(TITLE); g.setColor(NAVY); g.drawString(title, PAD, y);
        y += 28;
        g.setFont(SUB); g.setColor(MUTED); g.drawString(subtitle, PAD, y);
        y += 20;

        if (cards != null && !cards.isEmpty()) {
            int gap = 12, cw = (WIDTH - 2 * PAD - gap * (cards.size() - 1)) / cards.size();
            for (int i = 0; i < cards.size(); i++) {
                Card c = cards.get(i);
                int x = PAD + i * (cw + gap);
                g.setColor(new Color(0xF8, 0xFA, 0xFC)); g.fillRoundRect(x, y, cw, 78, 12, 12);
                g.setColor(GRID); g.drawRoundRect(x, y, cw, 78, 12, 12);
                g.setFont(CARD_V); g.setColor(c.color()); centre(g, c.value(), x, cw, y + 38);
                g.setFont(CARD_L); g.setColor(MUTED); centre(g, c.label(), x, cw, y + 62);
            }
            y += 78 + 16;
        }

        for (Section s : sections) {
            y += 26;
            g.setFont(SECTION); g.setColor(s.titleColor()); g.drawString(s.title(), PAD, y);
            y += 10;
            if (s.rows().isEmpty()) {
                y += 20;
                g.setFont(CELL); g.setColor(MUTED); g.drawString(s.emptyText(), PAD, y);
                y += 8 + 18;
                continue;
            }
            int[] widths = columnWidths(g, s.headers(), s.rows());
            g.setColor(NAVY); g.fillRect(PAD, y, WIDTH - 2 * PAD, HEAD_H);
            g.setFont(HEAD); g.setColor(Color.WHITE);
            int x = PAD;
            for (int c = 0; c < s.headers().length; c++) { g.drawString(fit(g, s.headers()[c], widths[c] - 14), x + 8, y + 21); x += widths[c]; }
            y += HEAD_H;
            g.setFont(CELL);
            int n = Math.min(s.rows().size(), MAX_ROWS);
            for (int r = 0; r < n; r++) {
                Color bg = s.rowBackgrounds() != null && r < s.rowBackgrounds().size() && s.rowBackgrounds().get(r) != null
                        ? s.rowBackgrounds().get(r) : (r % 2 == 0 ? Color.WHITE : new Color(0xFA, 0xFA, 0xFA));
                g.setColor(bg); g.fillRect(PAD, y, WIDTH - 2 * PAD, ROW_H);
                g.setColor(GRID); g.drawLine(PAD, y + ROW_H, WIDTH - PAD, y + ROW_H);
                g.setColor(new Color(0x22, 0x22, 0x22));
                x = PAD;
                String[] row = s.rows().get(r);
                for (int c = 0; c < widths.length; c++) {
                    g.drawString(fit(g, c < row.length && row[c] != null ? row[c] : "", widths[c] - 14), x + 8, y + 20);
                    x += widths[c];
                }
                y += ROW_H;
            }
            if (s.rows().size() > MAX_ROWS) {
                y += 20;
                g.setColor(MUTED); g.drawString("… and " + (s.rows().size() - MAX_ROWS) + " more (see the email or the app)", PAD, y);
                y += 6;
            }
            y += 18;
        }
        g.setFont(FOOT); g.setColor(MUTED);
        g.drawString(footer, PAD, h - PAD + 6);
        g.dispose();
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Could not create the image", e);
        }
    }

    /** Natural widths, scaled to the image width. */
    private static int[] columnWidths(Graphics2D g, String[] headers, List<String[]> rows) {
        int cols = headers.length;
        double[] w = new double[cols];
        FontMetrics hm = g.getFontMetrics(HEAD), cm = g.getFontMetrics(CELL);
        for (int c = 0; c < cols; c++) w[c] = hm.stringWidth(headers[c]) + 18;
        for (String[] r : rows.subList(0, Math.min(rows.size(), MAX_ROWS)))
            for (int c = 0; c < cols && c < r.length; c++) if (r[c] != null) w[c] = Math.max(w[c], Math.min(cm.stringWidth(r[c]) + 18, 520));
        double total = 0;
        for (double v : w) total += v;
        double avail = WIDTH - 2 * PAD, scale = avail / total;
        int[] out = new int[cols];
        int used = 0;
        for (int c = 0; c < cols; c++) { out[c] = (int) Math.floor(w[c] * scale); used += out[c]; }
        out[cols - 1] += (int) avail - used;
        return out;
    }

    private static String fit(Graphics2D g, String s, int max) {
        FontMetrics m = g.getFontMetrics();
        if (m.stringWidth(s) <= max) return s;
        String e = "…";
        int end = s.length();
        while (end > 0 && m.stringWidth(s.substring(0, end) + e) > max) end--;
        return s.substring(0, end) + e;
    }

    private static void centre(Graphics2D g, String s, int x, int w, int baseline) {
        g.drawString(s, x + (w - g.getFontMetrics().stringWidth(s)) / 2, baseline);
    }

    public static List<Color> colours(int n) { return new ArrayList<>(java.util.Collections.nCopies(n, (Color) null)); }
}
