package com.helpdesk.service.impl;

import com.helpdesk.dto.request.TicketCreateRequest;
import com.helpdesk.dto.request.TicketUpdateRequest;
import com.helpdesk.dto.request.TicketRatingRequest;
import com.helpdesk.dto.response.TicketResponse;
import com.helpdesk.entity.*;
import com.helpdesk.enums.TicketStatus;
import com.helpdesk.enums.TicketCategory;
import com.helpdesk.enums.AgentStatus;
import com.helpdesk.enums.UserStatus;
import com.helpdesk.exception.ResourceNotFoundException;
import com.helpdesk.exception.BadRequestException;
import com.helpdesk.mapper.TicketMapper;
import com.helpdesk.repository.*;
import com.helpdesk.service.TicketService;
import com.helpdesk.service.EmailService;
import com.helpdesk.service.NotificationService;
import com.helpdesk.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageImpl;
import com.helpdesk.dto.request.TicketEscalationRequest;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final CustomerRepository customerRepository;
    private final AgentRepository agentRepository;
    private final UserRepository userRepository;
    private final AttachmentRepository attachmentRepository;
    private final TicketMapper ticketMapper;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional
    public TicketResponse createTicket(TicketCreateRequest request, Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        Ticket ticket = ticketMapper.toEntity(request);
        ticket.setCustomer(customer);
        ticket.setTicketId(generateTicketId());
        ticket.setDueDate(calculateDueDate(ticket.getPriority()));

        // Auto-assign agent based on department
        Agent availableAgent = findAvailableAgentByDepartment(ticket.getCategory());
        if (availableAgent != null) {
            ticket.setAssignedAgent(availableAgent);
        }

        Ticket savedTicket = ticketRepository.save(ticket);

        // Send notifications
        emailService.sendTicketCreatedEmail(customer.getEmail(), savedTicket.getTicketId());
        if (availableAgent != null) {
            notificationService.sendTicketAssignmentNotification(availableAgent, savedTicket);
        }

        log.info("Ticket created successfully: {} and assigned to agent: {}", 
                savedTicket.getTicketId(), 
                availableAgent != null ? availableAgent.getEmployeeId() : "None");
        return ticketMapper.toResponse(savedTicket);
    }

    @Override
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
        return ticketMapper.toResponse(ticket);
    }

    @Override
    public TicketResponse getTicketByTicketId(String ticketId) {
        Ticket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ticketId: " + ticketId));
        return ticketMapper.toResponse(ticket);
    }

    @Override
    @Transactional
    public TicketResponse updateTicket(Long id, TicketUpdateRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));

        TicketStatus oldStatus = ticket.getStatus();

        if (request.getTitle() != null) ticket.setTitle(request.getTitle());
        if (request.getDescription() != null) ticket.setDescription(request.getDescription());
        if (request.getCategory() != null) ticket.setCategory(request.getCategory());
        if (request.getPriority() != null) ticket.setPriority(request.getPriority());
        if (request.getStatus() != null) {
            ticket.setStatus(request.getStatus());
            if (request.getStatus() == TicketStatus.RESOLVED) {
                ticket.setResolvedAt(LocalDateTime.now());
            }
        }
        if (request.getAssignedAgentId() != null) {
            Agent agent = agentRepository.findById(request.getAssignedAgentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));
            ticket.setAssignedAgent(agent);
        }
        if (request.getEscalated() != null) {
            ticket.setEscalated(request.getEscalated());
            if (request.getEscalated()) {
                ticket.setEscalatedAt(LocalDateTime.now());
            }
        }

        Ticket updatedTicket = ticketRepository.save(ticket);

        // Send notifications if status changed
        if (!oldStatus.equals(updatedTicket.getStatus())) {
            notificationService.sendTicketStatusUpdateNotification(updatedTicket);
            if (updatedTicket.getStatus() == TicketStatus.RESOLVED) {
                emailService.sendTicketResolvedEmail(updatedTicket.getCustomer().getEmail(), updatedTicket.getTicketId());
            }
        }

        return ticketMapper.toResponse(updatedTicket);
    }

    @Override
    @Transactional
    public void deleteTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
        ticketRepository.delete(ticket);
        log.info("Ticket deleted successfully: {}", ticket.getTicketId());
    }

    @Override
    public Page<TicketResponse> getTicketsByCustomer(Long customerId, Pageable pageable) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        return ticketRepository.findByCustomer(customer, pageable)
                .map(ticketMapper::toResponse);
    }

    @Override
    public Page<TicketResponse> getTicketsByAgent(Long agentId, Pageable pageable) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found"));
        return ticketRepository.findByAssignedAgent(agent, pageable)
                .map(ticketMapper::toResponse);
    }

    @Override
    public Page<TicketResponse> getTicketsByStatus(TicketStatus status, Pageable pageable) {
        List<Ticket> tickets = ticketRepository.findByStatus(status);
        List<TicketResponse> ticketResponses = tickets.stream()
                .map(ticketMapper::toResponse)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), ticketResponses.size());

        List<TicketResponse> pageContent = ticketResponses.subList(start, end);
        return new PageImpl<>(pageContent, pageable, ticketResponses.size());
    }

    @Override
    public Page<TicketResponse> getAllTickets(Pageable pageable) {
        return ticketRepository.findAll(pageable)
                .map(ticketMapper::toResponse);
    }

    @Override
    @Transactional
    public TicketResponse assignTicket(Long ticketId, Long agentId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + agentId));

        ticket.setAssignedAgent(agent);
        Ticket updatedTicket = ticketRepository.save(ticket);

        // Send notification
        notificationService.sendTicketAssignmentNotification(agent, updatedTicket);
        
        log.info("Ticket {} assigned to agent {}", ticket.getTicketId(), agent.getEmail());
        return ticketMapper.toResponse(updatedTicket);
    }

    @Override
    @Transactional
    public TicketResponse escalateTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        ticket.setEscalated(true);
        ticket.setEscalatedAt(LocalDateTime.now());
        Ticket updatedTicket = ticketRepository.save(ticket);

        // Send escalation notification
        notificationService.sendEscalationNotification(updatedTicket);
        
        log.info("Ticket escalated: {}", ticket.getTicketId());
        return ticketMapper.toResponse(updatedTicket);
    }

    @Override
    @Transactional
    public TicketResponse reopenTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        if (ticket.getStatus() != TicketStatus.RESOLVED && ticket.getStatus() != TicketStatus.CLOSED) {
            throw new BadRequestException("Only resolved or closed tickets can be reopened");
        }

        ticket.setStatus(TicketStatus.REOPENED);
        ticket.setResolvedAt(null);
        Ticket updatedTicket = ticketRepository.save(ticket);

        // Send notification
        notificationService.sendTicketStatusUpdateNotification(updatedTicket);
        
        log.info("Ticket reopened: {}", ticket.getTicketId());
        return ticketMapper.toResponse(updatedTicket);
    }

    @Override
    @Transactional
    public TicketResponse rateTicket(Long ticketId, TicketRatingRequest request) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));

        if (ticket.getStatus() != TicketStatus.RESOLVED) {
            throw new BadRequestException("Only resolved tickets can be rated");
        }

        ticket.setCustomerRating(request.getRating());
        ticket.setCustomerFeedback(request.getFeedback());
        Ticket updatedTicket = ticketRepository.save(ticket);

        log.info("Ticket rated: {} with rating {}", ticket.getTicketId(), request.getRating());
        return ticketMapper.toResponse(updatedTicket);
    }

    @Override
    public List<TicketResponse> getOverdueTickets() {
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        return ticketRepository.findOverdueTickets(twentyFourHoursAgo).stream()
                .map(ticketMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse addAttachment(Long ticketId, MultipartFile file, Long userId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        String fileUrl = cloudinaryService.uploadFile(file);
        
        Attachment attachment = new Attachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileUrl(fileUrl);
        attachment.setFileType(file.getContentType());
        attachment.setFileSize(file.getSize());
        attachment.setTicket(ticket);
        attachment.setUploadedBy(user);

        attachmentRepository.save(attachment);
        
        log.info("Attachment added to ticket: {}", ticket.getTicketId());
        return ticketMapper.toResponse(ticket);
    }

    private String generateTicketId() {
        return "TKT-" + System.currentTimeMillis();
    }

    private LocalDateTime calculateDueDate(com.helpdesk.enums.Priority priority) {
        LocalDateTime now = LocalDateTime.now();
        switch (priority) {
            case HIGH:
                return now.plusHours(4);
            case MEDIUM:
                return now.plusHours(24);
            case LOW:
            default:
                return now.plusHours(72);
        }
    }

    /**
     * Simplified method to find available agent based on department
     */
    private Agent findAvailableAgentByDepartment(TicketCategory category) {
        String targetDepartment = mapCategoryToDepartment(category);
        
        // First, try to find agents in the specific department with ONLINE status and ACTIVE user status
        List<Agent> departmentAgents = agentRepository.findByDepartmentAndStatus(targetDepartment);
        
        if (!departmentAgents.isEmpty()) {
            return departmentAgents.get(0);
        }
        
     // Fallback to any available online and active agent
        List<Agent> availableAgents = agentRepository.findByAgentStatusAndStatusOrderByIdAsc(
            AgentStatus.ONLINE, UserStatus.ACTIVE);
        return availableAgents.isEmpty() ? null : availableAgents.get(0);
    }

    /**
     * Map ticket categories to departments
     */
    private String mapCategoryToDepartment(TicketCategory category) {
        switch (category) {
            case TECHNICAL_SUPPORT:
            case NETWORK_CONNECTIVITY:
                return "Technical Support";
            case BILLING_PAYMENTS:
                return "Billing";
            case ACCOUNT_MANAGEMENT:
                return "Customer Service";
            case TRAINING_DOCUMENTATION:
                return "Training";
            case FEATURE_REQUESTS:
                return "Product Development";
            case GENERAL_INQUIRY:
            case OTHERS:
            default:
                return "General Support";
        }
    }

    @Override
    @Transactional
    public TicketResponse escalateTicketToAdmin(String ticketId, TicketEscalationRequest request, String employeeId) {
        Ticket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        Agent agent = agentRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with id: " + employeeId));
        
        User admin = userRepository.findById(request.getEscalateToAdminId())
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found"));

        ticket.setEscalated(true);
        ticket.setEscalatedAt(LocalDateTime.now());
        ticket.setEscalatedToAdmin(admin);
        ticket.setEscalationReason(request.getEscalationReason());
        
        Ticket updatedTicket = ticketRepository.save(ticket);
        
        // Send escalation notification
        notificationService.sendEscalationNotification(updatedTicket);
        
        log.info("Ticket escalated to admin: {} by agent: {}", ticket.getTicketId(), agent.getEmail());
        return ticketMapper.toResponse(updatedTicket);
    }

    @Override
    @Transactional
    public TicketResponse escalateTicketToAgent(String ticketId, TicketEscalationRequest request, Long adminId) {
        Ticket ticket = ticketRepository.findByTicketId(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + ticketId));
        
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found with id: " + adminId));
        
        Agent escalateToAgent = agentRepository.findByEmployeeId(request.getEscalateToAgentId())
                .orElseThrow(() -> new ResourceNotFoundException("Target agent not found"));

        ticket.setEscalated(true);
        ticket.setEscalatedAt(LocalDateTime.now());
        ticket.setEscalatedToAgent(escalateToAgent);
        ticket.setEscalationReason(request.getEscalationReason());
        
        Ticket updatedTicket = ticketRepository.save(ticket);
        
        // Send escalation notification
        notificationService.sendEscalationNotification(updatedTicket);
        
        log.info("Ticket escalated to agent: {} by admin: {}", ticket.getTicketId(), admin.getEmail());
        return ticketMapper.toResponse(updatedTicket);
    }
}
