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
public class SubcontractingReportService {

    private final WorkOrderRepository workOrderRepository;
    private final MeasurementBookRepository mbRepository;
    private final RABillRepository raBillRepository;
    private final RABillPaymentCertificateRepository paymentRepository;
    private final ContractorRepository contractorRepository;
    private final JobRepository jobRepository;

    public SubcontractingReportService(WorkOrderRepository workOrderRepository,
                                        MeasurementBookRepository mbRepository,
                                        RABillRepository raBillRepository,
                                        RABillPaymentCertificateRepository paymentRepository,
                                        ContractorRepository contractorRepository,
                                        JobRepository jobRepository) {
        this.workOrderRepository = workOrderRepository;
        this.mbRepository = mbRepository;
        this.raBillRepository = raBillRepository;
        this.paymentRepository = paymentRepository;
        this.contractorRepository = contractorRepository;
        this.jobRepository = jobRepository;
    }

    /**
     * Work Order Report - list all WOs with optional filters by projectId, contractorId, status.
     */
    public List<Map<String, Object>> getWorkOrderReport(Long projectId, Long contractorId, String status) {
        List<WorkOrder> workOrders = workOrderRepository.findAllByOrderByCreatedAtDesc();

        return workOrders.stream()
                .filter(wo -> projectId == null || wo.getJob().getProject().getId().equals(projectId))
                .filter(wo -> contractorId == null || wo.getContractor().getId().equals(contractorId))
                .filter(wo -> status == null || status.isEmpty() || wo.getStatus().equalsIgnoreCase(status))
                .map(wo -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", wo.getId());
                    row.put("woNumber", wo.getWoNumber());
                    row.put("jobName", wo.getJob().getName());
                    row.put("projectName", wo.getJob().getProject().getName());
                    row.put("projectId", wo.getJob().getProject().getId());
                    row.put("contractorName", wo.getContractor().getName());
                    row.put("contractorId", wo.getContractor().getId());
                    row.put("woDate", wo.getWoDate());
                    row.put("status", wo.getStatus());
                    row.put("totalAmount", wo.getTotalAmount());
                    row.put("startDate", wo.getStartDate());
                    row.put("endDate", wo.getEndDate());
                    row.put("workDuration", wo.getWorkDuration());
                    row.put("contractType", wo.getContractType());
                    row.put("workOrderTitle", wo.getWorkOrderTitle());
                    return row;
                })
                .collect(Collectors.toList());
    }

    /**
     * Contractor Bill Report - aggregate RA bills by contractor.
     * If contractorId is provided, filter to that contractor only.
     */
    public List<Map<String, Object>> getContractorBillReport(Long contractorId) {
        List<RABill> allBills = raBillRepository.findAllByOrderByCreatedAtDesc();
        List<RABillPaymentCertificate> allPayments = paymentRepository.findAllByOrderByCreatedAtDesc();

        // Group bills by contractor id
        Map<Long, List<RABill>> billsByContractor = allBills.stream()
                .filter(b -> contractorId == null || b.getContractor().getId().equals(contractorId))
                .collect(Collectors.groupingBy(b -> b.getContractor().getId()));

        // Group payments by contractor id
        Map<Long, List<RABillPaymentCertificate>> paymentsByContractor = allPayments.stream()
                .filter(p -> contractorId == null || p.getContractor().getId().equals(contractorId))
                .collect(Collectors.groupingBy(p -> p.getContractor().getId()));

        // Collect all contractor ids
        Set<Long> contractorIds = new HashSet<>();
        contractorIds.addAll(billsByContractor.keySet());
        contractorIds.addAll(paymentsByContractor.keySet());

        return contractorIds.stream()
                .map(cId -> {
                    List<RABill> bills = billsByContractor.getOrDefault(cId, Collections.emptyList());
                    List<RABillPaymentCertificate> payments = paymentsByContractor.getOrDefault(cId, Collections.emptyList());

                    String contractorName = bills.isEmpty()
                            ? (payments.isEmpty() ? "Unknown" : payments.get(0).getContractor().getName())
                            : bills.get(0).getContractor().getName();

                    BigDecimal totalBillAmount = bills.stream()
                            .map(RABill::getNetPayable)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalPaid = payments.stream()
                            .map(RABillPaymentCertificate::getTotalAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("contractorId", cId);
                    row.put("contractorName", contractorName);
                    row.put("totalBillCount", bills.size());
                    row.put("totalBillAmount", totalBillAmount);
                    row.put("totalPaid", totalPaid);
                    row.put("balance", totalBillAmount.subtract(totalPaid));
                    return row;
                })
                .sorted(Comparator.comparing(m -> (String) m.get("contractorName")))
                .collect(Collectors.toList());
    }

    /**
     * WO Report By Unit - work orders grouped by project/unit.
     * If projectId is provided, filter to that project only.
     */
    public List<Map<String, Object>> getWOReportByUnit(Long projectId) {
        List<WorkOrder> workOrders = workOrderRepository.findAllByOrderByCreatedAtDesc();

        Map<Long, List<WorkOrder>> byProject = workOrders.stream()
                .filter(wo -> projectId == null || wo.getJob().getProject().getId().equals(projectId))
                .collect(Collectors.groupingBy(wo -> wo.getJob().getProject().getId()));

        return byProject.entrySet().stream()
                .map(entry -> {
                    List<WorkOrder> wos = entry.getValue();
                    String projectName = wos.get(0).getJob().getProject().getName();

                    BigDecimal totalAmount = wos.stream()
                            .map(WorkOrder::getTotalAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    // Count by status
                    Map<String, Long> statusCounts = wos.stream()
                            .collect(Collectors.groupingBy(WorkOrder::getStatus, Collectors.counting()));

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("projectId", entry.getKey());
                    row.put("projectName", projectName);
                    row.put("woCount", wos.size());
                    row.put("totalAmount", totalAmount);
                    row.put("statusBreakdown", statusCounts);
                    return row;
                })
                .sorted(Comparator.comparing(m -> (String) m.get("projectName")))
                .collect(Collectors.toList());
    }

    /**
     * WO Report By Activity - work order items grouped by activity.
     * If jobId is provided, filter work orders belonging to that job.
     */
    public List<Map<String, Object>> getWOReportByActivity(Long jobId) {
        List<WorkOrder> workOrders;
        if (jobId != null) {
            workOrders = workOrderRepository.findByJobIdOrderByCreatedAtDesc(jobId);
        } else {
            workOrders = workOrderRepository.findAllByOrderByCreatedAtDesc();
        }

        // Flatten all items from all work orders
        List<WorkOrderItem> allItems = workOrders.stream()
                .flatMap(wo -> wo.getItems().stream())
                .collect(Collectors.toList());

        // Group by activity id
        Map<Long, List<WorkOrderItem>> byActivity = allItems.stream()
                .collect(Collectors.groupingBy(item -> item.getActivity().getId()));

        return byActivity.entrySet().stream()
                .map(entry -> {
                    List<WorkOrderItem> items = entry.getValue();
                    ActivityMaster activity = items.get(0).getActivity();

                    BigDecimal totalQty = items.stream()
                            .map(WorkOrderItem::getQuantity)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalAmount = items.stream()
                            .map(WorkOrderItem::getAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("activityId", activity.getId());
                    row.put("activityName", activity.getName());
                    row.put("uom", activity.getUom());
                    row.put("woItemCount", items.size());
                    row.put("totalQuantity", totalQty);
                    row.put("totalAmount", totalAmount);
                    return row;
                })
                .sorted(Comparator.comparing(m -> (String) m.get("activityName")))
                .collect(Collectors.toList());
    }

    /**
     * MB Report By Activity - measurement book data grouped by activity.
     * If workOrderId is provided, filter MBs belonging to that work order.
     */
    public List<Map<String, Object>> getMBReportByActivity(Long workOrderId) {
        List<MeasurementBook> mbs;
        if (workOrderId != null) {
            mbs = mbRepository.findByWorkOrderIdOrderByCreatedAtDesc(workOrderId);
        } else {
            mbs = mbRepository.findAllByOrderByCreatedAtDesc();
        }

        // Flatten all MB items
        List<MeasurementBookItem> allItems = mbs.stream()
                .flatMap(mb -> mb.getItems().stream())
                .collect(Collectors.toList());

        // Group by activity id
        Map<Long, List<MeasurementBookItem>> byActivity = allItems.stream()
                .collect(Collectors.groupingBy(item -> item.getActivity().getId()));

        return byActivity.entrySet().stream()
                .map(entry -> {
                    List<MeasurementBookItem> items = entry.getValue();
                    ActivityMaster activity = items.get(0).getActivity();

                    BigDecimal totalCurrentQty = items.stream()
                            .map(MeasurementBookItem::getCurrentMeasuredQty)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalCumulativeQty = items.stream()
                            .map(MeasurementBookItem::getCumulativeMeasuredQty)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalWoQty = items.stream()
                            .map(MeasurementBookItem::getWoQty)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("activityId", activity.getId());
                    row.put("activityName", activity.getName());
                    row.put("uom", activity.getUom());
                    row.put("mbItemCount", items.size());
                    row.put("totalCurrentMeasuredQty", totalCurrentQty);
                    row.put("totalCumulativeMeasuredQty", totalCumulativeQty);
                    row.put("totalWoQty", totalWoQty);
                    return row;
                })
                .sorted(Comparator.comparing(m -> (String) m.get("activityName")))
                .collect(Collectors.toList());
    }

    /**
     * Bill Approval History - list of RA bills with their approval status timeline.
     * Optionally filter by contractorId and/or status.
     */
    public List<Map<String, Object>> getBillApprovalHistory(Long contractorId, String status) {
        List<RABill> bills;
        if (contractorId != null) {
            bills = raBillRepository.findByContractorIdOrderByCreatedAtDesc(contractorId);
        } else {
            bills = raBillRepository.findAllByOrderByCreatedAtDesc();
        }

        return bills.stream()
                .filter(b -> status == null || status.isEmpty() || b.getStatus().equalsIgnoreCase(status))
                .map(bill -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", bill.getId());
                    row.put("billNo", bill.getBillNo());
                    row.put("billDate", bill.getBillDate());
                    row.put("billType", bill.getBillType());
                    row.put("contractorId", bill.getContractor().getId());
                    row.put("contractorName", bill.getContractor().getName());
                    row.put("workOrderId", bill.getWorkOrder().getId());
                    row.put("woNumber", bill.getWorkOrder().getWoNumber());
                    row.put("projectName", bill.getProject().getName());
                    row.put("currentBillAmount", bill.getCurrentBillAmount());
                    row.put("cumulativeBillAmount", bill.getCumulativeBillAmount());
                    row.put("netPayable", bill.getNetPayable());
                    row.put("status", bill.getStatus());
                    row.put("posted", bill.isPosted());
                    row.put("createdAt", bill.getCreatedAt());
                    row.put("updatedAt", bill.getUpdatedAt());
                    return row;
                })
                .collect(Collectors.toList());
    }
}
