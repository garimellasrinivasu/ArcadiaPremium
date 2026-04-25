package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateSaleEntryRequest;
import com.arcadia.premium.dto.SaleEntryDto;
import com.arcadia.premium.dto.UpdatePaymentRequest;
import com.arcadia.premium.model.SaleEntry;
import com.arcadia.premium.repository.SaleEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleEntryService {

    // Default charge values
    private static final BigDecimal DEFAULT_CLUB_HOUSE = new BigDecimal("1000000");
    private static final BigDecimal DEFAULT_CORPUS_FUND = new BigDecimal("100000");
    private static final BigDecimal DEFAULT_LEGAL_DOC = new BigDecimal("25000");
    private static final BigDecimal DEFAULT_CAUTION_DEPOSIT = new BigDecimal("50000");
    private static final BigDecimal DEFAULT_MAINT_RATE = new BigDecimal("3.5");
    private static final int DEFAULT_MAINT_MONTHS = 24;

    private final SaleEntryRepository repository;

    public SaleEntryService(SaleEntryRepository repository) {
        this.repository = repository;
    }

    public List<SaleEntryDto> getAllSaleEntries() {
        return repository.findAllByOrderBySerialNoAsc().stream()
                .map(SaleEntryDto::fromEntity)
                .collect(Collectors.toList());
    }

    public SaleEntryDto getSaleEntryById(Long id) {
        return repository.findById(id)
                .map(SaleEntryDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("Sale entry not found with id: " + id));
    }

    public List<SaleEntryDto> searchByCustomerName(String name) {
        return repository.findByCustomerNameContainingIgnoreCase(name).stream()
                .map(SaleEntryDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public SaleEntryDto createSaleEntry(CreateSaleEntryRequest request) {
        SaleEntry entry = new SaleEntry();

        Integer maxSerial = repository.findMaxSerialNo();
        entry.setSerialNo(maxSerial + 1);

        applyBasicFields(entry, request);
        applyAdditionalCharges(entry, request);
        calculateTotals(entry, request.getReceivedAmount(), request.getTypeOfSale());

        return SaleEntryDto.fromEntity(repository.save(entry));
    }

    @Transactional
    public SaleEntryDto updateSaleEntry(Long id, CreateSaleEntryRequest request) {
        SaleEntry entry = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale entry not found with id: " + id));

        applyBasicFields(entry, request);
        applyAdditionalCharges(entry, request);

        BigDecimal received = request.getReceivedAmount() != null ? request.getReceivedAmount() : entry.getReceivedAmount();
        calculateTotals(entry, received, entry.getTypeOfSale());

        return SaleEntryDto.fromEntity(repository.save(entry));
    }

    @Transactional
    public SaleEntryDto updatePayment(Long id, UpdatePaymentRequest request) {
        SaleEntry entry = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale entry not found with id: " + id));

        if (request.getRemarks() != null) {
            entry.setRemarks(request.getRemarks());
        }

        calculateTotals(entry, request.getReceivedAmount(), entry.getTypeOfSale());

        return SaleEntryDto.fromEntity(repository.save(entry));
    }

    @Transactional
    public void deleteSaleEntry(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Sale entry not found with id: " + id);
        }
        repository.deleteById(id);
    }

    // --- Private helpers ---

    private void applyBasicFields(SaleEntry entry, CreateSaleEntryRequest req) {
        if (req.getBookingDate() != null) entry.setBookingDate(req.getBookingDate());
        if (req.getProject() != null) entry.setProject(req.getProject());
        if (req.getSpgPraneeth() != null) entry.setSpgPraneeth(req.getSpgPraneeth());
        if (req.getTokenNumber() != null) entry.setTokenNumber(req.getTokenNumber());
        if (req.getCustomerName() != null) entry.setCustomerName(req.getCustomerName());
        if (req.getPersonalCompany() != null) entry.setPersonalCompany(req.getPersonalCompany());
        if (req.getSol() != null) entry.setSol(req.getSol());
        if (req.getTypeOfSale() != null) entry.setTypeOfSale(req.getTypeOfSale());
        if (req.getLandExtentSqYards() != null) entry.setLandExtentSqYards(req.getLandExtentSqYards());
        if (req.getSbuaSft() != null) entry.setSbuaSft(req.getSbuaSft());
        if (req.getFacing() != null) entry.setFacing(req.getFacing());
        if (req.getBasePricePerSft() != null) entry.setBasePricePerSft(req.getBasePricePerSft());
        if (req.getAmenitiesPremiums() != null) entry.setAmenitiesPremiums(req.getAmenitiesPremiums());
        if (req.getRemarks() != null) entry.setRemarks(req.getRemarks());
    }

    private void applyAdditionalCharges(SaleEntry entry, CreateSaleEntryRequest req) {
        BigDecimal sbua = entry.getSbuaSft() != null ? entry.getSbuaSft() : BigDecimal.ZERO;
        BigDecimal additionalTotal = BigDecimal.ZERO;

        // Club House / Amenities Charges
        boolean clubHouse = Boolean.TRUE.equals(req.getIncludeClubHouse());
        entry.setIncludeClubHouse(clubHouse);
        BigDecimal clubHouseAmt = clubHouse
                ? (req.getClubHouseCharges() != null ? req.getClubHouseCharges() : DEFAULT_CLUB_HOUSE)
                : BigDecimal.ZERO;
        entry.setClubHouseCharges(clubHouseAmt);
        if (clubHouse) additionalTotal = additionalTotal.add(clubHouseAmt);

        // Corpus Fund
        boolean corpus = Boolean.TRUE.equals(req.getIncludeCorpusFund());
        entry.setIncludeCorpusFund(corpus);
        BigDecimal corpusAmt = corpus
                ? (req.getCorpusFund() != null ? req.getCorpusFund() : DEFAULT_CORPUS_FUND)
                : BigDecimal.ZERO;
        entry.setCorpusFund(corpusAmt);
        if (corpus) additionalTotal = additionalTotal.add(corpusAmt);

        // Legal & Documentation
        boolean legal = Boolean.TRUE.equals(req.getIncludeLegalDoc());
        entry.setIncludeLegalDoc(legal);
        BigDecimal legalAmt = legal
                ? (req.getLegalDocCharges() != null ? req.getLegalDocCharges() : DEFAULT_LEGAL_DOC)
                : BigDecimal.ZERO;
        entry.setLegalDocCharges(legalAmt);
        if (legal) additionalTotal = additionalTotal.add(legalAmt);

        // Refundable Caution Deposit
        boolean caution = Boolean.TRUE.equals(req.getIncludeCautionDeposit());
        entry.setIncludeCautionDeposit(caution);
        BigDecimal cautionAmt = caution
                ? (req.getRefundableCautionDeposit() != null ? req.getRefundableCautionDeposit() : DEFAULT_CAUTION_DEPOSIT)
                : BigDecimal.ZERO;
        entry.setRefundableCautionDeposit(cautionAmt);
        if (caution) additionalTotal = additionalTotal.add(cautionAmt);

        // Advance Maintenance = rate/sft × SBUA × months
        boolean maint = Boolean.TRUE.equals(req.getIncludeAdvanceMaintenance());
        entry.setIncludeAdvanceMaintenance(maint);
        BigDecimal maintRate = req.getAdvanceMaintRatePerSft() != null ? req.getAdvanceMaintRatePerSft() : DEFAULT_MAINT_RATE;
        int maintMonths = req.getAdvanceMaintMonths() != null ? req.getAdvanceMaintMonths() : DEFAULT_MAINT_MONTHS;
        entry.setAdvanceMaintRatePerSft(maintRate);
        entry.setAdvanceMaintMonths(maintMonths);
        BigDecimal maintTotal = maint
                ? maintRate.multiply(sbua).multiply(BigDecimal.valueOf(maintMonths))
                : BigDecimal.ZERO;
        entry.setAdvanceMaintenanceTotal(maintTotal);
        if (maint) additionalTotal = additionalTotal.add(maintTotal);

        entry.setTotalAdditionalCharges(additionalTotal);
    }

    private void calculateTotals(SaleEntry entry, BigDecimal receivedAmount, String typeOfSale) {
        BigDecimal sbua = entry.getSbuaSft() != null ? entry.getSbuaSft() : BigDecimal.ZERO;
        BigDecimal basePrice = entry.getBasePricePerSft() != null ? entry.getBasePricePerSft() : BigDecimal.ZERO;
        BigDecimal saleAmount = sbua.multiply(basePrice);
        entry.setTotalSalesConsideration(saleAmount);

        BigDecimal additional = entry.getTotalAdditionalCharges() != null ? entry.getTotalAdditionalCharges() : BigDecimal.ZERO;
        BigDecimal grandTotal = saleAmount.add(additional);
        entry.setGrandTotal(grandTotal);

        BigDecimal received = receivedAmount != null ? receivedAmount : BigDecimal.ZERO;
        entry.setReceivedAmount(received);
        entry.setBalanceToReceive(grandTotal.subtract(received));

        if ("OTP".equalsIgnoreCase(typeOfSale)) {
            entry.setBalancePlanApproved(grandTotal.subtract(received));
        } else {
            BigDecimal twentyPercent = grandTotal.multiply(new BigDecimal("0.20"));
            BigDecimal planBalance = twentyPercent.subtract(received).max(BigDecimal.ZERO);
            entry.setBalancePlanApproved(planBalance);
        }

        entry.setBalanceDuringExecution(BigDecimal.ZERO);
    }
}
