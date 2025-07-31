package com.helpdesk.repository;

import com.helpdesk.entity.Agent;
import com.helpdesk.entity.Customer;
import com.helpdesk.entity.Ticket;
import com.helpdesk.entity.User;
import com.helpdesk.enums.Priority;
import com.helpdesk.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    
    Optional<Ticket> findByTicketId(String ticketId);
    List<Ticket> findByStatus(TicketStatus status);
    Page<Ticket> findByCustomer(Customer customer, Pageable pageable);
    Page<Ticket> findByAssignedAgent(Agent agent, Pageable pageable);
    Page<Ticket> findByAssignedAgentAndStatus(Agent agent, TicketStatus status, Pageable pageable);
    Page<Ticket> findByAssignedAgentAndPriority(Agent agent, Priority priority, Pageable pageable);
    Page<Ticket> findByCustomerAndStatus(Customer customer, TicketStatus status, Pageable pageable);
    List<Ticket> findByEscalated(boolean escalated);
    
    // New methods for escalation
    Page<Ticket> findByEscalatedToAdmin(User admin, Pageable pageable);
    Page<Ticket> findByEscalatedToAgent(Agent agent, Pageable pageable);
    List<Ticket> findByEscalatedToAdmin(User admin);
    List<Ticket> findByEscalatedToAgent(Agent agent);
    
    // Agent-specific ticket search
    @Query("SELECT t FROM Ticket t WHERE t.assignedAgent = :agent AND " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(t.ticketId) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Ticket> findByAssignedAgentAndSearchTerm(@Param("agent") Agent agent, 
                                                  @Param("searchTerm") String searchTerm, 
                                                  Pageable pageable);
    
    @Query("SELECT t FROM Ticket t WHERE t.dueDate < :dateTime AND t.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Ticket> findOverdueTickets(@Param("dateTime") LocalDateTime dateTime);
    
    // Statistics queries
    long countByAssignedAgent(Agent agent);
    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.assignedAgent = :agent AND t.status = 'RESOLVED'")
    long countResolvedByAgent(@Param("agent") Agent agent);
    
    @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, t.createdAt, t.resolvedAt)) FROM Ticket t WHERE t.assignedAgent = :agent AND t.resolvedAt IS NOT NULL")
    Double getAverageResolutionTimeByAgent(@Param("agent") Agent agent);
    
    @Query("SELECT AVG(t.customerRating) FROM Ticket t WHERE t.assignedAgent = :agent AND t.customerRating IS NOT NULL")
    Double getAverageRatingByAgent(@Param("agent") Agent agent);
    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.customerRating IS NOT NULL")
    long countTotalRatings();
    
    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.customerRating >= 4")
    long countPositiveRatings();
}
