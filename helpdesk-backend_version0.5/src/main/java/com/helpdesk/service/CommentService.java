package com.helpdesk.service;

import com.helpdesk.dto.request.CommentCreateRequest;
import com.helpdesk.dto.response.CommentResponse;

import java.util.List;

public interface CommentService {
    CommentResponse createComment(CommentCreateRequest request, Long authorId);
    List<CommentResponse> getCommentsByTicket(Long ticketId);
    CommentResponse updateComment(Long commentId, String content, Long authorId);
    void deleteComment(Long commentId, Long authorId);
}
