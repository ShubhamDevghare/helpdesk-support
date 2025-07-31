package com.helpdesk.dto.response;

import lombok.Data;

@Data
public class AgentPerformanceResponse {
    private Long agentId;
    private String agentName;
    private Integer ticketsAssigned;
    private Integer ticketsResolved;
    private Double averageResolutionTime;
    private Double averageCustomerRating;
    private Double performanceScore;
    private String performanceGrade;
}
