package com.helpdesk.controller;

import com.helpdesk.dto.request.CommentCreateRequest;
import com.helpdesk.dto.response.CommentResponse;
import com.helpdesk.security.UserPrincipal;
import com.helpdesk.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CommentCreateRequest request) {
        CommentResponse comment = commentService.createComment(request, currentUser.getId());
        return ResponseEntity.ok(comment);
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<CommentResponse>> getCommentsByTicket(@PathVariable Long ticketId) {
        List<CommentResponse> comments = commentService.getCommentsByTicket(ticketId);
        return ResponseEntity.ok(comments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long id,
            @RequestBody String content,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CommentResponse comment = commentService.updateComment(id, content, currentUser.getId());
        return ResponseEntity.ok(comment);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteComment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        commentService.deleteComment(id, currentUser.getId());
        return ResponseEntity.ok("Comment deleted successfully");
    }
}
