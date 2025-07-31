package com.helpdesk.service.impl;

import com.helpdesk.dto.request.CommentCreateRequest;
import com.helpdesk.dto.response.CommentResponse;
import com.helpdesk.entity.Comment;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.User;
import com.helpdesk.exception.ResourceNotFoundException;
import com.helpdesk.exception.BadRequestException;
import com.helpdesk.mapper.CommentMapper;
import com.helpdesk.repository.CommentRepository;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.repository.UserRepository;
import com.helpdesk.service.CommentService;
import com.helpdesk.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;
    private final EmailService emailService;

    @Override
    @Transactional
    public CommentResponse createComment(CommentCreateRequest request, Long authorId) {
        Ticket ticket = ticketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = new Comment();
        comment.setContent(request.getContent());
        comment.setType(request.getType());
        comment.setTicket(ticket);
        comment.setAuthor(author);

        Comment savedComment = commentRepository.save(comment);

        // Send email notification if it's an agent response
        if (request.getType().name().contains("AGENT") || request.getType().name().contains("RESPONSE")) {
            emailService.sendAgentResponseEmail(
                ticket.getCustomer().getEmail(), 
                ticket.getTicketId(), 
                request.getContent()
            );
        }

        log.info("Comment created for ticket: {}", ticket.getTicketId());
        return commentMapper.toResponse(savedComment);
    }

    @Override
    public List<CommentResponse> getCommentsByTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        
        return commentRepository.findByTicketOrderByCreatedAtAsc(ticket).stream()
                .map(commentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long commentId, String content, Long authorId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        if (!comment.getAuthor().getId().equals(authorId)) {
            throw new BadRequestException("You can only update your own comments");
        }

        comment.setContent(content);
        Comment updatedComment = commentRepository.save(comment);
        
        return commentMapper.toResponse(updatedComment);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long authorId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        
        if (!comment.getAuthor().getId().equals(authorId)) {
            throw new BadRequestException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
        log.info("Comment deleted: {}", commentId);
    }
}
