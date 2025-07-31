package com.helpdesk.service;

import org.springframework.web.multipart.MultipartFile;

public interface CloudinaryService {
    String uploadImage(MultipartFile file);
    String uploadFile(MultipartFile file);
    void deleteFile(String publicId);
}
