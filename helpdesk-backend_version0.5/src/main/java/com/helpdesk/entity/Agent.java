package com.helpdesk.entity;

import com.helpdesk.enums.AgentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "agents")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class Agent extends User {
    
    @Column(name = "employee_id", unique = true)
    private String employeeId;

    @ElementCollection
    @CollectionTable(name = "agent_departments", joinColumns = @JoinColumn(name = "agent_id"))
    @Column(name = "department")
    private Set<String> departments = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "agent_status")
    private AgentStatus agentStatus = AgentStatus.OFFLINE;

    @OneToMany(mappedBy = "assignedAgent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Ticket> assignedTickets;

    @PrePersist
    private void generateEmployeeId() {
        if (this.employeeId == null || this.employeeId.isEmpty()) {
            this.employeeId = generateUniqueEmployeeId();
        }
    }

    private String generateUniqueEmployeeId() {
        String year = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy"));
        long count = 1; // This will be handled by service layer
        return "EMP-" + year + "-" + String.format("%04d", count);
    }

    // Helper method to add department
    public void addDepartment(String department) {
        if (this.departments == null) {
            this.departments = new HashSet<>();
        }
        this.departments.add(department);
    }

    // Helper method to remove department
    public void removeDepartment(String department) {
        if (this.departments != null) {
            this.departments.remove(department);
        }
    }
}
