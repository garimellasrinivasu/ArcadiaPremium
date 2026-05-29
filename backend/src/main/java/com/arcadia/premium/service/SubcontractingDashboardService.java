package com.arcadia.premium.service;

import com.arcadia.premium.model.*;
import com.arcadia.premium.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SubcontractingDashboardService {

    private final WorkOrderRepository workOrderRepository;
    private final MeasurementBookRepository mbRepository;
    private final RABillRepository raBillRepository;
    private final RABillPaymentCertificateRepository paymentRepository;

    public SubcontractingDashboardService(WorkOrderRepository workOrderRepository,
                                           MeasurementBookRepository mbRepository,
                                           RABillRepository raBillRepository,
                                           RABillPaymentCertificateRepository paymentRepository) {
        this.workOrderRepository = workOrderRepository;
        this.mbRepository = mbRepository;
        this.raBillRepository = raBillRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Dashboard summary with optional projectId filter.
     * Uses consistent key names matching the frontend DashboardSummary interface.
     */
    public Map<String, Object> getDashboardSummary(Long projectId) {
        Map<String, Object> dashboard = new LinkedHashMap<>();

        try {
            // --- Work Orders ---
            List<WorkOrder> allWOs = workOrderRepository.findAllByOrderByCreatedAtDesc();
            List<WorkOrder> filteredWOs = allWOs.stream()
                    .filter(wo -> {
                        if (projectId == null) return true;
                        try { return wo.getJob() != null && wo.getJob().getProject() != null && wo.getJob().getProject().getId().equals(projectId); }
                        catch (Exception e) { return false; }
                    })
                    .collect(Collectors.toList());

            dashboard.put("totalWorkOrders", filteredWOs.size());

            Map<String, Long> woByStatus = filteredWOs.stream()
                    .collect(Collectors.groupingBy(WorkOrder::getStatus, Collectors.counting()));
            dashboard.put("woByStatus", woByStatus);

            BigDecimal totalWOAmount = filteredWOs.stream()
                    .map(WorkOrder::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dashboard.put("totalWOAmount", totalWOAmount);

            // --- Measurement Books ---
            List<MeasurementBook> allMBs = mbRepository.findAllByOrderByCreatedAtDesc();
            List<MeasurementBook> filteredMBs = allMBs.stream()
                    .filter(mb -> {
                        if (projectId == null) return true;
                        try { return mb.getProject() != null && mb.getProject().getId().equals(projectId); }
                        catch (Exception e) { return false; }
                    })
                    .collect(Collectors.toList());

            dashboard.put("totalMBs", filteredMBs.size());
            // MB amount approximated as item count (items don't store an amount directly)
            dashboard.put("totalMBAmount", BigDecimal.ZERO);

            // --- RA Bills ---
            List<RABill> allBills = raBillRepository.findAllByOrderByCreatedAtDesc();
            List<RABill> filteredBills = allBills.stream()
                    .filter(b -> {
                        if (projectId == null) return true;
                        try { return b.getProject() != null && b.getProject().getId().equals(projectId); }
                        catch (Exception e) { return false; }
                    })
                    .collect(Collectors.toList());

            dashboard.put("totalRABills", filteredBills.size());

            Map<String, Long> raBillsByStatus = filteredBills.stream()
                    .collect(Collectors.groupingBy(RABill::getStatus, Collectors.counting()));
            dashboard.put("raBillsByStatus", raBillsByStatus);

            BigDecimal totalRABillAmount = filteredBills.stream()
                    .map(RABill::getNetPayable)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dashboard.put("totalRABillAmount", totalRABillAmount);

            // --- Payments ---
            List<RABillPaymentCertificate> allPayments = paymentRepository.findAllByOrderByCreatedAtDesc();
            List<RABillPaymentCertificate> filteredPayments = allPayments.stream()
                    .filter(p -> {
                        if (projectId == null) return true;
                        try { return p.getWorkOrder() != null && p.getWorkOrder().getJob() != null && p.getWorkOrder().getJob().getProject() != null && p.getWorkOrder().getJob().getProject().getId().equals(projectId); }
                        catch (Exception e) { return false; }
                    })
                    .collect(Collectors.toList());

            dashboard.put("totalPayments", filteredPayments.size());

            BigDecimal totalPaymentAmount = filteredPayments.stream()
                    .map(RABillPaymentCertificate::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            dashboard.put("totalPaymentAmount", totalPaymentAmount);

            // --- Recent Work Orders (last 5) ---
            List<Map<String, Object>> recentWOs = filteredWOs.stream()
                    .limit(5)
                    .map(wo -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", wo.getId());
                        m.put("woNumber", wo.getWoNumber());
                        m.put("jobName", wo.getJob() != null ? wo.getJob().getName() : "—");
                        m.put("contractorName", wo.getContractor() != null ? wo.getContractor().getName() : "—");
                        m.put("status", wo.getStatus());
                        m.put("totalAmount", wo.getTotalAmount());
                        m.put("woDate", wo.getWoDate());
                        return m;
                    })
                    .collect(Collectors.toList());
            dashboard.put("recentWorkOrders", recentWOs);

            // --- Recent RA Bills (last 5) ---
            List<Map<String, Object>> recentBills = filteredBills.stream()
                    .limit(5)
                    .map(bill -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("id", bill.getId());
                        m.put("billNumber", bill.getBillNo());
                        m.put("contractorName", bill.getContractor() != null ? bill.getContractor().getName() : "—");
                        m.put("billType", bill.getBillType());
                        m.put("status", bill.getStatus());
                        m.put("netPayable", bill.getNetPayable());
                        m.put("billDate", bill.getBillDate());
                        return m;
                    })
                    .collect(Collectors.toList());
            dashboard.put("recentRABills", recentBills);

        } catch (Exception e) {
            // Return safe defaults if any error occurs
            dashboard.putIfAbsent("totalWorkOrders", 0);
            dashboard.putIfAbsent("woByStatus", Collections.emptyMap());
            dashboard.putIfAbsent("totalWOAmount", BigDecimal.ZERO);
            dashboard.putIfAbsent("totalMBs", 0);
            dashboard.putIfAbsent("totalMBAmount", BigDecimal.ZERO);
            dashboard.putIfAbsent("totalRABills", 0);
            dashboard.putIfAbsent("raBillsByStatus", Collections.emptyMap());
            dashboard.putIfAbsent("totalRABillAmount", BigDecimal.ZERO);
            dashboard.putIfAbsent("totalPayments", 0);
            dashboard.putIfAbsent("totalPaymentAmount", BigDecimal.ZERO);
            dashboard.putIfAbsent("recentWorkOrders", Collections.emptyList());
            dashboard.putIfAbsent("recentRABills", Collections.emptyList());
        }

        return dashboard;
    }
}
