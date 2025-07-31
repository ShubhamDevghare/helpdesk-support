package com.helpdesk.service.impl;

import com.helpdesk.dto.response.AgentPerformanceResponse;
import com.helpdesk.dto.response.CustomerSatisfactionResponse;
import com.helpdesk.entity.Agent;
import com.helpdesk.repository.AgentRepository;
import com.helpdesk.repository.TicketRepository;
import com.helpdesk.service.ReportingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportingServiceImpl implements ReportingService {

    private final AgentRepository agentRepository;
    private final TicketRepository ticketRepository;
    
    @Override
    public List<AgentPerformanceResponse> getAgentPerformanceReport() {
        List<Agent> agents = agentRepository.findAll();
        List<AgentPerformanceResponse> performanceList = new ArrayList<>();
        
        for (Agent agent : agents) {
            AgentPerformanceResponse performance = calculateAgentPerformance(agent);
            performanceList.add(performance);
        }
        
        // Sort by performance score descending
        performanceList.sort((a, b) -> Double.compare(b.getPerformanceScore(), a.getPerformanceScore()));
        
        return performanceList;
    }

    @Override
    public AgentPerformanceResponse getAgentPerformance(Long agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found with id: " + agentId));
        
        return calculateAgentPerformance(agent);
    }

    @Override
    public CustomerSatisfactionResponse getCustomerSatisfactionReport() {
        CustomerSatisfactionResponse response = new CustomerSatisfactionResponse();
        
        long totalRatings = ticketRepository.countTotalRatings();
        long positiveRatings = ticketRepository.countPositiveRatings();
        
        if (totalRatings > 0) {
            double csatScore = (double) positiveRatings / totalRatings * 100;
            response.setCsatScore(Math.round(csatScore * 100.0) / 100.0);
        } else {
            response.setCsatScore(0.0);
        }
        
        response.setTotalRatings((int) totalRatings);
        response.setPositiveRatings((int) positiveRatings);
        
        // Calculate trend (simplified - comparing last 30 days vs previous 30 days)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        
        // This would require additional queries to get time-based ratings
        // For now, setting a placeholder trend
        response.setCsatTrend(0.0);
        response.setPeriodStart(thirtyDaysAgo);
        response.setPeriodEnd(now);
        
        return response;
    }

    @Override
    public byte[] exportToExcel(String reportType) {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(reportType);
            
            if ("agent-performance".equals(reportType)) {
                createAgentPerformanceExcel(sheet);
            } else if ("customer-satisfaction".equals(reportType)) {
                createCustomerSatisfactionExcel(sheet);
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
            
        } catch (IOException e) {
            log.error("Error creating Excel report", e);
            throw new RuntimeException("Failed to create Excel report", e);
        }
    }

    @Override
    public byte[] exportToPdf(String reportType) {
        // For PDF generation, you would typically use libraries like iText or Apache PDFBox
        // This is a simplified implementation that returns a placeholder
        String pdfContent = "PDF Report: " + reportType + "\nGenerated at: " + LocalDateTime.now();
        return pdfContent.getBytes();
    }

    private AgentPerformanceResponse calculateAgentPerformance(Agent agent) {
        AgentPerformanceResponse performance = new AgentPerformanceResponse();
        
        performance.setAgentId(agent.getId());
        performance.setAgentName(agent.getFirstName() + " " + agent.getLastName());
        
        // Get metrics
        long totalAssigned = ticketRepository.countByAssignedAgent(agent);
        long totalResolved = ticketRepository.countResolvedByAgent(agent);
        Double avgResolutionTime = ticketRepository.getAverageResolutionTimeByAgent(agent);
        Double avgRating = ticketRepository.getAverageRatingByAgent(agent);
        
        performance.setTicketsAssigned((int) totalAssigned);
        performance.setTicketsResolved((int) totalResolved);
        performance.setAverageResolutionTime(avgResolutionTime != null ? avgResolutionTime : 0.0);
        performance.setAverageCustomerRating(avgRating != null ? avgRating : 0.0);
        
        // Calculate performance score using the formula from requirements
        double resolutionRate = totalAssigned > 0 ? (double) totalResolved / totalAssigned : 0;
        double ratingScore = avgRating != null ? avgRating / 5.0 : 0;
        double timeScore = avgResolutionTime != null && avgResolutionTime > 0 ? 1.0 / avgResolutionTime : 0;
        
        // Normalize time score (assuming 24 hours is baseline)
        timeScore = Math.min(timeScore * 24, 1.0);
        
        // W₁ = 0.4, W₂ = 0.4, W₃ = 0.2
        double performanceScore = (resolutionRate * 0.4) + (ratingScore * 0.4) + (timeScore * 0.2);
        performance.setPerformanceScore(Math.round(performanceScore * 100.0) / 100.0);
        
        // Assign performance grade
        String grade;
        if (performanceScore >= 0.9) grade = "A+";
        else if (performanceScore >= 0.8) grade = "A";
        else if (performanceScore >= 0.7) grade = "B";
        else if (performanceScore >= 0.6) grade = "C";
        else grade = "D";
        
        performance.setPerformanceGrade(grade);
        
        return performance;
    }

    private void createAgentPerformanceExcel(Sheet sheet) {
        // Create header row
        Row headerRow = sheet.createRow(0);
        String[] headers = {"Agent Name", "Tickets Assigned", "Tickets Resolved", 
                           "Resolution Rate %", "Avg Resolution Time (hrs)", 
                           "Avg Customer Rating", "Performance Score", "Grade"};
        
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            
            // Style header
            CellStyle headerStyle = sheet.getWorkbook().createCellStyle();
            Font headerFont = sheet.getWorkbook().createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            cell.setCellStyle(headerStyle);
        }
        
        // Add data rows
        List<AgentPerformanceResponse> performances = getAgentPerformanceReport();
        int rowNum = 1;
        
        for (AgentPerformanceResponse performance : performances) {
            Row row = sheet.createRow(rowNum++);
            
            row.createCell(0).setCellValue(performance.getAgentName());
            row.createCell(1).setCellValue(performance.getTicketsAssigned());
            row.createCell(2).setCellValue(performance.getTicketsResolved());
            
            double resolutionRate = performance.getTicketsAssigned() > 0 ? 
                (double) performance.getTicketsResolved() / performance.getTicketsAssigned() * 100 : 0;
            row.createCell(3).setCellValue(Math.round(resolutionRate * 100.0) / 100.0);
            
            row.createCell(4).setCellValue(performance.getAverageResolutionTime());
            row.createCell(5).setCellValue(performance.getAverageCustomerRating());
            row.createCell(6).setCellValue(performance.getPerformanceScore());
            row.createCell(7).setCellValue(performance.getPerformanceGrade());
        }
        
        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private void createCustomerSatisfactionExcel(Sheet sheet) {
        CustomerSatisfactionResponse satisfaction = getCustomerSatisfactionReport();
        
        // Create header
        Row headerRow = sheet.createRow(0);
        headerRow.createCell(0).setCellValue("Customer Satisfaction Report");
        
        // Add data
        int rowNum = 2;
        Row row1 = sheet.createRow(rowNum++);
        row1.createCell(0).setCellValue("Total Ratings:");
        row1.createCell(1).setCellValue(satisfaction.getTotalRatings());
        
        Row row2 = sheet.createRow(rowNum++);
        row2.createCell(0).setCellValue("Positive Ratings:");
        row2.createCell(1).setCellValue(satisfaction.getPositiveRatings());
        
        Row row3 = sheet.createRow(rowNum++);
        row3.createCell(0).setCellValue("CSAT Score (%):");
        row3.createCell(1).setCellValue(satisfaction.getCsatScore());
        
        Row row4 = sheet.createRow(rowNum++);
        row4.createCell(0).setCellValue("Period:");
        row4.createCell(1).setCellValue(satisfaction.getPeriodStart() + " to " + satisfaction.getPeriodEnd());
        
        // Auto-size columns
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }
}
