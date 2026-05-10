package com.arcadia.premium.config;

import com.arcadia.premium.model.EstimationRow;
import com.arcadia.premium.model.EstimationTab;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.EstimationTabRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(2) // Run after DataSeeder
public class EstimationDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(EstimationDataSeeder.class);

    private final ProjectRepository projectRepo;
    private final EstimationTabRepository tabRepo;

    public EstimationDataSeeder(ProjectRepository projectRepo, EstimationTabRepository tabRepo) {
        this.projectRepo = projectRepo;
        this.tabRepo = tabRepo;
    }

    @Override
    public void run(String... args) {
        // Seed for "Praneeth Arcadia Premium" if no estimation data exists
        projectRepo.findAll().stream()
            .filter(p -> p.getName().contains("Arcadia Premium"))
            .findFirst()
            .ifPresent(project -> {
                if (tabRepo.findByProjectIdOrderBySortOrderAsc(project.getId()).isEmpty()) {
                    log.info("Seeding estimation data for project: {}", project.getName());
                    seedArcadiaPremiumEstimation(project);
                    log.info("Estimation data seeded successfully.");
                }
            });
    }

    private void seedArcadiaPremiumEstimation(Project project) {
        // ── Tab 1: Cover ──
        seedCoverTab(project);
        // ── Tab 2: Assumptions ──
        seedAssumptionsTab(project);
        // ── Tab 3: Civil & Structure ──
        seedCivilTab(project);
        // ── Tab 4: External Development ──
        seedExternalDevTab(project);
        // ── Tab 5: Approvals & Legal ──
        seedApprovalsTab(project);
        // ── Tab 6: Grand Summary ──
        seedGrandSummaryTab(project);
    }

    private void seedCoverTab(Project project) {
        EstimationTab tab = new EstimationTab();
        tab.setProject(project);
        tab.setName("Cover");
        tab.setSortOrder(1);
        tab.setTabType("COVER");
        tab.setColumnsJson("[{\"key\":\"label\",\"label\":\"Parameter\",\"type\":\"text\",\"width\":\"50%\"},{\"key\":\"value\",\"label\":\"Value\",\"type\":\"text\",\"width\":\"50%\"}]");
        tab.setMetadataJson("{\"title\":\"PROJECT COST ESTIMATION\",\"subtitle\":\"Arcadia Premium \\u2013 Triplex Villas\",\"location\":\"Hyderabad, Telangana\"}");

        int o = 0;
        addRow(tab, o++, "HEADER", "COVER", "{\"label\":\"PROJECT PARAMETERS\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Total Land Area\",\"value\":\"17.00 Acres\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Total No. of Villas\",\"value\":\"245 Triplex Villas\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Villa Type\",\"value\":\"G+2 Triplex (Premium)\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Per Villa Built-up\",\"value\":\"2,632 Sq.Ft.\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Total Built-up Area\",\"value\":\"6,45,000 Sq.Ft. (approx.)\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Location\",\"value\":\"Hyderabad, Telangana\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Specification\",\"value\":\"Premium\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Prepared By\",\"value\":\"Vasasri Homes \\u2013 Estimation Dept.\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Prepared Date\",\"value\":\"March 2025\"}");
        addRow(tab, o++, "DATA", "COVER", "{\"label\":\"Validity\",\"value\":\"6 Months from Date of Preparation\"}");
        addRow(tab, o++, "NOTE", "COVER", "{\"label\":\"DISCLAIMER: This is a preliminary cost estimation prepared for budgeting purposes based on prevailing market rates in Hyderabad (2025). Actual costs may vary based on detailed design, market fluctuations, soil conditions, and contractor negotiations. All rates are exclusive of GST unless stated otherwise.\"}");

        tabRepo.save(tab);
    }

    private void seedAssumptionsTab(Project project) {
        EstimationTab tab = new EstimationTab();
        tab.setProject(project);
        tab.setName("Assumptions");
        tab.setSortOrder(2);
        tab.setTabType("ASSUMPTIONS");
        tab.setColumnsJson("[{\"key\":\"parameter\",\"label\":\"Parameter\",\"type\":\"text\",\"width\":\"35%\"},{\"key\":\"value\",\"label\":\"Value\",\"type\":\"number\",\"width\":\"15%\"},{\"key\":\"unit\",\"label\":\"Unit\",\"type\":\"text\",\"width\":\"15%\"},{\"key\":\"remarks\",\"label\":\"Remarks\",\"type\":\"text\",\"width\":\"35%\"}]");

        int o = 0;
        addRow(tab, o++, "HEADER", "PROJECT BASICS", "{\"parameter\":\"PROJECT BASICS\"}");
        addRow(tab, o++, "DATA", "PROJECT BASICS", "{\"parameter\":\"Total Land Area\",\"value\":17,\"unit\":\"Acres\",\"remarks\":\"As per project data\"}");
        addRow(tab, o++, "DATA", "PROJECT BASICS", "{\"parameter\":\"Total No. of Villas\",\"value\":245,\"unit\":\"Nos.\",\"remarks\":\"Triplex villas\"}");
        addRow(tab, o++, "DATA", "PROJECT BASICS", "{\"parameter\":\"Villa Type\",\"value\":\"G+2 (Triplex)\",\"unit\":\"-\",\"remarks\":\"Ground + 2 Upper Floors\"}");
        addRow(tab, o++, "DATA", "PROJECT BASICS", "{\"parameter\":\"Per Villa Built-up Area\",\"value\":2632,\"unit\":\"Sq.Ft.\",\"remarks\":\"Assumed: total 6,45,000 SFT / 245\"}");
        addRow(tab, o++, "DATA", "PROJECT BASICS", "{\"parameter\":\"Total Built-up Area\",\"value\":645000,\"unit\":\"Sq.Ft.\",\"remarks\":\"\"}");
        addRow(tab, o++, "DATA", "PROJECT BASICS", "{\"parameter\":\"Land per Villa\",\"value\":3024,\"unit\":\"Sq.Ft.\",\"remarks\":\"17 Acres x 43,560 / 245\"}");
        addRow(tab, o++, "DATA", "PROJECT BASICS", "{\"parameter\":\"Location\",\"value\":\"Hyderabad\",\"unit\":\"-\",\"remarks\":\"Telangana, India\"}");
        addRow(tab, o++, "DATA", "PROJECT BASICS", "{\"parameter\":\"Specification\",\"value\":\"Premium\",\"unit\":\"-\",\"remarks\":\"\"}");

        addRow(tab, o++, "HEADER", "CONSTRUCTION RATES", "{\"parameter\":\"CONSTRUCTION RATES (Rs/SFT)\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"RCC Structure & Foundations\",\"value\":1800,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"Premium grade \\u2013 Hyderabad 2025\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Brick Masonry & Block work\",\"value\":280,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"AAC blocks / Fly ash bricks\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Plastering (Int + Ext)\",\"value\":140,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"Double coat\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Flooring (Premium Vitrified/Marble)\",\"value\":380,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"600x600 / 800x800 premium tiles\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Doors & Windows (UPVC/Aluminium)\",\"value\":260,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"UPVC frames with glass\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Electrical Works\",\"value\":200,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"Copper wiring, MCB, DB board\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Plumbing & Sanitary\",\"value\":180,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"CPVC/UPVC piping, premium fixtures\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Painting (Interior + Exterior)\",\"value\":120,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"Premium emulsion + texture paint\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Waterproofing\",\"value\":80,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"Terrace, bathrooms, basement\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"False Ceiling (Gypsum/POP)\",\"value\":110,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"Living, dining, bedrooms\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Staircase & Handrails\",\"value\":90,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"SS/Glass railings\"}");
        addRow(tab, o++, "DATA", "CONSTRUCTION RATES", "{\"parameter\":\"Miscellaneous Civil\",\"value\":90,\"unit\":\"Rs/Sq.Ft.\",\"remarks\":\"Scaffolding, debris, sundry\"}");

        addRow(tab, o++, "HEADER", "ESCALATION", "{\"parameter\":\"ESCALATION & CONTINGENCY\"}");
        addRow(tab, o++, "DATA", "ESCALATION", "{\"parameter\":\"Construction Contingency\",\"value\":5,\"unit\":\"%\",\"remarks\":\"5% on civil cost\"}");
        addRow(tab, o++, "DATA", "ESCALATION", "{\"parameter\":\"Price Escalation (2 yr)\",\"value\":8,\"unit\":\"%\",\"remarks\":\"8% cumulative over project period\"}");

        addRow(tab, o++, "HEADER", "LAND", "{\"parameter\":\"LAND ASSUMPTIONS\"}");
        addRow(tab, o++, "DATA", "LAND", "{\"parameter\":\"Land Cost per Acre\",\"value\":7500000,\"unit\":\"Rs/Acre\",\"remarks\":\"Market reference \\u2013 varies by location\"}");

        tabRepo.save(tab);
    }

    private void seedCivilTab(Project project) {
        EstimationTab tab = new EstimationTab();
        tab.setProject(project);
        tab.setName("Civil & Structure");
        tab.setSortOrder(3);
        tab.setTabType("DATA_TABLE");
        tab.setSubtitle("Location: Hyderabad, Telangana | Specification: Premium | Total Built-up: 6,45,000 Sq.Ft. | Per Villa: ~2,632 Sq.Ft.");
        tab.setColumnsJson("[{\"key\":\"slno\",\"label\":\"Sl.No\",\"type\":\"number\",\"width\":\"5%\"},{\"key\":\"description\",\"label\":\"Description of Work\",\"type\":\"text\",\"width\":\"30%\"},{\"key\":\"rate\",\"label\":\"Rate (Rs/Sq.Ft.)\",\"type\":\"number\",\"width\":\"12%\",\"editable\":true},{\"key\":\"qty\",\"label\":\"Qty (Sq.Ft.)\",\"type\":\"number\",\"width\":\"12%\",\"editable\":true},{\"key\":\"perVilla\",\"label\":\"Per Villa (Rs)\",\"type\":\"formula\",\"width\":\"15%\",\"formula\":\"rate*qty\"},{\"key\":\"total\",\"label\":\"Total (Rs)\",\"type\":\"formula\",\"width\":\"18%\",\"formula\":\"perVilla*245\"},{\"key\":\"pctCivil\",\"label\":\"% of Civil Cost\",\"type\":\"formula\",\"width\":\"8%\"}]");

        int o = 0;
        addRow(tab, o++, "HEADER", "STRUCTURAL WORKS", "{\"description\":\"STRUCTURAL WORKS\"}");
        addRow(tab, o++, "DATA", "STRUCTURAL WORKS", "{\"slno\":1,\"description\":\"Earth Work Excavation & PCC\",\"rate\":40,\"qty\":2632}");
        addRow(tab, o++, "DATA", "STRUCTURAL WORKS", "{\"slno\":2,\"description\":\"RCC Foundations (Footings & Raft)\",\"rate\":150,\"qty\":2632}");
        addRow(tab, o++, "DATA", "STRUCTURAL WORKS", "{\"slno\":3,\"description\":\"RCC Columns, Beams & Slabs\",\"rate\":550,\"qty\":2632}");
        addRow(tab, o++, "DATA", "STRUCTURAL WORKS", "{\"slno\":4,\"description\":\"RCC Staircase & Chajjas\",\"rate\":50,\"qty\":2632}");
        addRow(tab, o++, "DATA", "STRUCTURAL WORKS", "{\"slno\":5,\"description\":\"Anti-Termite Treatment\",\"rate\":25,\"qty\":2632}");

        addRow(tab, o++, "HEADER", "MASONRY & PLASTERING", "{\"description\":\"MASONRY & PLASTERING\"}");
        addRow(tab, o++, "DATA", "MASONRY & PLASTERING", "{\"slno\":6,\"description\":\"Brick / AAC Block Masonry\",\"rate\":280,\"qty\":2632}");
        addRow(tab, o++, "DATA", "MASONRY & PLASTERING", "{\"slno\":7,\"description\":\"Internal Plastering (12mm)\",\"rate\":80,\"qty\":2632}");
        addRow(tab, o++, "DATA", "MASONRY & PLASTERING", "{\"slno\":8,\"description\":\"External Plastering & Waterproof coat\",\"rate\":60,\"qty\":2632}");

        addRow(tab, o++, "HEADER", "FLOORING & TILING", "{\"description\":\"FLOORING & TILING\"}");
        addRow(tab, o++, "DATA", "FLOORING & TILING", "{\"slno\":9,\"description\":\"Premium Vitrified / Marble Flooring\",\"rate\":50,\"qty\":2632}");
        addRow(tab, o++, "DATA", "FLOORING & TILING", "{\"slno\":10,\"description\":\"Bathroom & Kitchen Wall Tiles\",\"rate\":120,\"qty\":2632}");
        addRow(tab, o++, "DATA", "FLOORING & TILING", "{\"slno\":11,\"description\":\"Staircase Granite / Marble\",\"rate\":90,\"qty\":2632}");

        addRow(tab, o++, "HEADER", "DOORS WINDOWS GLAZING", "{\"description\":\"DOORS, WINDOWS & GLAZING\"}");
        addRow(tab, o++, "DATA", "DOORS WINDOWS GLAZING", "{\"slno\":12,\"description\":\"Main Door (Teakwood / Designer)\",\"rate\":80,\"qty\":2632}");
        addRow(tab, o++, "DATA", "DOORS WINDOWS GLAZING", "{\"slno\":13,\"description\":\"Internal Flush Doors with Frame\",\"rate\":90,\"qty\":2632}");
        addRow(tab, o++, "DATA", "DOORS WINDOWS GLAZING", "{\"slno\":14,\"description\":\"UPVC / Aluminium Windows & Ventilators\",\"rate\":140,\"qty\":2632}");
        addRow(tab, o++, "DATA", "DOORS WINDOWS GLAZING", "{\"slno\":15,\"description\":\"Balcony Sliding Doors (Aluminium)\",\"rate\":90,\"qty\":2632}");

        addRow(tab, o++, "HEADER", "MEP WORKS", "{\"description\":\"MEP WORKS\"}");
        addRow(tab, o++, "DATA", "MEP WORKS", "{\"slno\":16,\"description\":\"Electrical Wiring, DB, Switches (Copper)\",\"rate\":200,\"qty\":2632}");
        addRow(tab, o++, "DATA", "MEP WORKS", "{\"slno\":17,\"description\":\"Plumbing & Sanitary (CPVC/UPVC)\",\"rate\":180,\"qty\":2632}");
        addRow(tab, o++, "DATA", "MEP WORKS", "{\"slno\":18,\"description\":\"Drainage & Sewerage Inside Villa\",\"rate\":50,\"qty\":2632}");

        addRow(tab, o++, "HEADER", "FINISHING WORKS", "{\"description\":\"FINISHING WORKS\"}");
        addRow(tab, o++, "DATA", "FINISHING WORKS", "{\"slno\":19,\"description\":\"Interior Painting (Premium Emulsion)\",\"rate\":70,\"qty\":2632}");
        addRow(tab, o++, "DATA", "FINISHING WORKS", "{\"slno\":20,\"description\":\"Exterior Paint / Texture Finish\",\"rate\":50,\"qty\":2632}");
        addRow(tab, o++, "DATA", "FINISHING WORKS", "{\"slno\":21,\"description\":\"False Ceiling \\u2013 Gypsum / POP\",\"rate\":0,\"qty\":2632}");
        addRow(tab, o++, "DATA", "FINISHING WORKS", "{\"slno\":22,\"description\":\"Waterproofing (Terrace + Bathrooms)\",\"rate\":80,\"qty\":2632}");
        addRow(tab, o++, "DATA", "FINISHING WORKS", "{\"slno\":23,\"description\":\"Stainless Steel / Glass Handrails\",\"rate\":90,\"qty\":2632}");
        addRow(tab, o++, "DATA", "FINISHING WORKS", "{\"slno\":24,\"description\":\"Miscellaneous Civil & Sundry\",\"rate\":90,\"qty\":2632}");

        addRow(tab, o++, "SUBTOTAL", null, "{\"description\":\"SUB-TOTAL \\u2013 BASIC CONSTRUCTION COST\",\"formulaType\":\"SUM_DATA_ROWS\"}");
        addRow(tab, o++, "DATA", "CONTINGENCY", "{\"description\":\"Add: Contingency @ 5%\",\"formulaType\":\"PERCENT_OF_SUBTOTAL\",\"percent\":5}");
        addRow(tab, o++, "TOTAL", null, "{\"description\":\"GRAND TOTAL \\u2013 CIVIL & STRUCTURAL COST\",\"formulaType\":\"SUBTOTAL_PLUS_CONTINGENCY\"}");
        addRow(tab, o++, "NOTE", null, "{\"description\":\"Effective Cost per Sq.Ft. (incl. contingency)\",\"formulaType\":\"COST_PER_SQFT\"}");

        tabRepo.save(tab);
    }

    private void seedExternalDevTab(Project project) {
        EstimationTab tab = new EstimationTab();
        tab.setProject(project);
        tab.setName("External Development");
        tab.setSortOrder(4);
        tab.setTabType("DATA_TABLE");
        tab.setSubtitle("17 ACRES | 245 VILLAS");
        tab.setColumnsJson("[{\"key\":\"slno\",\"label\":\"Sl.No\",\"type\":\"number\",\"width\":\"5%\"},{\"key\":\"description\",\"label\":\"Description\",\"type\":\"text\",\"width\":\"30%\"},{\"key\":\"qty\",\"label\":\"Qty\",\"type\":\"number\",\"width\":\"10%\",\"editable\":true},{\"key\":\"unit\",\"label\":\"Unit\",\"type\":\"text\",\"width\":\"10%\",\"editable\":true},{\"key\":\"rate\",\"label\":\"Rate (Rs)\",\"type\":\"number\",\"width\":\"15%\",\"editable\":true},{\"key\":\"total\",\"label\":\"Total Cost (Rs)\",\"type\":\"formula\",\"width\":\"20%\",\"formula\":\"qty*rate\"}]");

        int o = 0;
        addRow(tab, o++, "HEADER", "ROADS & PATHWAYS", "{\"description\":\"ROADS & PATHWAYS\"}");
        addRow(tab, o++, "DATA", "ROADS & PATHWAYS", "{\"slno\":1,\"description\":\"Internal CC / Asphalt Roads (Main)\",\"qty\":17,\"unit\":\"Acres\",\"rate\":1200000}");
        addRow(tab, o++, "DATA", "ROADS & PATHWAYS", "{\"slno\":2,\"description\":\"Pathway / Pedestrian Walkways\",\"qty\":17,\"unit\":\"Acres\",\"rate\":400000}");
        addRow(tab, o++, "DATA", "ROADS & PATHWAYS", "{\"slno\":3,\"description\":\"Kerb Stones & Road Furniture\",\"qty\":245,\"unit\":\"Villas\",\"rate\":8000}");

        addRow(tab, o++, "HEADER", "COMPOUND WALL & GATE", "{\"description\":\"COMPOUND WALL & GATE\"}");
        addRow(tab, o++, "DATA", "COMPOUND WALL & GATE", "{\"slno\":4,\"description\":\"Compound Wall (RCC + Brick) \\u2013 Perimeter\",\"qty\":1800,\"unit\":\"Rft\",\"rate\":3500}");
        addRow(tab, o++, "DATA", "COMPOUND WALL & GATE", "{\"slno\":5,\"description\":\"Main Gate (Decorative Arch + SS Gate)\",\"qty\":2,\"unit\":\"Nos.\",\"rate\":750000}");
        addRow(tab, o++, "DATA", "COMPOUND WALL & GATE", "{\"slno\":6,\"description\":\"Security Cabin & Boom Barrier\",\"qty\":4,\"unit\":\"Nos.\",\"rate\":200000}");

        addRow(tab, o++, "HEADER", "UNDERGROUND UTILITIES", "{\"description\":\"UNDERGROUND UTILITIES\"}");
        addRow(tab, o++, "DATA", "UNDERGROUND UTILITIES", "{\"slno\":7,\"description\":\"UG Drainage Network (SWD)\",\"qty\":17,\"unit\":\"Acres\",\"rate\":700000}");
        addRow(tab, o++, "DATA", "UNDERGROUND UTILITIES", "{\"slno\":8,\"description\":\"Sewerage Treatment Plant (STP)\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":12500000}");
        addRow(tab, o++, "DATA", "UNDERGROUND UTILITIES", "{\"slno\":9,\"description\":\"Water Supply Pipelines (OHT + UGT)\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":8500000}");
        addRow(tab, o++, "DATA", "UNDERGROUND UTILITIES", "{\"slno\":10,\"description\":\"UG Electrical HT/LT Cabling\",\"qty\":17,\"unit\":\"Acres\",\"rate\":1000000}");
        addRow(tab, o++, "DATA", "UNDERGROUND UTILITIES", "{\"slno\":11,\"description\":\"Solar Street Lights\",\"qty\":120,\"unit\":\"Nos.\",\"rate\":35000}");

        addRow(tab, o++, "HEADER", "LANDSCAPING & AMENITIES", "{\"description\":\"LANDSCAPING & AMENITIES\"}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":12,\"description\":\"Landscaping & Horticulture\",\"qty\":17,\"unit\":\"Acres\",\"rate\":600000}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":13,\"description\":\"Club House (Premium \\u2013 8,000 SFT)\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":50000000}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":14,\"description\":\"Swimming Pool (Competition Size)\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":12000000}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":15,\"description\":\"Children's Play Area\",\"qty\":2,\"unit\":\"Nos.\",\"rate\":2500000}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":16,\"description\":\"Jogging / Cycling Track\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":3500000}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":17,\"description\":\"Outdoor Gym & Sports Facilities\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":2000000}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":18,\"description\":\"Amphitheatre / Party Lawn\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":2500000}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":19,\"description\":\"CCTV & Intercom System\",\"qty\":245,\"unit\":\"Villas\",\"rate\":20000}");
        addRow(tab, o++, "DATA", "LANDSCAPING & AMENITIES", "{\"slno\":20,\"description\":\"Rainwater Harvesting Pits\",\"qty\":20,\"unit\":\"Nos.\",\"rate\":80000}");

        addRow(tab, o++, "HEADER", "FINISHING & MISC", "{\"description\":\"FINISHING & MISCELLANEOUS\"}");
        addRow(tab, o++, "DATA", "FINISHING & MISC", "{\"slno\":21,\"description\":\"Entrance Landscaping & Signage\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":2500000}");
        addRow(tab, o++, "DATA", "FINISHING & MISC", "{\"slno\":22,\"description\":\"Overhead Water Tank (2 x 2.5 Lakh Ltrs)\",\"qty\":2,\"unit\":\"Nos.\",\"rate\":2200000}");
        addRow(tab, o++, "DATA", "FINISHING & MISC", "{\"slno\":23,\"description\":\"Generator / Power Backup \\u2013 Common\",\"qty\":2,\"unit\":\"Nos.\",\"rate\":1800000}");
        addRow(tab, o++, "DATA", "FINISHING & MISC", "{\"slno\":24,\"description\":\"Fire Fighting System \\u2013 Common Areas\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":3500000}");
        addRow(tab, o++, "DATA", "FINISHING & MISC", "{\"slno\":25,\"description\":\"Miscellaneous & Contingency (5%)\",\"formulaType\":\"PERCENT_OF_SUBTOTAL\",\"percent\":5}");

        addRow(tab, o++, "TOTAL", null, "{\"description\":\"GRAND TOTAL \\u2013 EXTERNAL DEVELOPMENT COST\",\"formulaType\":\"SUM_ALL\"}");
        addRow(tab, o++, "NOTE", null, "{\"description\":\"External Development Cost per Villa\",\"formulaType\":\"COST_PER_VILLA\"}");

        tabRepo.save(tab);
    }

    private void seedApprovalsTab(Project project) {
        EstimationTab tab = new EstimationTab();
        tab.setProject(project);
        tab.setName("Approvals & Legal");
        tab.setSortOrder(5);
        tab.setTabType("DATA_TABLE");
        tab.setSubtitle("HMDA | RERA | GHMC | GOVT. FEES");
        tab.setColumnsJson("[{\"key\":\"slno\",\"label\":\"Sl.No\",\"type\":\"number\",\"width\":\"5%\"},{\"key\":\"description\",\"label\":\"Description\",\"type\":\"text\",\"width\":\"30%\"},{\"key\":\"qty\",\"label\":\"Qty\",\"type\":\"number\",\"width\":\"10%\",\"editable\":true},{\"key\":\"unit\",\"label\":\"Unit\",\"type\":\"text\",\"width\":\"10%\",\"editable\":true},{\"key\":\"rate\",\"label\":\"Rate (Rs)\",\"type\":\"text\",\"width\":\"15%\",\"editable\":true},{\"key\":\"amount\",\"label\":\"Amount (Rs)\",\"type\":\"formula\",\"width\":\"20%\",\"formula\":\"qty*rate\"}]");

        int o = 0;
        addRow(tab, o++, "HEADER", "HMDA / DTCP", "{\"description\":\"HMDA / DTCP APPROVALS\"}");
        addRow(tab, o++, "DATA", "HMDA / DTCP", "{\"slno\":1,\"description\":\"HMDA Layout Approval Fees\",\"qty\":17,\"unit\":\"Acres\",\"rate\":200000}");
        addRow(tab, o++, "DATA", "HMDA / DTCP", "{\"slno\":2,\"description\":\"HMDA Building Plan Approval\",\"qty\":245,\"unit\":\"Villas\",\"rate\":30000}");
        addRow(tab, o++, "DATA", "HMDA / DTCP", "{\"slno\":3,\"description\":\"HMDA Impact Fees / Development Charges\",\"qty\":645000,\"unit\":\"Sq.Ft.\",\"rate\":75}");
        addRow(tab, o++, "DATA", "HMDA / DTCP", "{\"slno\":4,\"description\":\"HMDA Betterment Charges\",\"qty\":17,\"unit\":\"Acres\",\"rate\":150000}");
        addRow(tab, o++, "DATA", "HMDA / DTCP", "{\"slno\":5,\"description\":\"Scrutiny & Processing Fees\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":500000}");

        addRow(tab, o++, "HEADER", "RERA", "{\"description\":\"RERA REGISTRATION\"}");
        addRow(tab, o++, "DATA", "RERA", "{\"slno\":6,\"description\":\"TGRERA Registration Fees\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":1000000}");
        addRow(tab, o++, "DATA", "RERA", "{\"slno\":7,\"description\":\"RERA Project Maintenance\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":300000}");

        addRow(tab, o++, "HEADER", "GHMC / ULB", "{\"description\":\"GHMC / ULB APPROVALS\"}");
        addRow(tab, o++, "DATA", "GHMC / ULB", "{\"slno\":8,\"description\":\"GHMC Building Permission Fees\",\"qty\":245,\"unit\":\"Villas\",\"rate\":15000}");
        addRow(tab, o++, "DATA", "GHMC / ULB", "{\"slno\":9,\"description\":\"NOC from Fire Department\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":400000}");
        addRow(tab, o++, "DATA", "GHMC / ULB", "{\"slno\":10,\"description\":\"Electricity Connection (TSSPDCL/TSNPDCL)\",\"qty\":245,\"unit\":\"Villas\",\"rate\":25000}");
        addRow(tab, o++, "DATA", "GHMC / ULB", "{\"slno\":11,\"description\":\"Water & Sewerage Connection \\u2013 HMWS&SB\",\"qty\":245,\"unit\":\"Villas\",\"rate\":12000}");

        addRow(tab, o++, "HEADER", "ENVIRONMENTAL", "{\"description\":\"ENVIRONMENTAL & OTHER NOCs\"}");
        addRow(tab, o++, "DATA", "ENVIRONMENTAL", "{\"slno\":12,\"description\":\"Environment Impact Assessment (EIA)\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":800000}");
        addRow(tab, o++, "DATA", "ENVIRONMENTAL", "{\"slno\":13,\"description\":\"Ground Water / CGWB NOC\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":150000}");
        addRow(tab, o++, "DATA", "ENVIRONMENTAL", "{\"slno\":14,\"description\":\"Revenue NOC & 22-A Clearance\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":200000}");
        addRow(tab, o++, "DATA", "ENVIRONMENTAL", "{\"slno\":15,\"description\":\"Road Cutting / ROW Permission\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":300000}");

        addRow(tab, o++, "HEADER", "LEGAL & PROFESSIONAL", "{\"description\":\"LEGAL & PROFESSIONAL FEES\"}");
        addRow(tab, o++, "DATA", "LEGAL & PROFESSIONAL", "{\"slno\":16,\"description\":\"Legal due diligence & Title Search\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":1500000}");
        addRow(tab, o++, "DATA", "LEGAL & PROFESSIONAL", "{\"slno\":17,\"description\":\"Liaison / Approval Consultant Fees\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":5000000}");
        addRow(tab, o++, "DATA", "LEGAL & PROFESSIONAL", "{\"slno\":18,\"description\":\"Architect Fees (2% of civil cost)\",\"unit\":\"2% of Civil\",\"rate\":\"As applicable\"}");
        addRow(tab, o++, "DATA", "LEGAL & PROFESSIONAL", "{\"slno\":19,\"description\":\"Structural Consultant Fees\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":2000000}");
        addRow(tab, o++, "DATA", "LEGAL & PROFESSIONAL", "{\"slno\":20,\"description\":\"PMC / Project Management Fees\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":3500000}");
        addRow(tab, o++, "DATA", "LEGAL & PROFESSIONAL", "{\"slno\":21,\"description\":\"Stamp Duty on Land (Registration)\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":7500000}");

        addRow(tab, o++, "HEADER", "MISC", "{\"description\":\"MISCELLANEOUS & CONTINGENCY\"}");
        addRow(tab, o++, "DATA", "MISC", "{\"slno\":22,\"description\":\"Advertisement / Marketing Launch\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":5000000}");
        addRow(tab, o++, "DATA", "MISC", "{\"slno\":23,\"description\":\"Miscellaneous Approval Expenses\",\"qty\":1,\"unit\":\"Lump Sum\",\"rate\":2000000}");

        addRow(tab, o++, "TOTAL", null, "{\"description\":\"GRAND TOTAL \\u2013 APPROVALS, LEGAL & STATUTORY COSTS\",\"formulaType\":\"SUM_DATA_ROWS\"}");
        addRow(tab, o++, "NOTE", null, "{\"description\":\"Note: Architect fees (18), GST, Stamp duty on constructed units are additional/project-specific.\"}");

        tabRepo.save(tab);
    }

    private void seedGrandSummaryTab(Project project) {
        EstimationTab tab = new EstimationTab();
        tab.setProject(project);
        tab.setName("Grand Summary");
        tab.setSortOrder(6);
        tab.setTabType("SUMMARY");
        tab.setSubtitle("Vasasri Homes \\u2013 Premium Triplex Villas | 17 Acres | 245 Units | Hyderabad, Telangana | March 2025");
        tab.setColumnsJson("[{\"key\":\"slno\",\"label\":\"Sl.No\",\"type\":\"number\",\"width\":\"5%\"},{\"key\":\"costHead\",\"label\":\"Cost Head\",\"type\":\"text\",\"width\":\"30%\"},{\"key\":\"totalCost\",\"label\":\"Total Project Cost (Rs)\",\"type\":\"number\",\"width\":\"22%\"},{\"key\":\"perVilla\",\"label\":\"Per Villa (Rs)\",\"type\":\"formula\",\"width\":\"20%\",\"formula\":\"totalCost/245\"},{\"key\":\"costPerSqft\",\"label\":\"Cost/Sq.Ft. (Rs)\",\"type\":\"formula\",\"width\":\"18%\",\"formula\":\"totalCost/645000\"}]");
        tab.setMetadataJson("{\"totalVillas\":245,\"totalBuiltup\":645000,\"landAcres\":17,\"notes\":[\"All rates are based on Hyderabad Premium market \\u2013 March 2025. Subject to revision.\",\"GST @5% on under-construction properties is the builder's liability and may be passed on to buyers.\",\"Land cost Rs 75L/Acre is indicative. Update with actual land cost.\",\"Interior finishes (kitchen, wardrobes, landscaping of individual plots) not included.\",\"Architect fees @2% on civil cost & selling/marketing commissions to be added separately.\",\"Rates are EXCLUSIVE of GST unless mentioned. Material cost escalation @4\\u20136% p.a. assumed.\"]}");

        int o = 0;
        addRow(tab, o++, "DATA", "MAIN", "{\"slno\":1,\"costHead\":\"Civil & Structural Construction Cost\",\"sourceTab\":\"Civil & Structure\",\"sourceType\":\"GRAND_TOTAL\"}");
        addRow(tab, o++, "DATA", "MAIN", "{\"slno\":2,\"costHead\":\"External Development & Landscaping\",\"sourceTab\":\"External Development\",\"sourceType\":\"GRAND_TOTAL\"}");
        addRow(tab, o++, "DATA", "MAIN", "{\"slno\":3,\"costHead\":\"Approvals, Legal & Statutory Costs\",\"sourceTab\":\"Approvals & Legal\",\"sourceType\":\"GRAND_TOTAL\"}");
        addRow(tab, o++, "SUBTOTAL", null, "{\"costHead\":\"TOTAL PROJECT COST (Excl. Land & GST)\",\"formulaType\":\"SUM_DATA_ROWS\"}");
        addRow(tab, o++, "DATA", "ADDITIONAL", "{\"costHead\":\"Land Cost (17 Acres @ Rs 75 Lakhs/Acre \\u2013 Indicative)\",\"totalCost\":127500000,\"editable\":true}");
        addRow(tab, o++, "DATA", "ADDITIONAL", "{\"costHead\":\"GST on Construction @ 5% (Under-construction)\",\"formulaType\":\"GST_ON_CIVIL\",\"percent\":5}");
        addRow(tab, o++, "TOTAL", null, "{\"costHead\":\"TOTAL ALL-IN PROJECT COST (Incl. Land + GST)\",\"formulaType\":\"TOTAL_ALL_IN\"}");

        tabRepo.save(tab);
    }

    private void addRow(EstimationTab tab, int order, String type, String section, String cellsJson) {
        EstimationRow row = new EstimationRow();
        row.setTab(tab);
        row.setSortOrder(order);
        row.setRowType(type);
        row.setSectionGroup(section);
        row.setCellsJson(cellsJson);
        tab.getRows().add(row);
    }
}
