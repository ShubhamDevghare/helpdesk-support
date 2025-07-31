package com.helpdesk.dto.request;

import com.helpdesk.enums.AgentStatus;
import com.helpdesk.enums.UserStatus;
import lombok.Data;

import java.util.Set;

@Data
public class AgentUpdateRequest {
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private Set<String> departments;
    private AgentStatus agentStatus;
    private UserStatus userStatus;
}
