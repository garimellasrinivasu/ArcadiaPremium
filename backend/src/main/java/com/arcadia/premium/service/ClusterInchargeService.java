package com.arcadia.premium.service;

import com.arcadia.premium.dto.ClusterInchargeDto;
import com.arcadia.premium.model.ClusterIncharge;
import com.arcadia.premium.repository.ClusterInchargeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClusterInchargeService {

    private final ClusterInchargeRepository repo;

    public ClusterInchargeService(ClusterInchargeRepository repo) {
        this.repo = repo;
    }

    public List<ClusterInchargeDto> getAll() {
        return repo.findAllByOrderByClusterNumberAsc().stream()
                .map(ClusterInchargeDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ClusterInchargeDto> getActive() {
        return repo.findByActiveTrueOrderByClusterNumberAsc().stream()
                .map(ClusterInchargeDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClusterInchargeDto create(ClusterInchargeDto dto) {
        ClusterIncharge ci = new ClusterIncharge();
        ci.setClusterNumber(dto.getClusterNumber());
        ci.setInchargeName(dto.getInchargeName());
        ci.setVillaNumbers(dto.getVillaNumbers());
        ci.setActive(true);
        return ClusterInchargeDto.fromEntity(repo.save(ci));
    }

    @Transactional
    public ClusterInchargeDto update(Long id, ClusterInchargeDto dto) {
        ClusterIncharge ci = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("ClusterIncharge not found: " + id));
        ci.setClusterNumber(dto.getClusterNumber());
        ci.setInchargeName(dto.getInchargeName());
        ci.setVillaNumbers(dto.getVillaNumbers());
        ci.setActive(dto.isActive());
        return ClusterInchargeDto.fromEntity(repo.save(ci));
    }

    @Transactional
    public void delete(Long id) {
        ClusterIncharge ci = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("ClusterIncharge not found: " + id));
        repo.delete(ci);
    }
}
