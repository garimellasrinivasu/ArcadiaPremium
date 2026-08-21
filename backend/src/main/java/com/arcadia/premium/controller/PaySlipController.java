package com.arcadia.premium.controller;

import com.arcadia.premium.dto.CreatePaySlipRequest;
import com.arcadia.premium.dto.PaySlipDto;
import com.arcadia.premium.service.EmailService;
import com.arcadia.premium.service.PaySlipService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payslips")
public class PaySlipController {

    private final PaySlipService service;
    private final EmailService emailService;

    public PaySlipController(PaySlipService service, EmailService emailService) {
        this.service = service;
        this.emailService = emailService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> create(@Valid @RequestBody CreatePaySlipRequest req, Principal principal) {
        try {
            PaySlipDto dto = service.create(req, principal.getName());
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<List<PaySlipDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/by-month")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<List<PaySlipDto>> getByMonth(@RequestParam String payMonth) {
        return ResponseEntity.ok(service.getByMonth(payMonth));
    }

    @GetMapping("/by-employee")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<List<PaySlipDto>> getByEmployee(@RequestParam String employeeId) {
        return ResponseEntity.ok(service.getByEmployee(employeeId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getById(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody CreatePaySlipRequest req) {
        try {
            PaySlipDto dto = service.update(id, req);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.delete(id);
            return ResponseEntity.ok(Map.of("message", "Pay slip deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/send-email")
    @PreAuthorize("hasAnyRole('ADMIN','PARTNER') or @pageAccess.hasAccess(authentication, 'PAY_SLIPS')")
    public ResponseEntity<?> sendEmail(@PathVariable Long id, @RequestParam String email) {
        try {
            PaySlipDto paySlip = service.getById(id);

            String salaryDetails = "Employee: " + paySlip.getEmployeeName() + "\n" +
                    "Employee ID: " + paySlip.getEmployeeId() + "\n" +
                    "Designation: " + paySlip.getDesignation() + "\n" +
                    "Department: " + paySlip.getDepartment() + "\n\n" +
                    "--- EARNINGS ---\n" +
                    "Basic: " + paySlip.getBasic() + "\n" +
                    "HRA: " + paySlip.getHra() + "\n" +
                    "Special Allowances: " + paySlip.getSpecialAllowances() + "\n" +
                    "Gross Salary: " + paySlip.getGrossSalary() + "\n\n" +
                    "--- DEDUCTIONS ---\n" +
                    "Provident Fund: " + paySlip.getProvidentFund() + "\n" +
                    "ESI: " + paySlip.getEsi() + "\n" +
                    "Professional Tax: " + paySlip.getProfessionalTax() + "\n" +
                    "TDS: " + paySlip.getTds() + "\n" +
                    "Advances: " + paySlip.getAdvances() + "\n" +
                    "Total Deductions: " + paySlip.getTotalDeductions() + "\n\n" +
                    "NET SALARY: " + paySlip.getNetSalary() + "\n" +
                    "(" + paySlip.getNetSalaryInWords() + ")";

            emailService.sendPaySlipEmail(email, paySlip.getEmployeeName(), paySlip.getPayMonth(), salaryDetails);

            service.markAsSent(id, email);

            return ResponseEntity.ok(Map.of("message", "Pay slip email sent successfully to " + email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
