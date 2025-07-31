package com.helpdesk.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CustomerSatisfactionResponse {
    private Double csatScore;
    private Double csatTrend;
    private Integer totalRatings;
    private Integer positiveRatings;
    private LocalDateTime periodStart;
    private LocalDateTime periodEnd;
}
