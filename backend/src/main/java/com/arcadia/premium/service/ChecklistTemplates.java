package com.arcadia.premium.service;

import java.util.List;

/**
 * Default checklist items, from the handwritten checklists shared on 14-Oct-2026
 * (Arcadia_Sales_Required_Documentation.pdf and Arcadia_Arvindam_RERA_Documentation.pdf).
 *
 * Status here is what those sheets showed (ticked = COMPLETED). It is applied only to the projects
 * the sheets were for; every other project gets the same items as NOT_STARTED.
 * Target dates are left empty on purpose — owners set them in the app.
 */
final class ChecklistTemplates {

    record Item(String section, String title, String details, String owner, String status) {}

    private ChecklistTemplates() {}

    static final String SALES_PREP = "SALES_PREP";
    static final String RERA_DOCS = "RERA_DOCS";

    private static final String C = "COMPLETED", IP = "IN_PROGRESS", NS = "NOT_STARTED";

    static final List<Item> SALES = List.of(
        new Item("Approvals & Legal", "RERA Process", "Clear", null, C),
        new Item("Approvals & Legal", "Premium Link Documents", "Legal opinion & supplementary document", null, C),
        new Item("Approvals & Legal", "Legal Opinion", null, null, C),
        new Item("Approvals & Legal", "Supplementary Agreement", null, null, C),
        new Item("Approvals & Legal", "Signature Authority", null, "Garimella Srinivasu", C),
        new Item("Design & Marketing", "Beautified Master Plan", "Format like Grove Park / Knight Woods", null, NS),
        new Item("Design & Marketing", "Entrance Gate Design", "Final/closed → high resolution, printable format", null, IP),
        new Item("Design & Marketing", "Villa Beautified Floor Plans", null, null, C),
        new Item("Design & Marketing", "Clubhouse Beautified Floor Plans", null, null, C),
        new Item("Design & Marketing", "Villa Elevations – Day Mode & Night Mode", null, null, C),
        new Item("Design & Marketing", "Clubhouse Elevations – Day Mode & Night Mode", "Day mode done; night mode pending", null, IP),
        new Item("Design & Marketing", "Aerial Views – Project & Clubhouse", null, null, C),
        new Item("Design & Marketing", "Street Views", null, null, C),
        new Item("Design & Marketing", "Final Brochure", null, "Sales team", NS),
        new Item("Design & Marketing", "Project Walkthrough Video", "Up to 5 minutes", null, NS),
        new Item("Project Details", "Specifications", "Grove Park format", null, NS),
        new Item("Project Details", "Amenities", null, null, C),
        new Item("Project Details", "Area Statement", "Villa no, facing, sq yards, SFT, dimensions, plinth area, carpet area (Grove Park / Knight Woods format)", null, NS),
        new Item("Project Details", "Infrastructure Details", "Gated community with compound wall; CC/BT roads; water supply model; electricity model (HT/LT); STP; WTP (water treatment plant); solar; CCTV; DG; electrical sub-meters; centralized water plant", null, NS),
        new Item("Sales Process", "Booking Form Finalisation", "As per Praneeth policy", "Sales team", NS),
        new Item("Sales Process", "REALX Approval System", "Notifications to 3 of us; remaining to be set up", null, IP),
        new Item("Sales Process", "Investor Unit Allocation Process", null, "Sales team", NS),
        new Item("Sales Process", "Cancellation & Reversal Process", "As per Praneeth policy", "Dinesh", NS),
        new Item("Sales Process", "Delta Area Settlement", null, "Dinesh", NS),
        new Item("Sales Process", "Bottom Value Receipt", null, "Dinesh", NS),
        new Item("Agreements & Registration", "AOS Draft", null, "Sales team", NS),
        new Item("Agreements & Registration", "Completion Timelines to Be Incorporated into AOS", "Dec 2028 + 6 months", null, NS),
        new Item("Agreements & Registration", "AOS Execution Process", "As per REAL Ex policy", "Sales team", NS),
        new Item("Agreements & Registration", "Sale Deed Draft", null, "Sales team", NS),
        new Item("Agreements & Registration", "Sale Deed Execution Process", "As per REAL Ex policy", null, NS),
        new Item("Agreements & Registration", "Home Loan Processing Procedure", "Need to finalize", null, NS)
    );

    static final List<Item> RERA = List.of(
        new Item("Primary Details", "Partners Details", "Aadhaar, PAN card, mobile no, email id, passport size photo", null, C),
        new Item("Primary Details", "GST Registration Certificate", null, null, C),
        new Item("Primary Details", "Firm PAN Card (attested by Chartered Accountant)", null, null, C),
        new Item("Primary Details", "Firm Previous 3 Years IT Returns", null, null, C),
        new Item("Primary Details", "Firm Registration", null, null, C),
        new Item("Primary Details", "Firm Partnership Deed", null, null, C),
        new Item("Primary Details", "Authorized Signatory Details", "Name & contact details", null, C),
        new Item("Primary Details", "Bank ESCROW Account Details", null, null, C),
        new Item("Primary Details", "Previous Project Details", null, null, NS),
        new Item("Primary Details", "Office Address for Communication", null, null, C),
        new Item("Primary Details", "Contact No, Email, Website", null, null, C),
        new Item("Project Details", "Project Name, Address, Total Site Area", null, null, C),
        new Item("Project Details", "Plan Approvals", null, null, C),
        new Item("Project Details", "Proceeding Letter (Building Permit Order)", null, null, C),
        new Item("Project Details", "Land Owner Details", "Area share/revenue share; Aadhaar, PAN card, mobile no, email id, passport size photo (if site is of development)", null, C),
        new Item("Project Details", "Land Link Documents with Development Agreement", "As per legal opinion", null, C),
        new Item("Project Details", "Municipal Mortgage Deed", "& Gift Deed", null, C),
        new Item("Project Details", "Legal Opinion by Advocate", null, null, IP),
        new Item("Project Details", "Encumbrance Certificate", null, null, C),
        new Item("Project Details", "Architect Enrolment Certificate, Contact No & Email Id", null, null, C),
        new Item("Project Details", "Structural Engineer Certificate, Contact No & Email Id", null, null, NS),
        new Item("Project Details", "Flat Sizes in Saleable Area as per RERA Table from Architect", null, null, C),
        new Item("Project Details", "Chartered Accountant Certificate (Form-3)", "Format will be sent", null, C),
        new Item("Project Details", "Extra Work Details", null, null, C),
        new Item("Project Details", "Total Project Cost", null, null, C),
        new Item("Project Details", "Date of Completion", null, null, C)
    );

    static List<Item> forTracker(String tracker) {
        return SALES_PREP.equals(tracker) ? SALES : RERA;
    }

    /** Whether the statuses on the shared sheets apply to this project */
    static boolean statusesApply(String tracker, String projectName) {
        String p = projectName == null ? "" : projectName.toLowerCase();
        if (SALES_PREP.equals(tracker)) return p.contains("arcadia");
        return p.contains("arcadia") || p.contains("aalaya") || p.contains("arvindham");
    }
}
