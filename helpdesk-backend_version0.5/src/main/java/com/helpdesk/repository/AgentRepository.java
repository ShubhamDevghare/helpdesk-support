package com.helpdesk.repository;

import com.helpdesk.entity.Agent;
import com.helpdesk.entity.Customer;
import com.helpdesk.enums.AgentStatus;
import com.helpdesk.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface AgentRepository extends JpaRepository<Agent, Long> {

    Optional<Agent> findByEmployeeId(String employeeId);

    List<Agent> findByAgentStatus(AgentStatus status);

    @Query("SELECT a FROM Agent a JOIN a.departments d WHERE d = :department AND a.agentStatus = 'ONLINE' AND a.status = 'ACTIVE'")
    List<Agent> findByDepartmentAndStatus(@Param("department") String department);

    @Query("SELECT a FROM Agent a JOIN a.departments d WHERE d IN :departments AND a.agentStatus = 'ONLINE' AND a.status = 'ACTIVE'")
    List<Agent> findByDepartmentsAndStatus(@Param("departments") Set<String> departments);

    @Query("SELECT a FROM Agent a WHERE a.agentStatus = 'ONLINE' AND a.status = 'ACTIVE'")
    List<Agent> findAvailableAgents();

    @Query("SELECT a FROM Agent a WHERE a.status = :status")
    List<Agent> findByUserStatus(@Param("status") UserStatus status);

    @Query("SELECT a FROM Agent a WHERE " +
           "LOWER(a.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(a.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(a.employeeId) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Agent> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);

    List<Agent> findByAgentStatusOrderByIdAsc(AgentStatus status);

    List<Agent> findByAgentStatusAndStatusOrderByIdAsc(AgentStatus agentStatus, UserStatus status);

    @Query("SELECT COUNT(a) FROM Agent a WHERE a.employeeId LIKE :pattern")
    long countByEmployeeIdPattern(@Param("pattern") String pattern);

}
