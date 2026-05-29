package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateSaleQuoteRequest;
import com.arcadia.premium.dto.SaleQuoteDto;
import com.arcadia.premium.model.SaleQuote;
import com.arcadia.premium.repository.SaleQuoteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaleQuoteService {

    private final SaleQuoteRepository repository;

    public SaleQuoteService(SaleQuoteRepository repository) {
        this.repository = repository;
    }

    public SaleQuoteDto create(CreateSaleQuoteRequest req, String createdBy) {
        SaleQuote e = new SaleQuote();
        e.setQuoteDate(req.getQuoteDate() != null ? req.getQuoteDate() : LocalDate.now());
        e.setCustomerName(req.getCustomerName());
        e.setCustomerPhone(req.getCustomerPhone());
        e.setPlotNo(req.getPlotNo());
        e.setPlotAreaSqYards(req.getPlotAreaSqYards());
        e.setConstructionRatio(req.getConstructionRatio());
        e.setTotalConstructionSft(req.getTotalConstructionSft());
        e.setPricingOption(req.getPricingOption());
        e.setRatePerSft(req.getRatePerSft());
        e.setSplitOtpPercent(req.getSplitOtpPercent());
        e.setSplitGeneralPercent(req.getSplitGeneralPercent());
        e.setSplitOtpRate(req.getSplitOtpRate());
        e.setSplitGeneralRate(req.getSplitGeneralRate());
        e.setSaleValue(req.getSaleValue());
        e.setClubHouseCharges(req.getClubHouseCharges());
        e.setCorpusFund(req.getCorpusFund());
        e.setLegalCharges(req.getLegalCharges());
        e.setCautionDeposit(req.getCautionDeposit());
        e.setAdvanceMaintenance(req.getAdvanceMaintenance());
        e.setAdditionalChargesTotal(req.getAdditionalChargesTotal());
        e.setPlcTotal(req.getPlcTotal());
        e.setPlcDetails(req.getPlcDetails());
        e.setGrandTotal(req.getGrandTotal());
        e.setAmountInWords(req.getAmountInWords());
        e.setSalesPerson(req.getSalesPerson());
        e.setNotes(req.getNotes());
        e.setCreatedBy(createdBy);
        return SaleQuoteDto.fromEntity(repository.save(e));
    }

    public List<SaleQuoteDto> getAll() {
        return repository.findAllByOrderByQuoteDateDesc()
                .stream().map(SaleQuoteDto::fromEntity).collect(Collectors.toList());
    }

    public List<SaleQuoteDto> getByDateRange(LocalDate from, LocalDate to) {
        return repository.findByQuoteDateBetweenOrderByQuoteDateDesc(from, to)
                .stream().map(SaleQuoteDto::fromEntity).collect(Collectors.toList());
    }

    public List<SaleQuoteDto> getByDate(LocalDate date) {
        return repository.findByQuoteDateOrderByCreatedAtDesc(date)
                .stream().map(SaleQuoteDto::fromEntity).collect(Collectors.toList());
    }

    public List<SaleQuoteDto> search(String search, LocalDate from, LocalDate to) {
        return repository.searchQuotes(search, from, to)
                .stream().map(SaleQuoteDto::fromEntity).collect(Collectors.toList());
    }

    public SaleQuoteDto getById(Long id) {
        return repository.findById(id).map(SaleQuoteDto::fromEntity).orElse(null);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
