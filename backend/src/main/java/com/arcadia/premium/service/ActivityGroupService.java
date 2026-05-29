package com.arcadia.premium.service;

import com.arcadia.premium.dto.ActivityGroupDto;
import com.arcadia.premium.model.ActivityGroup;
import com.arcadia.premium.repository.ActivityGroupRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityGroupService {

    private final ActivityGroupRepository repository;

    public ActivityGroupService(ActivityGroupRepository repository) {
        this.repository = repository;
    }

    public ActivityGroupDto create(String name, String description) {
        ActivityGroup e = new ActivityGroup();
        e.setName(name);
        e.setDescription(description);
        return ActivityGroupDto.fromEntity(repository.save(e));
    }

    public List<ActivityGroupDto> getAll() {
        return repository.findAllByOrderByNameAsc()
                .stream().map(ActivityGroupDto::fromEntity).collect(Collectors.toList());
    }

    public List<ActivityGroupDto> getActive() {
        return repository.findByActiveTrueOrderByNameAsc()
                .stream().map(ActivityGroupDto::fromEntity).collect(Collectors.toList());
    }

    public ActivityGroupDto getById(Long id) {
        ActivityGroup e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity Group not found with id: " + id));
        return ActivityGroupDto.fromEntity(e);
    }

    public ActivityGroupDto update(Long id, String name, String description) {
        ActivityGroup e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity Group not found with id: " + id));
        e.setName(name);
        e.setDescription(description);
        return ActivityGroupDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public ActivityGroupDto toggleActive(Long id) {
        ActivityGroup e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity Group not found with id: " + id));
        e.setActive(!e.isActive());
        return ActivityGroupDto.fromEntity(repository.save(e));
    }
}
