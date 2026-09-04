package com.arcadia.premium.service;

import com.arcadia.premium.dto.MastriLeaderDto;
import com.arcadia.premium.model.MastriLeader;
import com.arcadia.premium.repository.MastriLeaderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MastriLeaderService {

    private final MastriLeaderRepository repo;

    public MastriLeaderService(MastriLeaderRepository repo) {
        this.repo = repo;
    }

    public List<MastriLeaderDto> getAll() {
        return repo.findAllByOrderByNameAsc().stream()
                .map(MastriLeaderDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<MastriLeaderDto> getActive() {
        return repo.findByActiveTrueOrderByNameAsc().stream()
                .map(MastriLeaderDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public MastriLeaderDto create(MastriLeaderDto dto) {
        MastriLeader leader = new MastriLeader();
        leader.setName(dto.getName());
        leader.setPhone(dto.getPhone());
        leader.setActive(true);
        return MastriLeaderDto.fromEntity(repo.save(leader));
    }

    @Transactional
    public MastriLeaderDto update(Long id, MastriLeaderDto dto) {
        MastriLeader leader = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MastriLeader not found: " + id));
        leader.setName(dto.getName());
        leader.setPhone(dto.getPhone());
        leader.setActive(dto.isActive());
        return MastriLeaderDto.fromEntity(repo.save(leader));
    }

    @Transactional
    public void delete(Long id) {
        MastriLeader leader = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("MastriLeader not found: " + id));
        leader.setActive(false);
        repo.save(leader);
    }
}
