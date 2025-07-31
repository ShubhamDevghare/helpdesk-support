package com.helpdesk.service;

import com.helpdesk.dto.response.AgentPerformanceResponse;
import com.helpdesk.dto.response.CustomerSatisfactionResponse;

import java.util.List;

public interface ReportingService {
    List<AgentPerformanceResponse> getAgentPerformanceReport();
    AgentPerformanceResponse getAgentPerformance(Long agentId);
    CustomerSatisfactionResponse getCustomerSatisfactionReport();
    byte[] exportToExcel(String reportType);
    byte[] exportToPdf(String reportType);
}
