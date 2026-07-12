package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreateInitialSaleRequest;
import com.arcadia.premium.dto.InitialSaleDto;
import com.arcadia.premium.model.InitialSale;
import com.arcadia.premium.repository.InitialSaleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InitialSaleService {

    private static final Logger log = LoggerFactory.getLogger(InitialSaleService.class);

    private final InitialSaleRepository repo;

    public InitialSaleService(InitialSaleRepository repo) {
        this.repo = repo;
    }

    public List<InitialSaleDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(InitialSaleDto::fromEntity)
                .toList();
    }

    public InitialSaleDto getById(Long id) {
        InitialSale entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Initial sale not found with id: " + id));
        return InitialSaleDto.fromEntity(entity);
    }

    public List<InitialSaleDto> getByProject(String projectName) {
        return repo.findByProjectNameOrderByCreatedAtDesc(projectName)
                .stream()
                .map(InitialSaleDto::fromEntity)
                .toList();
    }

    public List<InitialSaleDto> search(String customerName) {
        return repo.findByCustomerNameContainingIgnoreCaseOrderByCreatedAtDesc(customerName)
                .stream()
                .map(InitialSaleDto::fromEntity)
                .toList();
    }

    @Transactional
    public InitialSaleDto create(CreateInitialSaleRequest req) {
        InitialSale entity = new InitialSale();
        mapFields(req, entity);
        entity = repo.save(entity);
        log.info("Created initial sale id={} customer={} project={}", entity.getId(), entity.getCustomerName(), entity.getProjectName());
        return InitialSaleDto.fromEntity(entity);
    }

    @Transactional
    public InitialSaleDto update(Long id, CreateInitialSaleRequest req) {
        InitialSale entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Initial sale not found with id: " + id));
        mapFields(req, entity);
        entity = repo.save(entity);
        log.info("Updated initial sale id={} customer={} project={}", entity.getId(), entity.getCustomerName(), entity.getProjectName());
        return InitialSaleDto.fromEntity(entity);
    }

    @Transactional
    public void delete(Long id) {
        InitialSale entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Initial sale not found with id: " + id));
        repo.delete(entity);
        log.info("Deleted initial sale id={} customer={} project={}", id, entity.getCustomerName(), entity.getProjectName());
    }

    private void mapFields(CreateInitialSaleRequest req, InitialSale entity) {
        entity.setCustomerName(req.getCustomerName());
        entity.setSqYardsVilla(req.getSqYardsVilla());
        entity.setVillaNumber(req.getVillaNumber());
        entity.setSaleMode(req.getSaleMode());
        entity.setProjectName(req.getProjectName());
        entity.setSftPerSqYard(req.getSftPerSqYard());
        entity.setSalePricePerSft(req.getSalePricePerSft());
        entity.setDefaultFacing(req.getDefaultFacing());
        entity.setFacingCharges(req.getFacingCharges());
        entity.setExtraLandSqYards(req.getExtraLandSqYards());
        entity.setExtraLandPricePerSqYard(req.getExtraLandPricePerSqYard());
        entity.setPaymentTillNow(req.getPaymentTillNow());
        entity.setTotalSftPerVilla(req.getTotalSftPerVilla());
        entity.setTotalSftPrice(req.getTotalSftPrice());
        entity.setExtraLandTotal(req.getExtraLandTotal());
        entity.setBasePriceAmount(req.getBasePriceAmount());
        entity.setBalanceInBasePrice(req.getBalanceInBasePrice());
        entity.setNewSftPerSqYard(req.getNewSftPerSqYard());
        entity.setNewSalePricePerSft(req.getNewSalePricePerSft());
        entity.setNewDefaultFacing(req.getNewDefaultFacing());
        entity.setNewFacingCharges(req.getNewFacingCharges());
        entity.setNewExtraLandSqYards(req.getNewExtraLandSqYards());
        entity.setNewExtraLandPricePerSqYard(req.getNewExtraLandPricePerSqYard());
        entity.setNewPaymentTillNow(req.getNewPaymentTillNow());
        entity.setNewTotalSftPerVilla(req.getNewTotalSftPerVilla());
        entity.setNewTotalSftPrice(req.getNewTotalSftPrice());
        entity.setNewExtraLandTotal(req.getNewExtraLandTotal());
        entity.setNewBasePriceAmount(req.getNewBasePriceAmount());
        entity.setNewBalanceInBasePrice(req.getNewBalanceInBasePrice());
        entity.setClubHouseApplicable(req.getClubHouseApplicable());
        entity.setClubHouseAmount(req.getClubHouseAmount());
        entity.setCorpusFundApplicable(req.getCorpusFundApplicable());
        entity.setCorpusFundAmount(req.getCorpusFundAmount());
        entity.setLegalChargesApplicable(req.getLegalChargesApplicable());
        entity.setLegalChargesAmount(req.getLegalChargesAmount());
        entity.setCautionDepositApplicable(req.getCautionDepositApplicable());
        entity.setCautionDepositAmount(req.getCautionDepositAmount());
        entity.setAdvanceMaintenanceApplicable(req.getAdvanceMaintenanceApplicable());
        entity.setAdvanceMaintenanceRate(req.getAdvanceMaintenanceRate());
        entity.setAdvanceMaintenanceMonths(req.getAdvanceMaintenanceMonths());
        entity.setAdvanceMaintenanceAmount(req.getAdvanceMaintenanceAmount());
        entity.setNewAdvanceMaintenanceAmount(req.getNewAdvanceMaintenanceAmount());
        entity.setRegistrationPaymentApplicable(req.getRegistrationPaymentApplicable());
        entity.setGstPercentage(req.getGstPercentage());
        entity.setGstAmount(req.getGstAmount());
        entity.setNewGstAmount(req.getNewGstAmount());
        entity.setStampDutyPercentage(req.getStampDutyPercentage());
        entity.setStampDutyAmount(req.getStampDutyAmount());
        entity.setNewStampDutyAmount(req.getNewStampDutyAmount());
        entity.setLandRatePerSqYard(req.getLandRatePerSqYard());
        entity.setNewLandRatePerSqYard(req.getNewLandRatePerSqYard());
        entity.setTotalLandCost(req.getTotalLandCost());
        entity.setNewTotalLandCost(req.getNewTotalLandCost());
        entity.setBasicSaleValue(req.getBasicSaleValue());
        entity.setNewBasicSaleValue(req.getNewBasicSaleValue());
        entity.setSalePriceRowsJson(req.getSalePriceRowsJson());
    }
}
