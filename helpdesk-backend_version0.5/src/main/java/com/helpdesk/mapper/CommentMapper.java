package com.helpdesk.mapper;

import com.helpdesk.dto.response.CommentResponse;
import com.helpdesk.entity.Comment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CommentMapper {

    private final UserMapper userMapper;

    public CommentResponse toResponse(Comment comment) {
        if (comment == null) return null;

        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setContent(comment.getContent());
        response.setType(comment.getType());
        response.setAuthor(userMapper.toResponse(comment.getAuthor()));
        response.setCreatedAt(comment.getCreatedAt());
        return response;
    }
}
