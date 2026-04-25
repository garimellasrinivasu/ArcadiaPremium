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

        // Auto-assign next serial number
        Integer maxSerial = repository.findMaxSerialNo();
        entry.setSerialNo(maxSerial + 1);

        entry.setBookingDate(request.getBookingDate());
        entry.setProject(request.getProject());
        entry.setSpgPraneeth(request.getSpgPraneeth());
        entry.setTokenNumber(request.getTokenNumber());
        entry.setCustomerName(request.getCustomerName());
        entry.setPersonalCompany(request.getPersonalCompany());
        entry.setSol(request.getSol());
        entry.setTypeOfSale(request.getTypeOfSale());
        entry.setLandExtentSqYards(request.getLandExtentSqYards());
        entry.setSbuaSft(request.getSbuaSft());
        entry.setFacing(request.getFacing());
        entry.setBasePricePerSft(request.getBasePricePerSft());
        entry.setAmenitiesPremiums(request.getAmenitiesPremiums());
        entry.setRemarks(request.getRemarks());

        // Calculate: Total = SBUA * Base Price per Sft
        BigDecimal sbua = request.getSbuaSft() != null ? request.getSbuaSft() : BigDecimal.ZERO;
        BigDecimal basePrice = request.getBasePricePerSft() != null ? request.getBasePricePerSft() : BigDecimal.ZERO;
        BigDecimal total = sbua.multiply(basePrice);
        entry.setTotalSalesConsideration(total);

        // Set received and calculate balance
        BigDecimal received = request.getReceivedAmount() != null ? request.getReceivedAmount() : BigDecimal.ZERO;
        entry.setReceivedAmount(received);
        entry.setBalanceToReceive(total.subtract(received));

        // Balance at Plan Approved: OTP = full balance, Resale = 20% of total
        if ("OTP".equalsIgnoreCase(request.getTypeOfSale())) {
            entry.setBalancePlanApproved(total.subtract(received));
        } else {
            // Resale: 20% of total minus received
            BigDecimal twentyPercent = total.multiply(new BigDecimal("0.20"));
            BigDecimal planBalance = twentyPercent.subtract(received).max(BigDecimal.ZERO);
            entry.setBalancePlanApproved(planBalance);
        }

        // Balance during execution (CRM) starts at 0
        entry.setBalanceDuringExecution(BigDecimal.ZERO);

        return SaleEntryDto.fromEntity(repository.save(entry));
    }

    @Transactional
    public SaleEntryDto updatePayment(Long id, UpdatePaymentRequest request) {
        SaleEntry entry = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale entry not found with id: " + id));

        BigDecimal newReceived = request.getReceivedAmount();
        entry.setReceivedAmount(newReceived);

        // Recalculate balances
        BigDecimal total = entry.getTotalSalesConsideration() != null
                ? entry.getTotalSalesConsideration() : BigDecimal.ZERO;
        entry.setBalanceToReceive(total.subtract(newReceived));

        // Recalculate plan approved balance
        if ("OTP".equalsIgnoreCase(entry.getTypeOfSale())) {
            entry.setBalancePlanApproved(total.subtract(newReceived));
        } else {
            BigDecimal twentyPercent = total.multiply(new BigDecimal("0.20"));
            BigDecimal planBalance = twentyPercent.subtract(newReceived).max(BigDecimal.ZERO);
            entry.setBalancePlanApproved(planBalance);
        }

        if (request.getRemarks() != null) {
            entry.setRemarks(request.getRemarks());
        }

        return SaleEntryDto.fromEntity(repository.save(entry));
    }

    @Transactional
    public SaleEntryDto updateSaleEntry(Long id, CreateSaleEntryRequest request) {
        SaleEntry entry = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sale entry not found with id: " + id));

        if (request.getBookingDate() != null) entry.setBookingDate(request.getBookingDate());
        if (request.getProject() != null) entry.setProject(request.getProject());
        if (request.getSpgPraneeth() != null) entry.setSpgPraneeth(request.getSpgPraneeth());
        if (request.getTokenNumber() != null) entry.setTokenNumber(request.getTokenNumber());
        if (request.getCustomerName() != null) entry.setCustomerName(request.getCustomerName());
        if (request.getPersonalCompany() != null) entry.setPersonalCompany(request.getPersonalCompany());
        if (request.getSol() != null) entry.setSol(request.getSol());
        if (request.getTypeOfSale() != null) entry.setTypeOfSale(request.getTypeOfSale());
        if (request.getLandExtentSqYards() != null) entry.setLandExtentSqYards(request.getLandExtentSqYards());
        if (request.getSbuaSft() != null) entry.setSbuaSft(request.getSbuaSft());
        if (request.getFacing() != null) entry.setFacing(request.getFacing());
        if (request.getBasePricePerSft() != null) entry.setBasePricePerSft(request.getBasePricePerSft());
        if (request.getAmenitiesPremiums() != null) entry.setAmenitiesPremiums(request.getAmenitiesPremiums());
        if (request.getRemarks() != null) entry.setRemarks(request.getRemarks());

        // Recalculate totals
        BigDecimal sbua = entry.getSbuaSft() != null ? entry.getSbuaSft() : BigDecimal.ZERO;
        BigDecimal basePrice = entry.getBasePricePerSft() != null ? entry.getBasePricePerSft() : BigDecimal.ZERO;
        BigDecimal total = sbua.multiply(basePrice);
        entry.setTotalSalesConsideration(total);

        BigDecimal received = request.getReceivedAmount() != null ? request.getReceivedAmount() : entry.getReceivedAmount();
        if (received == null) received = BigDecimal.ZERO;
        entry.setReceivedAmount(received);
        entry.setBalanceToReceive(total.subtract(received));

        if ("OTP".equalsIgnoreCase(entry.getTypeOfSale())) {
            entry.setBalancePlanApproved(total.subtract(received));
        } else {
            BigDecimal twentyPercent = total.multiply(new BigDecimal("0.20"));
            BigDecimal planBalance = twentyPercent.subtract(received).max(BigDecimal.ZERO);
            entry.setBalancePlanApproved(planBalance);
        }

        return SaleEntryDto.fromEntity(repository.save(entry));
    }

    @Transactional
    public void deleteSaleEntry(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Sale entry not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
