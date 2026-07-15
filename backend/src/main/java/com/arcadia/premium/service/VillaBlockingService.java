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

    public Optional<VillaBlockingDto> getByVillaNumber(Integer villaNumber) {
        return villaBlockingRepo.findByVillaNumber(villaNumber)
                .map(VillaBlockingDto::fromEntity);
    }

    @Transactional
    public VillaBlockingDto blockVilla(VillaBlockingDto dto) {
        if (villaBlockingRepo.existsByVillaNumber(dto.getVillaNumber())) {
            throw new RuntimeException("Villa " + dto.getVillaNumber() + " is already blocked");
        }
        VillaBlocking v = new VillaBlocking();
        v.setVillaNumber(dto.getVillaNumber());
        v.setCustomerName(dto.getCustomerName());
        v.setCustomerPhone(dto.getCustomerPhone());
        v.setCustomerEmail(dto.getCustomerEmail());
        v.setBookingAmount(dto.getBookingAmount());
        v.setNotes(dto.getNotes());
        v.setBlockedBy(dto.getBlockedBy());
        v.setBlockedAt(LocalDateTime.now());
        v = villaBlockingRepo.save(v);
        log.info("Blocked villa {} by {} (id={})", v.getVillaNumber(), v.getBlockedBy(), v.getId());
        return VillaBlockingDto.fromEntity(v);
    }

    @Transactional
    public VillaBlockingDto updateBlockedVilla(Integer villaNumber, VillaBlockingDto dto) {
        VillaBlocking v = villaBlockingRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new RuntimeException("Villa " + villaNumber + " is not blocked"));
        v.setCustomerName(dto.getCustomerName());
        v.setCustomerPhone(dto.getCustomerPhone());
        v.setCustomerEmail(dto.getCustomerEmail());
        v.setBookingAmount(dto.getBookingAmount());
        v.setNotes(dto.getNotes());
        v = villaBlockingRepo.save(v);
        log.info("Updated blocked villa {} details (id={})", villaNumber, v.getId());
        return VillaBlockingDto.fromEntity(v);
    }

    @Transactional
    public void unblockVilla(Integer villaNumber) {
        VillaBlocking v = villaBlockingRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new RuntimeException("Villa " + villaNumber + " is not blocked"));
        villaBlockingRepo.delete(v);
        log.info("Unblocked villa {} (id={})", villaNumber, v.getId());
    }
}
