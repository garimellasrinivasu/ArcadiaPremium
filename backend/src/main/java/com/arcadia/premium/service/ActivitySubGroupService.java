package com.arcadia.premium.service;

import com.arcadia.premium.dto.ActivitySubGroupDto;
import com.arcadia.premium.model.ActivityGroup;
import com.arcadia.premium.model.ActivitySubGroup;
import com.arcadia.premium.repository.ActivityGroupRepository;
import com.arcadia.premium.repository.ActivitySubGroupRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivitySubGroupService {

    private final ActivitySubGroupRepository repository;
    private final ActivityGroupRepository activityGroupRepository;

    public ActivitySubGroupService(ActivitySubGroupRepository repository,
                                   ActivityGroupRepository activityGroupRepository) {
        this.repository = repository;
        this.activityGroupRepository = activityGroupRepository;
    }

    public ActivitySubGroupDto create(String name, String description, Long activityGroupId) {
        ActivityGroup group = activityGroupRepository.findById(activityGroupId)
                .orElseThrow(() -> new RuntimeException("Activity Group not found with id: " + activityGroupId));
        ActivitySubGroup e = new ActivitySubGroup();
        e.setName(name);
        e.setDescription(description);
        e.setActivityGroup(group);
        return ActivitySubGroupDto.fromEntity(repository.save(e));
    }

    public List<ActivitySubGroupDto> getAll() {
        return repository.findAllByOrderByNameAsc()
                .stream().map(ActivitySubGroupDto::fromEntity).collect(Collectors.toList());
    }

    public List<ActivitySubGroupDto> getByGroupId(Long groupId) {
        return repository.findByActivityGroupIdOrderByNameAsc(groupId)
                .stream().map(ActivitySubGroupDto::fromEntity).collect(Collectors.toList());
    }

    public ActivitySubGroupDto getById(Long id) {
        ActivitySubGroup e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity Sub Group not found with id: " + id));
        return ActivitySubGroupDto.fromEntity(e);
    }

    public ActivitySubGroupDto update(Long id, String name, String description, Long activityGroupId) {
        ActivitySubGroup e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity Sub Group not found with id: " + id));
        ActivityGroup group = activityGroupRepository.findById(activityGroupId)
                .orElseThrow(() -> new RuntimeException("Activity Group not found with id: " + activityGroupId));
        e.setName(name);
        e.setDescription(description);
        e.setActivityGroup(group);
        return ActivitySubGroupDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
