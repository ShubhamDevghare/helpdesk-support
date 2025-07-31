package com.helpdesk.repository;

import com.helpdesk.entity.Comment;
import com.helpdesk.entity.Ticket;
import com.helpdesk.enums.CommentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTicket(Ticket ticket);
    List<Comment> findByTicketAndType(Ticket ticket, CommentType type);
    List<Comment> findByTicketOrderByCreatedAtAsc(Ticket ticket);
}
