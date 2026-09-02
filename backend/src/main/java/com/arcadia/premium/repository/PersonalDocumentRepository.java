package com.arcadia.premium.repository;

import com.arcadia.premium.model.PersonalDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonalDocumentRepository extends JpaRepository<PersonalDocument, Long> {

    List<PersonalDocument> findByUploadedByOrderByCreatedAtDesc(String email);

    List<PersonalDocument> findAllByOrderByCreatedAtDesc();

    List<PersonalDocument> findByCategoryAndUploadedByOrderByCreatedAtDesc(String category, String email);

    List<PersonalDocument> findByCategoryOrderByCreatedAtDesc(String category);
}
