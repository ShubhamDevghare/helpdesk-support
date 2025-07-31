package com.helpdesk.mapper;

import com.helpdesk.dto.response.AttachmentResponse;
import com.helpdesk.entity.Attachment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AttachmentMapper {

    private final UserMapper userMapper;

    public AttachmentResponse toResponse(Attachment attachment) {
        if (attachment == null) return null;

        AttachmentResponse response = new AttachmentResponse();
        response.setId(attachment.getId());
        response.setFileName(attachment.getFileName());
        response.setFileUrl(attachment.getFileUrl());
        response.setFileType(attachment.getFileType());
        response.setFileSize(attachment.getFileSize());
        response.setUploadedBy(userMapper.toResponse(attachment.getUploadedBy()));
        response.setUploadedAt(attachment.getUploadedAt());
        return response;
    }
}
