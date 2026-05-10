package com.arcadia.premium.service;

import com.arcadia.premium.dto.EstimationRowDTO;
import com.arcadia.premium.dto.EstimationTabDTO;
import com.arcadia.premium.model.EstimationRow;
import com.arcadia.premium.model.EstimationTab;
import com.arcadia.premium.model.Project;
import com.arcadia.premium.repository.EstimationRowRepository;
import com.arcadia.premium.repository.EstimationTabRepository;
import com.arcadia.premium.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EstimationService {

    private final EstimationTabRepository tabRepo;
    private final EstimationRowRepository rowRepo;
    private final ProjectRepository projectRepo;

    public EstimationService(EstimationTabRepository tabRepo,
                             EstimationRowRepository rowRepo,
                             ProjectRepository projectRepo) {
        this.tabRepo = tabRepo;
        this.rowRepo = rowRepo;
        this.projectRepo = projectRepo;
    }

    // ───── TAB OPERATIONS ─────

    public List<EstimationTabDTO> getTabsByProject(Long projectId) {
        return tabRepo.findByProjectIdOrderBySortOrderAsc(projectId)
                .stream().map(this::toTabDTO).collect(Collectors.toList());
    }

    public EstimationTabDTO getTab(Long tabId) {
        EstimationTab tab = tabRepo.findById(tabId)
                .orElseThrow(() -> new RuntimeException("Tab not found: " + tabId));
        return toTabDTO(tab);
    }

    @Transactional
    public EstimationTabDTO createTab(EstimationTabDTO dto) {
        Project project = projectRepo.findById(dto.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project not found: " + dto.getProjectId()));
        EstimationTab tab = new EstimationTab();
        tab.setProject(project);
        tab.setName(dto.getName());
        tab.setSubtitle(dto.getSubtitle());
        tab.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 99);
        tab.setTabType(dto.getTabType() != null ? dto.getTabType() : "DATA_TABLE");
        tab.setColumnsJson(dto.getColumnsJson());
        tab.setMetadataJson(dto.getMetadataJson());
        tab = tabRepo.save(tab);

        // Save rows if provided
        if (dto.getRows() != null) {
            for (EstimationRowDTO rowDto : dto.getRows()) {
                EstimationRow row = new EstimationRow();
                row.setTab(tab);
                row.setSortOrder(rowDto.getSortOrder() != null ? rowDto.getSortOrder() : 0);
                row.setRowType(rowDto.getRowType() != null ? rowDto.getRowType() : "DATA");
                row.setCellsJson(rowDto.getCellsJson());
                row.setSectionGroup(rowDto.getSectionGroup());
                rowRepo.save(row);
            }
        }
        return getTab(tab.getId());
    }

    @Transactional
    public EstimationTabDTO updateTab(Long tabId, EstimationTabDTO dto) {
        EstimationTab tab = tabRepo.findById(tabId)
                .orElseThrow(() -> new RuntimeException("Tab not found: " + tabId));
        if (dto.getName() != null) tab.setName(dto.getName());
        if (dto.getSubtitle() != null) tab.setSubtitle(dto.getSubtitle());
        if (dto.getSortOrder() != null) tab.setSortOrder(dto.getSortOrder());
        if (dto.getTabType() != null) tab.setTabType(dto.getTabType());
        if (dto.getColumnsJson() != null) tab.setColumnsJson(dto.getColumnsJson());
        if (dto.getMetadataJson() != null) tab.setMetadataJson(dto.getMetadataJson());
        tabRepo.save(tab);
        return toTabDTO(tab);
    }

    @Transactional
    public void deleteTab(Long tabId) {
        tabRepo.deleteById(tabId);
    }

    // ───── ROW OPERATIONS ─────

    public EstimationRowDTO getRow(Long rowId) {
        EstimationRow row = rowRepo.findById(rowId)
                .orElseThrow(() -> new RuntimeException("Row not found: " + rowId));
        return toRowDTO(row);
    }

    @Transactional
    public EstimationRowDTO createRow(EstimationRowDTO dto) {
        EstimationTab tab = tabRepo.findById(dto.getTabId())
                .orElseThrow(() -> new RuntimeException("Tab not found: " + dto.getTabId()));
        EstimationRow row = new EstimationRow();
        row.setTab(tab);
        row.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0);
        row.setRowType(dto.getRowType() != null ? dto.getRowType() : "DATA");
        row.setCellsJson(dto.getCellsJson());
        row.setSectionGroup(dto.getSectionGroup());
        return toRowDTO(rowRepo.save(row));
    }

    @Transactional
    public EstimationRowDTO updateRow(Long rowId, EstimationRowDTO dto) {
        EstimationRow row = rowRepo.findById(rowId)
                .orElseThrow(() -> new RuntimeException("Row not found: " + rowId));
        if (dto.getSortOrder() != null) row.setSortOrder(dto.getSortOrder());
        if (dto.getRowType() != null) row.setRowType(dto.getRowType());
        if (dto.getCellsJson() != null) row.setCellsJson(dto.getCellsJson());
        if (dto.getSectionGroup() != null) row.setSectionGroup(dto.getSectionGroup());
        return toRowDTO(rowRepo.save(row));
    }

    @Transactional
    public void deleteRow(Long rowId) {
        rowRepo.deleteById(rowId);
    }

    /** Bulk save/update all rows for a tab (full replacement) */
    @Transactional
    public EstimationTabDTO bulkSaveRows(Long tabId, List<EstimationRowDTO> rowDtos) {
        EstimationTab tab = tabRepo.findById(tabId)
                .orElseThrow(() -> new RuntimeException("Tab not found: " + tabId));

        // Remove existing rows
        tab.getRows().clear();
        tabRepo.saveAndFlush(tab);

        // Add new rows
        int order = 0;
        for (EstimationRowDTO dto : rowDtos) {
            EstimationRow row = new EstimationRow();
            row.setTab(tab);
            row.setSortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : order++);
            row.setRowType(dto.getRowType() != null ? dto.getRowType() : "DATA");
            row.setCellsJson(dto.getCellsJson());
            row.setSectionGroup(dto.getSectionGroup());
            tab.getRows().add(row);
        }
        tabRepo.save(tab);
        return getTab(tabId);
    }

    // ───── MAPPERS ─────

    private EstimationTabDTO toTabDTO(EstimationTab tab) {
        EstimationTabDTO dto = new EstimationTabDTO();
        dto.setId(tab.getId());
        dto.setProjectId(tab.getProject().getId());
        dto.setName(tab.getName());
        dto.setSubtitle(tab.getSubtitle());
        dto.setSortOrder(tab.getSortOrder());
        dto.setTabType(tab.getTabType());
        dto.setColumnsJson(tab.getColumnsJson());
        dto.setMetadataJson(tab.getMetadataJson());
        dto.setRows(tab.getRows().stream().map(this::toRowDTO).collect(Collectors.toList()));
        return dto;
    }

    private EstimationRowDTO toRowDTO(EstimationRow row) {
        EstimationRowDTO dto = new EstimationRowDTO();
        dto.setId(row.getId());
        dto.setTabId(row.getTab().getId());
        dto.setSortOrder(row.getSortOrder());
        dto.setRowType(row.getRowType());
        dto.setCellsJson(row.getCellsJson());
        dto.setSectionGroup(row.getSectionGroup());
        return dto;
    }
}
