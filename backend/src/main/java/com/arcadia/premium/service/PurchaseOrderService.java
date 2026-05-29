package com.arcadia.premium.service;

import com.arcadia.premium.dto.CreatePORequest;
import com.arcadia.premium.dto.PurchaseOrderDto;
import com.arcadia.premium.model.PurchaseOrder;
import com.arcadia.premium.model.PurchaseOrderItem;
import com.arcadia.premium.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository repo;
    private final ProjectRepository projectRepo;
    private final VendorRepository vendorRepo;
    private final MaterialIndentRepository indentRepo;
    private final MaterialMasterRepository materialRepo;

    public PurchaseOrderService(PurchaseOrderRepository repo, ProjectRepository projectRepo,
                                 VendorRepository vendorRepo, MaterialIndentRepository indentRepo,
                                 MaterialMasterRepository materialRepo) {
        this.repo = repo;
        this.projectRepo = projectRepo;
        this.vendorRepo = vendorRepo;
        this.indentRepo = indentRepo;
        this.materialRepo = materialRepo;
    }

    @Transactional
    public PurchaseOrderDto create(CreatePORequest req, String createdBy) {
        PurchaseOrder entity = new PurchaseOrder();
        entity.setPoNumber(generateNumber());
        entity.setProject(projectRepo.findById(req.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found: " + req.getProjectId())));
        entity.setVendor(vendorRepo.findById(req.getVendorId())
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + req.getVendorId())));
        entity.setPoDate(req.getPoDate());
        entity.setDeliveryDate(req.getDeliveryDate());
        entity.setReferenceType(req.getReferenceType());
        if ("FROM_INDENT".equals(req.getReferenceType()) && req.getIndentId() != null) {
            entity.setIndent(indentRepo.findById(req.getIndentId())
                    .orElseThrow(() -> new RuntimeException("Indent not found: " + req.getIndentId())));
        }
        entity.setAdvancePercent(req.getAdvancePercent());
        entity.setBillingTerms(req.getBillingTerms());
        entity.setPackingForwarding(req.getPackingForwarding());
        entity.setPaymentTerms(req.getPaymentTerms());
        entity.setRemarks(req.getRemarks());
        entity.setCreatedBy(createdBy);

        BigDecimal totalAmount = BigDecimal.ZERO;
        if (req.getItems() != null) {
            for (var itemReq : req.getItems()) {
                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setPurchaseOrder(entity);
                item.setMaterial(materialRepo.findById(itemReq.getMaterialId())
                        .orElseThrow(() -> new RuntimeException("Material not found: " + itemReq.getMaterialId())));
                item.setDescription(itemReq.getDescription());
                item.setUom(itemReq.getUom());
                item.setPoQty(itemReq.getPoQty());
                item.setPoRate(itemReq.getPoRate());
                BigDecimal amount = itemReq.getPoQty().multiply(itemReq.getPoRate());
                item.setAmount(amount);
                totalAmount = totalAmount.add(amount);
                entity.getItems().add(item);
            }
        }
        entity.setTotalAmount(totalAmount);
        entity.setGrandTotal(totalAmount.add(entity.getTaxAmount()));

        return PurchaseOrderDto.fromEntity(repo.save(entity));
    }

    public List<PurchaseOrderDto> getAll() {
        return repo.findAllByOrderByCreatedAtDesc().stream()
                .map(PurchaseOrderDto::fromEntity).collect(Collectors.toList());
    }

    public PurchaseOrderDto getById(Long id) {
        return repo.findById(id).map(PurchaseOrderDto::fromEntity)
                .orElseThrow(() -> new RuntimeException("PurchaseOrder not found: " + id));
    }

    public List<PurchaseOrderDto> getByProject(Long projectId) {
        return repo.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(PurchaseOrderDto::fromEntity).collect(Collectors.toList());
    }

    public List<PurchaseOrderDto> getByVendor(Long vendorId) {
        return repo.findByVendorIdOrderByCreatedAtDesc(vendorId).stream()
                .map(PurchaseOrderDto::fromEntity).collect(Collectors.toList());
    }

    public List<PurchaseOrderDto> getByStatus(String status) {
        return repo.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(PurchaseOrderDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public PurchaseOrderDto updateStatus(Long id, String status) {
        PurchaseOrder entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("PurchaseOrder not found: " + id));
        entity.setStatus(status);
        return PurchaseOrderDto.fromEntity(repo.save(entity));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }

    public Map<String, Object> getPrintData(Long id) {
        PurchaseOrder entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("PurchaseOrder not found: " + id));
        PurchaseOrderDto dto = PurchaseOrderDto.fromEntity(entity);

        Map<String, Object> result = new LinkedHashMap<>();

        // PO Details
        Map<String, Object> poDetails = new LinkedHashMap<>();
        poDetails.put("poNumber", dto.getPoNumber());
        poDetails.put("poDate", dto.getPoDate());
        poDetails.put("deliveryDate", dto.getDeliveryDate());
        poDetails.put("status", dto.getStatus());
        poDetails.put("projectName", dto.getProjectName());
        poDetails.put("referenceType", dto.getReferenceType());
        poDetails.put("indentNo", dto.getIndentNo());
        poDetails.put("totalAmount", dto.getTotalAmount());
        poDetails.put("taxAmount", dto.getTaxAmount());
        poDetails.put("grandTotal", dto.getGrandTotal());
        poDetails.put("advancePercent", dto.getAdvancePercent());
        poDetails.put("createdBy", dto.getCreatedBy());
        result.put("poDetails", poDetails);

        // Vendor Details
        Map<String, Object> vendorDetails = new LinkedHashMap<>();
        if (entity.getVendor() != null) {
            vendorDetails.put("id", entity.getVendor().getId());
            vendorDetails.put("name", entity.getVendor().getName());
            vendorDetails.put("address", entity.getVendor().getAddress());
            vendorDetails.put("phone", entity.getVendor().getPhone());
            vendorDetails.put("email", entity.getVendor().getEmail());
            vendorDetails.put("gstNo", entity.getVendor().getGstNo());
            vendorDetails.put("pan", entity.getVendor().getPan());
            vendorDetails.put("contactPerson", entity.getVendor().getContactPerson());
        }
        result.put("vendorDetails", vendorDetails);

        // Items List
        result.put("items", dto.getItems());

        // Terms
        Map<String, Object> terms = new LinkedHashMap<>();
        terms.put("billingTerms", dto.getBillingTerms());
        terms.put("paymentTerms", dto.getPaymentTerms());
        terms.put("packingForwarding", entity.getPackingForwarding());
        terms.put("remarks", dto.getRemarks());
        result.put("terms", terms);

        return result;
    }

    private String generateNumber() {
        String max = repo.findMaxPoNumber().orElse("PO-000");
        int num = Integer.parseInt(max.replace("PO-", "")) + 1;
        return String.format("PO-%03d", num);
    }
}
