package com.arcadia.premium.service;

import com.arcadia.premium.dto.ActivityMasterDto;
import com.arcadia.premium.model.ActivityGroup;
import com.arcadia.premium.model.ActivityMaster;
import com.arcadia.premium.model.ActivitySubGroup;
import com.arcadia.premium.repository.ActivityGroupRepository;
import com.arcadia.premium.repository.ActivityMasterRepository;
import com.arcadia.premium.repository.ActivitySubGroupRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityMasterService {

    private final ActivityMasterRepository repository;
    private final ActivityGroupRepository activityGroupRepository;
    private final ActivitySubGroupRepository activitySubGroupRepository;

    public ActivityMasterService(ActivityMasterRepository repository,
                                 ActivityGroupRepository activityGroupRepository,
                                 ActivitySubGroupRepository activitySubGroupRepository) {
        this.repository = repository;
        this.activityGroupRepository = activityGroupRepository;
        this.activitySubGroupRepository = activitySubGroupRepository;
    }

    public ActivityMasterDto create(String name, String description, Long activityGroupId,
                                    Long activitySubGroupId, String uom, String sacCode) {
        ActivityGroup group = activityGroupRepository.findById(activityGroupId)
                .orElseThrow(() -> new RuntimeException("Activity Group not found with id: " + activityGroupId));

        ActivitySubGroup subGroup = null;
        if (activitySubGroupId != null) {
            subGroup = activitySubGroupRepository.findById(activitySubGroupId)
                    .orElseThrow(() -> new RuntimeException("Activity Sub Group not found with id: " + activitySubGroupId));
        }

        ActivityMaster e = new ActivityMaster();
        e.setName(name);
        e.setDescription(description);
        e.setActivityGroup(group);
        e.setActivitySubGroup(subGroup);
        e.setUom(uom);
        e.setSacCode(sacCode);
        return ActivityMasterDto.fromEntity(repository.save(e));
    }

    public List<ActivityMasterDto> getAll() {
        return repository.findAllByOrderByNameAsc()
                .stream().map(ActivityMasterDto::fromEntity).collect(Collectors.toList());
    }

    public List<ActivityMasterDto> getActive() {
        return repository.findByActiveTrueOrderByNameAsc()
                .stream().map(ActivityMasterDto::fromEntity).collect(Collectors.toList());
    }

    public List<ActivityMasterDto> getByGroupId(Long groupId) {
        return repository.findByActivityGroupIdOrderByNameAsc(groupId)
                .stream().map(ActivityMasterDto::fromEntity).collect(Collectors.toList());
    }

    public List<ActivityMasterDto> getBySubGroupId(Long subGroupId) {
        return repository.findByActivitySubGroupIdOrderByNameAsc(subGroupId)
                .stream().map(ActivityMasterDto::fromEntity).collect(Collectors.toList());
    }

    public ActivityMasterDto getById(Long id) {
        ActivityMaster e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity Master not found with id: " + id));
        return ActivityMasterDto.fromEntity(e);
    }

    public ActivityMasterDto update(Long id, String name, String description, Long activityGroupId,
                                    Long activitySubGroupId, String uom, String sacCode) {
        ActivityMaster e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity Master not found with id: " + id));

        ActivityGroup group = activityGroupRepository.findById(activityGroupId)
                .orElseThrow(() -> new RuntimeException("Activity Group not found with id: " + activityGroupId));

        ActivitySubGroup subGroup = null;
        if (activitySubGroupId != null) {
            subGroup = activitySubGroupRepository.findById(activitySubGroupId)
                    .orElseThrow(() -> new RuntimeException("Activity Sub Group not found with id: " + activitySubGroupId));
        }

        e.setName(name);
        e.setDescription(description);
        e.setActivityGroup(group);
        e.setActivitySubGroup(subGroup);
        e.setUom(uom);
        e.setSacCode(sacCode);
        return ActivityMasterDto.fromEntity(repository.save(e));
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
