package com.arcadia.premium.service;

import com.arcadia.premium.dto.PersonalDocumentDto;
import com.arcadia.premium.model.PersonalDocument;
import com.arcadia.premium.repository.PersonalDocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PersonalDocumentService {

    private final PersonalDocumentRepository repository;

    public PersonalDocumentService(PersonalDocumentRepository repository) {
        this.repository = repository;
    }

    public PersonalDocumentDto upload(String category, String description, MultipartFile file, String uploadedBy) throws IOException {
        PersonalDocument doc = new PersonalDocument();
        doc.setCategory(category != null && !category.isEmpty() ? category : "General");
        doc.setFileName(file.getOriginalFilename());
        doc.setOriginalFileName(file.getOriginalFilename());
        doc.setContentType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setFileData(file.getBytes());
        doc.setUploadedBy(uploadedBy);
        doc.setDescription(description);
        return PersonalDocumentDto.fromEntity(repository.save(doc));
    }

    public List<PersonalDocumentDto> listForUser(String email) {
        return repository.findByUploadedByOrderByCreatedAtDesc(email)
                .stream().map(PersonalDocumentDto::fromEntity).collect(Collectors.toList());
    }

    public List<PersonalDocumentDto> listAll() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream().map(PersonalDocumentDto::fromEntity).collect(Collectors.toList());
    }

    public List<PersonalDocumentDto> listByCategory(String category, String email, boolean isAdmin) {
        if (isAdmin) {
            return repository.findByCategoryOrderByCreatedAtDesc(category)
                    .stream().map(PersonalDocumentDto::fromEntity).collect(Collectors.toList());
        }
        return repository.findByCategoryAndUploadedByOrderByCreatedAtDesc(category, email)
                .stream().map(PersonalDocumentDto::fromEntity).collect(Collectors.toList());
    }

    public PersonalDocument getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Personal document not found with id: " + id));
    }

    public void delete(Long id, String email, boolean isAdmin) {
        PersonalDocument doc = getById(id);
        if (!isAdmin && !doc.getUploadedBy().equals(email)) {
            throw new RuntimeException("You can only delete your own documents.");
        }
        repository.delete(doc);
    }
}
