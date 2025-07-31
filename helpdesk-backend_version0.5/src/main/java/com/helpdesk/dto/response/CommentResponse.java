package com.helpdesk.dto.response;

import com.helpdesk.enums.CommentType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Long id;
    private String content;
    private CommentType type;
    private UserResponse author;
    private LocalDateTime createdAt;
}
