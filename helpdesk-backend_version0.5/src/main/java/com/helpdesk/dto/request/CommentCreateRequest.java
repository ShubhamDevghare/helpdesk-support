package com.helpdesk.dto.request;

import com.helpdesk.enums.CommentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommentCreateRequest {
    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Comment type is required")
    private CommentType type;

    @NotNull(message = "Ticket ID is required")
    private Long ticketId;
}
