package com.arcadia.premium.repository;

import com.arcadia.premium.model.NotificationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationConfigRepository extends JpaRepository<NotificationConfig, Long> {
    List<NotificationConfig> findByProjectName(String projectName);
    List<NotificationConfig> findByProjectNameAndConfigType(String projectName, String configType);
    List<NotificationConfig> findByProjectNameAndConfigTypeAndActive(String projectName, String configType, boolean active);
    List<NotificationConfig> findByConfigTypeAndActive(String configType, boolean active);
}
