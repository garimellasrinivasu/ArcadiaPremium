package com.arcadia.premium.service;

import com.arcadia.premium.dto.VillaBlockingDto;
import com.arcadia.premium.model.VillaBlocking;
import com.arcadia.premium.repository.VillaBlockingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VillaBlockingService {

    private static final Logger log = LoggerFactory.getLogger(VillaBlockingService.class);

    private final VillaBlockingRepository villaBlockingRepo;

    public VillaBlockingService(VillaBlockingRepository villaBlockingRepo) {
        this.villaBlockingRepo = villaBlockingRepo;
    }

    public List<VillaBlockingDto> getAll() {
        return villaBlockingRepo.findAll().stream()
                .map(VillaBlockingDto::fromEntity).collect(Collectors.toList());
    }

    public List<VillaBlockingDto> getByProject(String projectName) {
        // Strict exact-match only — each project maintains its own independent blocking list
        List<VillaBlocking> results = villaBlockingRepo.findByProjectName(projectName);
        return results.stream().map(VillaBlockingDto::fromEntity).collect(Collectors.toList());
    }

    public Optional<VillaBlockingDto> getByVillaNumber(Integer villaNumber) {
        return villaBlockingRepo.findByVillaNumber(villaNumber)
                .map(VillaBlockingDto::fromEntity);
    }

    /** Find a blocked villa by strict exact project + villa number match */
    private Optional<VillaBlocking> findVilla(String projectName, Integer villaNumber) {
        return villaBlockingRepo.findByProjectNameAndVillaNumber(projectName, villaNumber);
    }

    /** Check if a villa is blocked under project (strict exact match) */
    private boolean villaExists(String projectName, Integer villaNumber) {
        return villaBlockingRepo.existsByProjectNameAndVillaNumber(projectName, villaNumber);
    }

    @Transactional
    public VillaBlockingDto blockVilla(VillaBlockingDto dto) {
        String project = dto.getProjectName() != null ? dto.getProjectName() : "Arcadia";
        if (villaExists(project, dto.getVillaNumber())) {
            throw new RuntimeException("Villa " + dto.getVillaNumber() + " is already blocked in " + project);
        }
        VillaBlocking v = new VillaBlocking();
        v.setProjectName(project);
        v.setVillaNumber(dto.getVillaNumber());
        v.setCustomerName(dto.getCustomerName());
        v.setCustomerPhone(dto.getCustomerPhone());
        v.setCustomerEmail(dto.getCustomerEmail());
        v.setBookingAmount(dto.getBookingAmount());
        v.setNotes(dto.getNotes());
        v.setBlockedBy(dto.getBlockedBy());
        v.setBlockedAt(LocalDateTime.now());
        v = villaBlockingRepo.save(v);
        log.info("Blocked villa {} in project {} by {} (id={})", v.getVillaNumber(), project, v.getBlockedBy(), v.getId());
        return VillaBlockingDto.fromEntity(v);
    }

    @Transactional
    public VillaBlockingDto updateBlockedVilla(String projectName, Integer villaNumber, VillaBlockingDto dto) {
        VillaBlocking v = findVilla(projectName, villaNumber)
                .orElseThrow(() -> new RuntimeException("Villa " + villaNumber + " is not blocked in " + projectName));
        v.setCustomerName(dto.getCustomerName());
        v.setCustomerPhone(dto.getCustomerPhone());
        v.setCustomerEmail(dto.getCustomerEmail());
        v.setBookingAmount(dto.getBookingAmount());
        v.setNotes(dto.getNotes());
        v = villaBlockingRepo.save(v);
        log.info("Updated blocked villa {} in project {} (id={})", villaNumber, projectName, v.getId());
        return VillaBlockingDto.fromEntity(v);
    }

    @Transactional
    public void unblockVilla(String projectName, Integer villaNumber) {
        VillaBlocking v = findVilla(projectName, villaNumber)
                .orElseThrow(() -> new RuntimeException("Villa " + villaNumber + " is not blocked in " + projectName));
        villaBlockingRepo.delete(v);
        log.info("Unblocked villa {} in project {} (id={})", villaNumber, projectName, v.getId());
    }
}
