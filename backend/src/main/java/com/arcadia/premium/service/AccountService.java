package com.arcadia.premium.service;

import com.arcadia.premium.dto.*;
import com.arcadia.premium.model.*;
import com.arcadia.premium.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final AccountCategoryRepository categoryRepo;
    private final AccountEntryRepository entryRepo;
    private final AccountInvoiceRepository invoiceRepo;
    private final AccountPaymentRepository paymentRepo;

    public AccountService(AccountCategoryRepository categoryRepo,
                          AccountEntryRepository entryRepo,
                          AccountInvoiceRepository invoiceRepo,
                          AccountPaymentRepository paymentRepo) {
        this.categoryRepo = categoryRepo;
        this.entryRepo = entryRepo;
        this.invoiceRepo = invoiceRepo;
        this.paymentRepo = paymentRepo;
    }

    // ─── Category CRUD ──────────────────────────────────────────────────

    public List<AccountCategoryDto> listCategories(String projectName) {
        return categoryRepo.findByProjectNameOrderBySortOrder(projectName).stream()
                .map(AccountCategoryDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AccountCategoryDto createCategory(AccountCategoryDto dto) {
        if (categoryRepo.existsByProjectNameAndCode(dto.getProjectName(), dto.getCode())) {
            throw new RuntimeException("Category code '" + dto.getCode() + "' already exists for project " + dto.getProjectName());
        }
        AccountCategory cat = AccountCategoryDto.toEntity(dto);
        return AccountCategoryDto.fromEntity(categoryRepo.save(cat));
    }

    @Transactional
    public AccountCategoryDto updateCategory(Long id, AccountCategoryDto dto) {
        AccountCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id));
        cat.setCode(dto.getCode());
        cat.setName(dto.getName());
        cat.setSortOrder(dto.getSortOrder());
        return AccountCategoryDto.fromEntity(categoryRepo.save(cat));
    }

    @Transactional
    public void deleteCategory(Long id) {
        AccountCategory cat = categoryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found: " + id));
        List<AccountEntry> entries = entryRepo.findByCategoryId(id);
        if (!entries.isEmpty()) {
            throw new RuntimeException("Cannot delete category with existing entries. Remove entries first.");
        }
        categoryRepo.deleteById(id);
    }

    // ─── Entry CRUD ─────────────────────────────────────────────────────

    public List<AccountEntryDto> listEntries(String projectName, Long categoryId) {
        List<AccountEntry> entries;
        if (categoryId != null) {
            entries = entryRepo.findByProjectNameAndCategoryId(projectName, categoryId);
        } else {
            entries = entryRepo.findByProjectName(projectName);
        }
        List<Long> entryIds = entries.stream().map(AccountEntry::getId).collect(Collectors.toList());
        Map<Long, List<AccountInvoice>> invoiceMap = groupInvoicesByEntryId(entryIds);
        Map<Long, List<AccountPayment>> paymentMap = groupPaymentsByEntryId(entryIds);

        return entries.stream()
                .map(e -> AccountEntryDto.fromEntity(e,
                        invoiceMap.getOrDefault(e.getId(), Collections.emptyList()),
                        paymentMap.getOrDefault(e.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    @Transactional
    public AccountEntryDto createEntry(AccountEntryDto dto) {
        AccountCategory cat = categoryRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + dto.getCategoryId()));
        AccountEntry entry = new AccountEntry();
        entry.setProjectName(dto.getProjectName());
        entry.setCategory(cat);
        entry.setSerialNumber(dto.getSerialNumber());
        entry.setName(dto.getName());
        entry.setItemWork(dto.getItemWork());
        AccountEntry saved = entryRepo.save(entry);
        return AccountEntryDto.fromEntity(saved, Collections.emptyList(), Collections.emptyList());
    }

    @Transactional
    public AccountEntryDto updateEntry(Long id, AccountEntryDto dto) {
        AccountEntry entry = entryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found: " + id));
        if (dto.getCategoryId() != null) {
            AccountCategory cat = categoryRepo.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found: " + dto.getCategoryId()));
            entry.setCategory(cat);
        }
        entry.setSerialNumber(dto.getSerialNumber());
        entry.setName(dto.getName());
        entry.setItemWork(dto.getItemWork());
        AccountEntry saved = entryRepo.save(entry);
        List<AccountInvoice> invoices = invoiceRepo.findByEntryId(id);
        List<AccountPayment> payments = paymentRepo.findByEntryId(id);
        return AccountEntryDto.fromEntity(saved, invoices, payments);
    }

    @Transactional
    public void deleteEntry(Long id) {
        AccountEntry entry = entryRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Entry not found: " + id));
        // Delete all invoices and payments for this entry first
        List<AccountInvoice> invoices = invoiceRepo.findByEntryId(id);
        invoiceRepo.deleteAll(invoices);
        List<AccountPayment> payments = paymentRepo.findByEntryId(id);
        paymentRepo.deleteAll(payments);
        entryRepo.deleteById(id);
    }

    // ─── Invoice CRUD ───────────────────────────────────────────────────

    @Transactional
    public AccountInvoiceDto addInvoice(Long entryId, AccountInvoiceDto dto) {
        AccountEntry entry = entryRepo.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found: " + entryId));
        AccountInvoice inv = new AccountInvoice();
        inv.setEntry(entry);
        inv.setInvoiceDate(dto.getInvoiceDate());
        inv.setAmount(dto.getAmount());
        inv.setDescription(dto.getDescription());
        return AccountInvoiceDto.fromEntity(invoiceRepo.save(inv));
    }

    @Transactional
    public AccountInvoiceDto updateInvoice(Long id, AccountInvoiceDto dto) {
        AccountInvoice inv = invoiceRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + id));
        inv.setInvoiceDate(dto.getInvoiceDate());
        inv.setAmount(dto.getAmount());
        inv.setDescription(dto.getDescription());
        return AccountInvoiceDto.fromEntity(invoiceRepo.save(inv));
    }

    @Transactional
    public void deleteInvoice(Long id) {
        if (!invoiceRepo.existsById(id)) {
            throw new RuntimeException("Invoice not found: " + id);
        }
        invoiceRepo.deleteById(id);
    }

    // ─── Payment CRUD ───────────────────────────────────────────────────

    @Transactional
    public AccountPaymentDto addPayment(Long entryId, AccountPaymentDto dto) {
        AccountEntry entry = entryRepo.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Entry not found: " + entryId));
        AccountPayment pmt = new AccountPayment();
        pmt.setEntry(entry);
        pmt.setPaymentDate(dto.getPaymentDate());
        pmt.setAmount(dto.getAmount());
        pmt.setDescription(dto.getDescription());
        return AccountPaymentDto.fromEntity(paymentRepo.save(pmt));
    }

    @Transactional
    public AccountPaymentDto updatePayment(Long id, AccountPaymentDto dto) {
        AccountPayment pmt = paymentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
        pmt.setPaymentDate(dto.getPaymentDate());
        pmt.setAmount(dto.getAmount());
        pmt.setDescription(dto.getDescription());
        return AccountPaymentDto.fromEntity(paymentRepo.save(pmt));
    }

    @Transactional
    public void deletePayment(Long id) {
        if (!paymentRepo.existsById(id)) {
            throw new RuntimeException("Payment not found: " + id);
        }
        paymentRepo.deleteById(id);
    }

    // ─── Ledger ─────────────────────────────────────────────────────────

    public List<AccountEntryDto> getLedger(String projectName) {
        List<AccountEntry> entries = entryRepo.findByProjectName(projectName);
        List<Long> entryIds = entries.stream().map(AccountEntry::getId).collect(Collectors.toList());
        Map<Long, List<AccountInvoice>> invoiceMap = groupInvoicesByEntryId(entryIds);
        Map<Long, List<AccountPayment>> paymentMap = groupPaymentsByEntryId(entryIds);

        return entries.stream()
                .map(e -> AccountEntryDto.fromEntity(e,
                        invoiceMap.getOrDefault(e.getId(), Collections.emptyList()),
                        paymentMap.getOrDefault(e.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    // ─── Summary ────────────────────────────────────────────────────────

    public List<AccountSummaryDto> getSummary(String projectName, String periodType,
                                               LocalDate startDate, LocalDate endDate) {
        List<AccountEntry> entries = entryRepo.findByProjectName(projectName);
        List<Long> entryIds = entries.stream().map(AccountEntry::getId).collect(Collectors.toList());
        if (entryIds.isEmpty()) {
            return Collections.emptyList();
        }

        // Build a map of entryId -> categoryName for breakdown
        Map<Long, String> entryCategoryMap = entries.stream()
                .collect(Collectors.toMap(AccountEntry::getId,
                        e -> e.getCategory() != null ? e.getCategory().getName() : "Uncategorized"));

        List<AccountInvoice> allInvoices = invoiceRepo.findByEntryIdInAndInvoiceDateBetween(entryIds, startDate, endDate);
        List<AccountPayment> allPayments = paymentRepo.findByEntryIdInAndPaymentDateBetween(entryIds, startDate, endDate);

        // Generate period boundaries
        List<LocalDate[]> periods = generatePeriods(periodType, startDate, endDate);
        List<AccountSummaryDto> summaries = new ArrayList<>();

        for (LocalDate[] period : periods) {
            LocalDate pStart = period[0];
            LocalDate pEnd = period[1];

            AccountSummaryDto summary = new AccountSummaryDto();
            summary.setPeriodStart(pStart);
            summary.setPeriodEnd(pEnd);
            summary.setPeriodLabel(formatPeriodLabel(periodType, pStart, pEnd));

            // Filter invoices and payments for this period
            List<AccountInvoice> periodInvoices = allInvoices.stream()
                    .filter(inv -> !inv.getInvoiceDate().isBefore(pStart) && !inv.getInvoiceDate().isAfter(pEnd))
                    .collect(Collectors.toList());

            List<AccountPayment> periodPayments = allPayments.stream()
                    .filter(pmt -> !pmt.getPaymentDate().isBefore(pStart) && !pmt.getPaymentDate().isAfter(pEnd))
                    .collect(Collectors.toList());

            BigDecimal totalInvoiced = periodInvoices.stream()
                    .map(AccountInvoice::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalPaid = periodPayments.stream()
                    .map(AccountPayment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            summary.setTotalInvoiced(totalInvoiced);
            summary.setTotalPaid(totalPaid);
            summary.setBalancePayable(totalInvoiced.subtract(totalPaid));

            // Category breakdown (by invoiced amount)
            Map<String, BigDecimal> breakdown = new LinkedHashMap<>();
            for (AccountInvoice inv : periodInvoices) {
                String catName = entryCategoryMap.getOrDefault(inv.getEntry().getId(), "Uncategorized");
                breakdown.merge(catName, inv.getAmount(), BigDecimal::add);
            }
            summary.setCategoryBreakdown(breakdown);
            summaries.add(summary);
        }

        return summaries;
    }

    // ─── Category Totals ────────────────────────────────────────────────

    public List<Map<String, Object>> getCategoryTotals(String projectName) {
        List<AccountCategory> categories = categoryRepo.findByProjectNameOrderBySortOrder(projectName);
        List<AccountEntry> allEntries = entryRepo.findByProjectName(projectName);
        List<Long> allEntryIds = allEntries.stream().map(AccountEntry::getId).collect(Collectors.toList());

        Map<Long, List<AccountInvoice>> invoiceMap = groupInvoicesByEntryId(allEntryIds);
        Map<Long, List<AccountPayment>> paymentMap = groupPaymentsByEntryId(allEntryIds);

        // Group entries by category
        Map<Long, List<AccountEntry>> entriesByCat = allEntries.stream()
                .collect(Collectors.groupingBy(e -> e.getCategory().getId()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (AccountCategory cat : categories) {
            List<AccountEntry> catEntries = entriesByCat.getOrDefault(cat.getId(), Collections.emptyList());
            BigDecimal totalInvoiced = BigDecimal.ZERO;
            BigDecimal totalPaid = BigDecimal.ZERO;

            for (AccountEntry entry : catEntries) {
                List<AccountInvoice> invs = invoiceMap.getOrDefault(entry.getId(), Collections.emptyList());
                List<AccountPayment> pmts = paymentMap.getOrDefault(entry.getId(), Collections.emptyList());
                totalInvoiced = totalInvoiced.add(invs.stream().map(AccountInvoice::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
                totalPaid = totalPaid.add(pmts.stream().map(AccountPayment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add));
            }

            Map<String, Object> catTotal = new LinkedHashMap<>();
            catTotal.put("categoryId", cat.getId());
            catTotal.put("categoryCode", cat.getCode());
            catTotal.put("categoryName", cat.getName());
            catTotal.put("entryCount", catEntries.size());
            catTotal.put("totalInvoiced", totalInvoiced);
            catTotal.put("totalPaid", totalPaid);
            catTotal.put("balancePayable", totalInvoiced.subtract(totalPaid));
            result.add(catTotal);
        }
        return result;
    }

    // ─── Vendor Totals ──────────────────────────────────────────────────

    public List<Map<String, Object>> getVendorTotals(String projectName, LocalDate startDate, LocalDate endDate) {
        List<AccountEntry> entries = entryRepo.findByProjectName(projectName);
        List<Long> entryIds = entries.stream().map(AccountEntry::getId).collect(Collectors.toList());
        if (entryIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<AccountInvoice> invoices;
        List<AccountPayment> payments;
        if (startDate != null && endDate != null) {
            invoices = invoiceRepo.findByEntryIdInAndInvoiceDateBetween(entryIds, startDate, endDate);
            payments = paymentRepo.findByEntryIdInAndPaymentDateBetween(entryIds, startDate, endDate);
        } else {
            invoices = invoiceRepo.findByEntryIdIn(entryIds);
            payments = paymentRepo.findByEntryIdIn(entryIds);
        }

        Map<Long, BigDecimal> invoiceTotalsByEntry = invoices.stream()
                .collect(Collectors.groupingBy(inv -> inv.getEntry().getId(),
                        Collectors.reducing(BigDecimal.ZERO, AccountInvoice::getAmount, BigDecimal::add)));

        Map<Long, BigDecimal> paymentTotalsByEntry = payments.stream()
                .collect(Collectors.groupingBy(pmt -> pmt.getEntry().getId(),
                        Collectors.reducing(BigDecimal.ZERO, AccountPayment::getAmount, BigDecimal::add)));

        List<Map<String, Object>> result = new ArrayList<>();
        for (AccountEntry entry : entries) {
            BigDecimal invTotal = invoiceTotalsByEntry.getOrDefault(entry.getId(), BigDecimal.ZERO);
            BigDecimal pmtTotal = paymentTotalsByEntry.getOrDefault(entry.getId(), BigDecimal.ZERO);
            if (invTotal.compareTo(BigDecimal.ZERO) == 0 && pmtTotal.compareTo(BigDecimal.ZERO) == 0) {
                continue; // skip vendors with no activity in the period
            }
            Map<String, Object> vendorTotal = new LinkedHashMap<>();
            vendorTotal.put("entryId", entry.getId());
            vendorTotal.put("vendorName", entry.getName());
            vendorTotal.put("categoryCode", entry.getCategory() != null ? entry.getCategory().getCode() : null);
            vendorTotal.put("categoryName", entry.getCategory() != null ? entry.getCategory().getName() : null);
            vendorTotal.put("itemWork", entry.getItemWork());
            vendorTotal.put("totalInvoiced", invTotal);
            vendorTotal.put("totalPaid", pmtTotal);
            vendorTotal.put("balancePayable", invTotal.subtract(pmtTotal));
            result.add(vendorTotal);
        }

        // Sort by totalInvoiced descending
        result.sort((a, b) -> ((BigDecimal) b.get("totalInvoiced")).compareTo((BigDecimal) a.get("totalInvoiced")));
        return result;
    }

    // ─── Excel Import ───────────────────────────────────────────────────

    @Transactional
    public Map<String, Object> importFromExcel(String projectName, MultipartFile file) {
        int categoriesImported = 0;
        int entriesImported = 0;
        int invoicesImported = 0;
        int paymentsImported = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) {
                throw new RuntimeException("Excel file has no sheets");
            }

            AccountCategory currentCategory = null;
            int sortOrder = 0;

            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;

                String colA = getCellStringValue(row, 0); // S.No or category marker
                String colB = getCellStringValue(row, 1); // Name
                String colC = getCellStringValue(row, 2); // Item/Work

                // Detect category header row: column A has a single letter code like "A", "B", etc.
                // and column B has the category name
                if (colA != null && colA.matches("^[A-Z]$") && colB != null && !colB.isEmpty()) {
                    // This is a category header row
                    sortOrder++;
                    currentCategory = categoryRepo.findByProjectNameAndCode(projectName, colA)
                            .orElse(null);
                    if (currentCategory == null) {
                        currentCategory = new AccountCategory();
                        currentCategory.setProjectName(projectName);
                        currentCategory.setCode(colA);
                        currentCategory.setName(colB);
                        currentCategory.setSortOrder(sortOrder);
                        currentCategory = categoryRepo.save(currentCategory);
                        categoriesImported++;
                    }
                    continue;
                }

                // Skip rows without a serial number or without a current category
                if (currentCategory == null) continue;
                Integer serialNum = getCellIntValue(row, 0);
                if (serialNum == null && (colB == null || colB.isEmpty())) continue;

                // This is an entry row
                AccountEntry entry = new AccountEntry();
                entry.setProjectName(projectName);
                entry.setCategory(currentCategory);
                entry.setSerialNumber(serialNum);
                entry.setName(colB != null ? colB : "");
                entry.setItemWork(colC);
                entry = entryRepo.save(entry);
                entriesImported++;

                // Read invoice columns (D-H, indices 3-7) - monthly invoice amounts
                // Header row should contain month-end dates
                Row headerRow = sheet.getRow(0);
                for (int col = 3; col <= 7; col++) {
                    BigDecimal amount = getCellBigDecimalValue(row, col);
                    if (amount != null && amount.compareTo(BigDecimal.ZERO) != 0) {
                        LocalDate invoiceDate = getCellDateValue(headerRow, col);
                        if (invoiceDate == null) {
                            // Fallback: use a generic month date based on column index
                            invoiceDate = LocalDate.now().withMonth(col - 2).with(TemporalAdjusters.lastDayOfMonth());
                        }
                        AccountInvoice inv = new AccountInvoice();
                        inv.setEntry(entry);
                        inv.setInvoiceDate(invoiceDate);
                        inv.setAmount(amount);
                        inv.setDescription("Imported from Excel");
                        invoiceRepo.save(inv);
                        invoicesImported++;
                    }
                }

                // Read payment columns (J-Y, indices 9-24) - individual payments with dates
                for (int col = 9; col <= 24; col++) {
                    BigDecimal amount = getCellBigDecimalValue(row, col);
                    if (amount != null && amount.compareTo(BigDecimal.ZERO) != 0) {
                        LocalDate paymentDate = getCellDateValue(headerRow, col);
                        if (paymentDate == null) {
                            paymentDate = LocalDate.now();
                        }
                        AccountPayment pmt = new AccountPayment();
                        pmt.setEntry(entry);
                        pmt.setPaymentDate(paymentDate);
                        pmt.setAmount(amount);
                        pmt.setDescription("Imported from Excel");
                        paymentRepo.save(pmt);
                        paymentsImported++;
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error importing accounts Excel file", e);
            throw new RuntimeException("Failed to import Excel: " + e.getMessage(), e);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("categoriesImported", categoriesImported);
        result.put("entriesImported", entriesImported);
        result.put("invoicesImported", invoicesImported);
        result.put("paymentsImported", paymentsImported);
        return result;
    }

    // ─── Excel Export ───────────────────────────────────────────────────

    public byte[] exportToExcel(String projectName) {
        List<AccountCategory> categories = categoryRepo.findByProjectNameOrderBySortOrder(projectName);
        List<AccountEntry> allEntries = entryRepo.findByProjectName(projectName);
        List<Long> allEntryIds = allEntries.stream().map(AccountEntry::getId).collect(Collectors.toList());
        Map<Long, List<AccountInvoice>> invoiceMap = groupInvoicesByEntryId(allEntryIds);
        Map<Long, List<AccountPayment>> paymentMap = groupPaymentsByEntryId(allEntryIds);
        Map<Long, List<AccountEntry>> entriesByCat = allEntries.stream()
                .collect(Collectors.groupingBy(e -> e.getCategory().getId()));

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Accounts Ledger");

            // Styles
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            CellStyle categoryStyle = workbook.createCellStyle();
            Font categoryFont = workbook.createFont();
            categoryFont.setBold(true);
            categoryFont.setFontHeightInPoints((short) 12);
            categoryStyle.setFont(categoryFont);

            CellStyle moneyStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            moneyStyle.setDataFormat(format.getFormat("#,##0.00"));

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"S.No", "Name", "Item/Work", "Total Invoiced", "Total Paid", "Balance Payable"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (AccountCategory cat : categories) {
                // Category header row
                Row catRow = sheet.createRow(rowIdx++);
                Cell codeCell = catRow.createCell(0);
                codeCell.setCellValue(cat.getCode());
                codeCell.setCellStyle(categoryStyle);
                Cell nameCell = catRow.createCell(1);
                nameCell.setCellValue(cat.getName());
                nameCell.setCellStyle(categoryStyle);

                List<AccountEntry> catEntries = entriesByCat.getOrDefault(cat.getId(), Collections.emptyList());
                BigDecimal catInvoiceTotal = BigDecimal.ZERO;
                BigDecimal catPaymentTotal = BigDecimal.ZERO;

                for (AccountEntry entry : catEntries) {
                    List<AccountInvoice> invs = invoiceMap.getOrDefault(entry.getId(), Collections.emptyList());
                    List<AccountPayment> pmts = paymentMap.getOrDefault(entry.getId(), Collections.emptyList());
                    BigDecimal invTotal = invs.stream().map(AccountInvoice::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal pmtTotal = pmts.stream().map(AccountPayment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

                    Row entryRow = sheet.createRow(rowIdx++);
                    if (entry.getSerialNumber() != null) {
                        entryRow.createCell(0).setCellValue(entry.getSerialNumber());
                    }
                    entryRow.createCell(1).setCellValue(entry.getName());
                    entryRow.createCell(2).setCellValue(entry.getItemWork() != null ? entry.getItemWork() : "");

                    Cell invCell = entryRow.createCell(3);
                    invCell.setCellValue(invTotal.doubleValue());
                    invCell.setCellStyle(moneyStyle);

                    Cell pmtCell = entryRow.createCell(4);
                    pmtCell.setCellValue(pmtTotal.doubleValue());
                    pmtCell.setCellStyle(moneyStyle);

                    Cell balCell = entryRow.createCell(5);
                    balCell.setCellValue(invTotal.subtract(pmtTotal).doubleValue());
                    balCell.setCellStyle(moneyStyle);

                    catInvoiceTotal = catInvoiceTotal.add(invTotal);
                    catPaymentTotal = catPaymentTotal.add(pmtTotal);
                }

                // Category subtotal row
                Row subtotalRow = sheet.createRow(rowIdx++);
                Cell subtotalLabel = subtotalRow.createCell(2);
                subtotalLabel.setCellValue("Subtotal - " + cat.getName());
                subtotalLabel.setCellStyle(headerStyle);

                Cell subtotalInv = subtotalRow.createCell(3);
                subtotalInv.setCellValue(catInvoiceTotal.doubleValue());
                subtotalInv.setCellStyle(moneyStyle);

                Cell subtotalPmt = subtotalRow.createCell(4);
                subtotalPmt.setCellValue(catPaymentTotal.doubleValue());
                subtotalPmt.setCellStyle(moneyStyle);

                Cell subtotalBal = subtotalRow.createCell(5);
                subtotalBal.setCellValue(catInvoiceTotal.subtract(catPaymentTotal).doubleValue());
                subtotalBal.setCellStyle(moneyStyle);

                // Blank separator row
                rowIdx++;
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Error exporting accounts to Excel", e);
            throw new RuntimeException("Failed to export Excel: " + e.getMessage(), e);
        }
    }

    // ─── Helper Methods ─────────────────────────────────────────────────

    private Map<Long, List<AccountInvoice>> groupInvoicesByEntryId(List<Long> entryIds) {
        if (entryIds.isEmpty()) return Collections.emptyMap();
        return invoiceRepo.findByEntryIdIn(entryIds).stream()
                .collect(Collectors.groupingBy(inv -> inv.getEntry().getId()));
    }

    private Map<Long, List<AccountPayment>> groupPaymentsByEntryId(List<Long> entryIds) {
        if (entryIds.isEmpty()) return Collections.emptyMap();
        return paymentRepo.findByEntryIdIn(entryIds).stream()
                .collect(Collectors.groupingBy(pmt -> pmt.getEntry().getId()));
    }

    private List<LocalDate[]> generatePeriods(String periodType, LocalDate start, LocalDate end) {
        List<LocalDate[]> periods = new ArrayList<>();
        LocalDate current = start;

        while (!current.isAfter(end)) {
            LocalDate periodEnd;
            switch (periodType.toUpperCase()) {
                case "WEEKLY":
                    periodEnd = current.plusDays(6);
                    break;
                case "BIWEEKLY":
                    periodEnd = current.plusDays(13);
                    break;
                case "MONTHLY":
                default:
                    periodEnd = current.with(TemporalAdjusters.lastDayOfMonth());
                    break;
            }
            if (periodEnd.isAfter(end)) {
                periodEnd = end;
            }
            periods.add(new LocalDate[]{current, periodEnd});
            current = periodEnd.plusDays(1);
        }
        return periods;
    }

    private String formatPeriodLabel(String periodType, LocalDate start, LocalDate end) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");
        DateTimeFormatter fmtMonth = DateTimeFormatter.ofPattern("MMM yyyy");
        if ("MONTHLY".equalsIgnoreCase(periodType)) {
            return start.format(fmtMonth);
        }
        return start.format(fmt) + " - " + end.format(fmt);
    }

    private String getCellStringValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                double num = cell.getNumericCellValue();
                if (num == Math.floor(num)) {
                    return String.valueOf((int) num);
                }
                return String.valueOf(num);
            default:
                return null;
        }
    }

    private Integer getCellIntValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            return (int) cell.getNumericCellValue();
        }
        if (cell.getCellType() == CellType.STRING) {
            try {
                return Integer.parseInt(cell.getStringCellValue().trim());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private BigDecimal getCellBigDecimalValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        if (cell.getCellType() == CellType.NUMERIC) {
            double val = cell.getNumericCellValue();
            if (val == 0) return null;
            return BigDecimal.valueOf(val);
        }
        if (cell.getCellType() == CellType.STRING) {
            try {
                String val = cell.getStringCellValue().trim().replaceAll("[,\\s]", "");
                if (val.isEmpty()) return null;
                return new BigDecimal(val);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private LocalDate getCellDateValue(Row row, int col) {
        if (row == null) return null;
        Cell cell = row.getCell(col);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                java.util.Date date = cell.getDateCellValue();
                return date.toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDate();
            }
            if (cell.getCellType() == CellType.STRING) {
                String dateStr = cell.getStringCellValue().trim();
                // Try common date formats
                for (String pattern : new String[]{"dd-MM-yyyy", "dd/MM/yyyy", "yyyy-MM-dd", "MMM dd, yyyy"}) {
                    try {
                        return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(pattern));
                    } catch (Exception ignored) {}
                }
            }
        } catch (Exception e) {
            log.debug("Could not parse date from cell [{},{}]: {}", row.getRowNum(), col, e.getMessage());
        }
        return null;
    }
}
