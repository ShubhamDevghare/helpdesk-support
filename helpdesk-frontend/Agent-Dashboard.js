// API Configuration
const API_BASE_URL = "http://localhost:8080/api";

// Global variables
let currentUser = null;
let currentTickets = [];
const currentFilters = {};

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();
  initializeEventListeners();
  loadDashboardData();
});

// Check if user is authenticated
function checkAuthentication() {
  const token = localStorage.getItem("authToken");
  const userRole = localStorage.getItem("userRole");

  if (!token || userRole !== "AGENT") {
    window.location.href = "Login.html";
    return;
  }

  // Set up API headers
  setupAPIHeaders();

  // Load user info
  loadUserInfo();
}

// Setup API headers with auth token
function setupAPIHeaders() {
  const token = localStorage.getItem("authToken");
  if (token) {
    window.authHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Profile image upload
  document
    .getElementById("profileImageInput")
    ?.addEventListener("change", handleProfileImageUpload);

  // Update ticket form
  document
    .getElementById("updateTicketForm")
    ?.addEventListener("submit", handleUpdateTicket);

  // Add comment form
  document
    .getElementById("addCommentForm")
    ?.addEventListener("submit", handleAddComment);

  // Profile form
  document
    .getElementById("profileForm")
    ?.addEventListener("submit", handleProfileUpdate);

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !event.target.closest(".notifications") &&
      !event.target.closest(".notifications-dropdown")
    ) {
      const notificationsDropdown = document.getElementById(
        "notificationsDropdown"
      );
      if (notificationsDropdown) {
        notificationsDropdown.classList.remove("show");
      }
    }
    if (
      !event.target.closest(".user-menu") &&
      !event.target.closest(".user-dropdown")
    ) {
      const userDropdown = document.getElementById("userDropdown");
      if (userDropdown) {
        userDropdown.classList.remove("show");
      }
    }
  });
}

// Load user information
async function loadUserInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: window.authHeaders,
    });

    if (response.ok) {
      currentUser = await response.json();
      // Store user information in localStorage for easy access
      localStorage.setItem("userId", currentUser.id);
      localStorage.setItem("employeeId", currentUser.employeeId || "");
      updateUserDisplay();
      loadAgentStatus();
    } else {
      console.error("Failed to load user info");
    }
  } catch (error) {
    console.error("Error loading user info:", error);
  }
}

// Update user display in header
function updateUserDisplay() {
  if (currentUser) {
    const userNameElement = document.getElementById("userName");
    const employeeIdElement = document.getElementById("employeeId");

    if (userNameElement) {
      userNameElement.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    }
    if (employeeIdElement) {
      employeeIdElement.textContent = currentUser.employeeId || "N/A";
    }

    if (currentUser.profileImageUrl) {
      const profileImage = document.getElementById("profileImage");
      const profileImageLarge = document.getElementById("profileImageLarge");

      if (profileImage) profileImage.src = currentUser.profileImageUrl;
      if (profileImageLarge)
        profileImageLarge.src = currentUser.profileImageUrl;
    }
  }
}

// Load agent status
async function loadAgentStatus() {
  const employeeId = localStorage.getItem("employeeId");
  if (!employeeId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/agent/${employeeId}/status`, {
      headers: window.authHeaders,
    });

    if (response.ok) {
      const status = await response.text();
      const agentStatusElement = document.getElementById("agentStatus");
      if (agentStatusElement) {
        agentStatusElement.value = status.replace(/"/g, "");
      }
    }
  } catch (error) {
    console.error("Error loading agent status:", error);
  }
}

// Update agent status
async function updateAgentStatus() {
  const agentStatusElement = document.getElementById("agentStatus");
  if (!agentStatusElement) return;

  const status = agentStatusElement.value;
  const employeeId = localStorage.getItem("employeeId");

  if (!employeeId) {
    showAlert("Employee ID not found", "error");
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/agent/${employeeId}/status?status=${status}`,
      {
        method: "PUT",
        headers: window.authHeaders,
      }
    );

    if (response.ok) {
      showAlert(`Status updated to ${status}`, "success");
    } else {
      showAlert("Failed to update status", "error");
    }
  } catch (error) {
    console.error("Error updating agent status:", error);
    showAlert("Network error. Please try again.", "error");
  }
}

// Load dashboard data
async function loadDashboardData() {
  await Promise.all([
    loadDashboardStats(),
    loadAssignedTickets(),
    loadNotifications(),
  ]);
}

// Load dashboard statistics
async function loadDashboardStats() {
  const employeeId = localStorage.getItem("employeeId");
  if (!employeeId) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/agent/${employeeId}/dashboard/stats`,
      {
        headers: window.authHeaders,
      }
    );

    if (response.ok) {
      const stats = await response.json();
      updateStatsDisplay(stats);
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}

// Update stats display
function updateStatsDisplay(stats) {
  const elements = {
    totalAssigned: document.getElementById("totalAssigned"),
    openTickets: document.getElementById("openTickets"),
    inProgressTickets: document.getElementById("inProgressTickets"),
    resolvedTickets: document.getElementById("resolvedTickets"),
    escalatedToMe: document.getElementById("escalatedToMe"),
  };

  Object.entries(elements).forEach(([key, element]) => {
    if (element) {
      element.textContent = stats[key] || 0;
    }
  });
}

// Load assigned tickets
async function loadAssignedTickets() {
  try {
    const priorityFilter = document.getElementById("priorityFilter");
    const statusFilter = document.getElementById("statusFilter");

    const priority = priorityFilter?.value || "";
    const status = statusFilter?.value || "";

    let url = `${API_BASE_URL}/tickets/assigned-to-me?size=20&sortBy=createdAt&sortDir=desc`;
    if (priority) url += `&priority=${priority}`;
    if (status) url += `&status=${status}`;

    const response = await fetch(url, {
      headers: window.authHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      currentTickets = data.content || [];
      displayTickets(currentTickets);
    }
  } catch (error) {
    console.error("Error loading assigned tickets:", error);
    const ticketsContainer = document.getElementById("ticketsContainer");
    if (ticketsContainer) {
      ticketsContainer.innerHTML =
        '<div class="loading">Error loading tickets</div>';
    }
  }
}

// Search assigned tickets
async function searchAssignedTickets() {
  const searchInput = document.getElementById("ticketSearch");
  if (!searchInput) return;

  const searchTerm = searchInput.value.trim();
  if (!searchTerm) {
    loadAssignedTickets();
    return;
  }

  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      showAlert("User ID not found", "error");
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/agent/${userId}/tickets/search?searchTerm=${encodeURIComponent(
        searchTerm
      )}`,
      {
        headers: window.authHeaders,
      }
    );

    if (response.ok) {
      const data = await response.json();
      currentTickets = data.content || [];
      displayTickets(currentTickets);
    } else {
      showAlert("No tickets found", "info");
    }
  } catch (error) {
    console.error("Error searching tickets:", error);
    showAlert("Error searching tickets", "error");
  }
}

// Handle search key press
function handleSearchKeyPress(event) {
  if (event.key === "Enter") {
    searchAssignedTickets();
  }
}

// Display tickets
function displayTickets(tickets) {
  const container = document.getElementById("ticketsContainer");
  if (!container) return;

  if (tickets.length === 0) {
    container.innerHTML = '<div class="loading">No tickets assigned</div>';
    return;
  }

  const ticketsHTML = tickets
    .map(
      (ticket) => `
        <div class="ticket-item ${ticket.priority.toLowerCase()}-priority" onclick="showTicketDetails('${
        ticket.id
      }')">
            <div class="ticket-header">
                <span class="ticket-id">${ticket.ticketId}</span>
                <div class="ticket-badges">
                    <span class="ticket-priority ${ticket.priority.toLowerCase()}">${
        ticket.priority
      }</span>
                    <span class="ticket-status ${ticket.status
                      .toLowerCase()
                      .replace("_", "-")}">${ticket.status.replace(
        "_",
        " "
      )}</span>
                    ${
                      ticket.escalatedToAgent
                        ? '<span class="escalated-badge">Escalated</span>'
                        : ""
                    }
                </div>
            </div>
            <div class="ticket-title">${ticket.title}</div>
            <div class="ticket-meta">
                <span class="ticket-category">${ticket.category.replace(
                  "_",
                  " "
                )}</span>
                <span class="ticket-customer">Customer: ${
                  ticket.customer.firstName
                } ${ticket.customer.lastName}</span>
                <span>Created: ${formatDate(ticket.createdAt)}</span>
                ${
                  ticket.dueDate
                    ? `<span>Due: ${formatDate(ticket.dueDate)}</span>`
                    : ""
                }
            </div>
            <div class="ticket-actions">
                <button class="ticket-action-btn" onclick="event.stopPropagation(); showUpdateTicket('${
                  ticket.id
                }')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="ticket-action-btn secondary" onclick="event.stopPropagation(); showAddComment('${
                  ticket.id
                }')">
                    <i class="fas fa-comment"></i>
                </button>
                ${
                  ticket.status !== "RESOLVED"
                    ? `
                    <button class="ticket-action-btn danger" onclick="event.stopPropagation(); escalateTicketToAdmin('${ticket.ticketId}')">
                        <i class="fas fa-exclamation-triangle"></i>
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = ticketsHTML;
}

// Show escalated tickets
async function showEscalatedTickets() {
  try {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      showAlert("User ID not found", "error");
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/agent/${userId}/escalated-tickets`,
      {
        headers: window.authHeaders,
      }
    );

    if (response.ok) {
      const data = await response.json();
      displayEscalatedTickets(data.content || []);
      const escalatedModal = document.getElementById("escalatedTicketsModal");
      if (escalatedModal) {
        escalatedModal.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Error loading escalated tickets:", error);
    showAlert("Failed to load escalated tickets", "error");
  }

  // Close user dropdown
  const userDropdown = document.getElementById("userDropdown");
  if (userDropdown) {
    userDropdown.classList.remove("show");
  }
}

// Display escalated tickets
function displayEscalatedTickets(tickets) {
  const container = document.getElementById("escalatedTicketsList");
  if (!container) return;

  if (tickets.length === 0) {
    container.innerHTML = '<div class="loading">No escalated tickets</div>';
    return;
  }

  const ticketsHTML = tickets
    .map(
      (ticket) => `
        <div class="ticket-item escalated" onclick="showTicketDetails('${
          ticket.id
        }')">
            <div class="ticket-header">
                <span class="ticket-id">${ticket.ticketId}</span>
                <div class="ticket-badges">
                    <span class="ticket-priority ${ticket.priority.toLowerCase()}">${
        ticket.priority
      }</span>
                    <span class="ticket-status ${ticket.status
                      .toLowerCase()
                      .replace("_", "-")}">${ticket.status.replace(
        "_",
        " "
      )}</span>
                    <span class="escalated-badge">Escalated from Admin</span>
                </div>
            </div>
            <div class="ticket-title">${ticket.title}</div>
            <div class="ticket-meta">
                <span class="ticket-category">${ticket.category.replace(
                  "_",
                  " "
                )}</span>
                <span class="ticket-customer">Customer: ${
                  ticket.customer.firstName
                } ${ticket.customer.lastName}</span>
                <span>Escalated: ${formatDate(ticket.escalatedAt)}</span>
                ${
                  ticket.escalationReason
                    ? `<span>Reason: ${ticket.escalationReason}</span>`
                    : ""
                }
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = ticketsHTML;
}

// Filter tickets
function filterTickets() {
  loadAssignedTickets();
}

// Show ticket details
async function showTicketDetails(ticketId) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      headers: window.authHeaders,
    });

    if (response.ok) {
      const ticket = await response.json();
      displayTicketDetails(ticket);
      const detailsModal = document.getElementById("ticketDetailsModal");
      if (detailsModal) {
        detailsModal.style.display = "block";
      }
    }
  } catch (error) {
    console.error("Error loading ticket details:", error);
    showAlert("Failed to load ticket details", "error");
  }
}

// Display ticket details
function displayTicketDetails(ticket) {
  const titleElement = document.getElementById("ticketDetailsTitle");
  const contentElement = document.getElementById("ticketDetailsContent");

  if (titleElement) {
    titleElement.textContent = `Ticket ${ticket.ticketId}`;
  }

  if (!contentElement) return;

  contentElement.innerHTML = `
        <div style="padding: 2rem;">
            <div class="ticket-details-header">
                <div class="ticket-info">
                    <h3>${ticket.title}</h3>
                    <div class="ticket-meta">
                        <span class="ticket-status ${ticket.status
                          .toLowerCase()
                          .replace("_", "-")}">${ticket.status.replace(
    "_",
    " "
  )}</span>
                        <span class="ticket-priority ${ticket.priority.toLowerCase()}">${
    ticket.priority
  }</span>
                        <span class="ticket-category">${ticket.category.replace(
                          "_",
                          " "
                        )}</span>
                        ${
                          ticket.escalatedToAgent
                            ? '<span class="escalated-badge">Escalated to Me</span>'
                            : ""
                        }
                    </div>
                </div>
                <div class="ticket-actions-header">
                    <button onclick="showUpdateTicket('${
                      ticket.id
                    }')" class="btn-primary">
                        <i class="fas fa-edit"></i> Update
                    </button>
                    <button onclick="showAddComment('${
                      ticket.id
                    }')" class="btn-secondary">
                        <i class="fas fa-comment"></i> Comment
                    </button>
                    ${
                      ticket.status !== "RESOLVED"
                        ? `
                        <button onclick="escalateTicketToAdmin('${ticket.ticketId}')" class="btn-secondary">
                            <i class="fas fa-exclamation-triangle"></i> Escalate to Admin
                        </button>
                    `
                        : ""
                    }
                </div>
            </div>
            
            <div class="ticket-description">
                <h4>Description</h4>
                <p>${ticket.description}</p>
            </div>
            
            <div class="ticket-customer-info">
                <h4>Customer Information</h4>
                <div class="customer-details">
                    <p><strong>Name:</strong> ${ticket.customer.firstName} ${
    ticket.customer.lastName
  }</p>
                    <p><strong>Email:</strong> ${ticket.customer.email}</p>
                    ${
                      ticket.customer.phoneNumber
                        ? `<p><strong>Phone:</strong> ${ticket.customer.phoneNumber}</p>`
                        : ""
                    }
                    ${
                      ticket.customer.companyName
                        ? `<p><strong>Company:</strong> ${ticket.customer.companyName}</p>`
                        : ""
                    }
                </div>
            </div>
            
            ${
              ticket.escalationReason
                ? `
                <div class="escalation-info">
                    <h4>Escalation Information</h4>
                    <p><strong>Reason:</strong> ${ticket.escalationReason}</p>
                    <p><strong>Escalated At:</strong> ${formatDate(
                      ticket.escalatedAt
                    )}</p>
                </div>
            `
                : ""
            }
            
            <div class="ticket-timeline">
                <h4>Timeline</h4>
                <div class="timeline-item">
                    <strong>Created:</strong> ${formatDate(ticket.createdAt)}
                </div>
                ${
                  ticket.dueDate
                    ? `
                    <div class="timeline-item">
                        <strong>Due Date:</strong> ${formatDate(ticket.dueDate)}
                    </div>
                `
                    : ""
                }
                ${
                  ticket.resolvedAt
                    ? `
                    <div class="timeline-item">
                        <strong>Resolved:</strong> ${formatDate(
                          ticket.resolvedAt
                        )}
                    </div>
                `
                    : ""
                }
                ${
                  ticket.escalatedAt
                    ? `
                    <div class="timeline-item">
                        <strong>Escalated:</strong> ${formatDate(
                          ticket.escalatedAt
                        )}
                    </div>
                `
                    : ""
                }
            </div>
            
            ${
              ticket.comments && ticket.comments.length > 0
                ? `
                <div class="ticket-comments">
                    <h4>Comments & Updates</h4>
                    ${ticket.comments
                      .map(
                        (comment) => `
                        <div class="comment-item">
                            <div class="comment-header">
                                <strong>${comment.author.firstName} ${
                          comment.author.lastName
                        }</strong>
                                <span class="comment-type ${comment.type
                                  .toLowerCase()
                                  .replace("_", "-")}">${comment.type.replace(
                          "_",
                          " "
                        )}</span>
                                <span class="comment-time">${formatDate(
                                  comment.createdAt
                                )}</span>
                            </div>
                            <div class="comment-content">${
                              comment.content
                            }</div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `
                : ""
            }
            
            ${
              ticket.attachments && ticket.attachments.length > 0
                ? `
                <div class="ticket-attachments">
                    <h4>Attachments</h4>
                    ${ticket.attachments
                      .map(
                        (attachment) => `
                        <div class="attachment-item">
                            <a href="${attachment.fileUrl}" target="_blank">
                                <i class="fas fa-paperclip"></i>
                                ${attachment.fileName}
                                <small>(${formatFileSize(
                                  attachment.fileSize
                                )})</small>
                            </a>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `
                : ""
            }
            
            ${
              ticket.customerRating
                ? `
                <div class="customer-rating">
                    <h4>Customer Rating</h4>
                    <div class="rating-display">
                        ${[1, 2, 3, 4, 5]
                          .map(
                            (star) => `
                            <i class="fas fa-star ${
                              star <= ticket.customerRating ? "rated" : ""
                            }"></i>
                        `
                          )
                          .join("")}
                        <span>(${ticket.customerRating}/5)</span>
                    </div>
                    ${
                      ticket.customerFeedback
                        ? `<p><strong>Feedback:</strong> ${ticket.customerFeedback}</p>`
                        : ""
                    }
                </div>
            `
                : ""
            }
        </div>
    `;
}

// Show update ticket modal
function showUpdateTicket(ticketId) {
  const ticket = currentTickets.find((t) => t.id == ticketId);
  if (ticket) {
    const updateTicketIdElement = document.getElementById("updateTicketId");
    const updateStatusElement = document.getElementById("updateStatus");
    const updatePriorityElement = document.getElementById("updatePriority");
    const updateCategoryElement = document.getElementById("updateCategory");

    if (updateTicketIdElement) updateTicketIdElement.value = ticketId;
    if (updateStatusElement) updateStatusElement.value = ticket.status;
    if (updatePriorityElement) updatePriorityElement.value = ticket.priority;
    if (updateCategoryElement) updateCategoryElement.value = ticket.category;

    const updateModal = document.getElementById("updateTicketModal");
    if (updateModal) {
      updateModal.style.display = "block";
    }
  }
}

// Handle update ticket
async function handleUpdateTicket(event) {
  event.preventDefault();

  const updateTicketIdElement = document.getElementById("updateTicketId");
  const updateStatusElement = document.getElementById("updateStatus");
  const updatePriorityElement = document.getElementById("updatePriority");
  const updateCategoryElement = document.getElementById("updateCategory");

  if (
    !updateTicketIdElement ||
    !updateStatusElement ||
    !updatePriorityElement ||
    !updateCategoryElement
  ) {
    showAlert("Form elements not found", "error");
    return;
  }

  const ticketId = updateTicketIdElement.value;
  const updateData = {
    status: updateStatusElement.value,
    priority: updatePriorityElement.value,
    category: updateCategoryElement.value,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: "PUT",
      headers: window.authHeaders,
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      showAlert("Ticket updated successfully", "success");
      closeModal("updateTicketModal");
      loadAssignedTickets();

      // Refresh ticket details if modal is open
      const detailsModal = document.getElementById("ticketDetailsModal");
      if (detailsModal && detailsModal.style.display === "block") {
        showTicketDetails(ticketId);
      }
    } else {
      showAlert("Failed to update ticket", "error");
    }
  } catch (error) {
    console.error("Error updating ticket:", error);
    showAlert("Network error. Please try again.", "error");
  }
}

// Show add comment modal
function showAddComment(ticketId) {
  const commentTicketIdElement = document.getElementById("commentTicketId");
  const commentContentElement = document.getElementById("commentContent");
  const commentTypeElement = document.getElementById("commentType");

  if (commentTicketIdElement) commentTicketIdElement.value = ticketId;
  if (commentContentElement) commentContentElement.value = "";
  if (commentTypeElement) commentTypeElement.value = "AGENT_RESPONSE";

  const commentModal = document.getElementById("addCommentModal");
  if (commentModal) {
    commentModal.style.display = "block";
  }
}

// Handle add comment
async function handleAddComment(event) {
  event.preventDefault();

  const commentTicketIdElement = document.getElementById("commentTicketId");
  const commentTypeElement = document.getElementById("commentType");
  const commentContentElement = document.getElementById("commentContent");

  if (
    !commentTicketIdElement ||
    !commentTypeElement ||
    !commentContentElement
  ) {
    showAlert("Form elements not found", "error");
    return;
  }

  const commentData = {
    ticketId: Number.parseInt(commentTicketIdElement.value),
    type: commentTypeElement.value,
    content: commentContentElement.value.trim(),
  };

  if (!commentData.content) {
    showAlert("Please enter a comment", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: "POST",
      headers: window.authHeaders,
      body: JSON.stringify(commentData),
    });

    if (response.ok) {
      showAlert("Comment added successfully", "success");
      closeModal("addCommentModal");

      // Refresh ticket details if modal is open
      const detailsModal = document.getElementById("ticketDetailsModal");
      if (detailsModal && detailsModal.style.display === "block") {
        showTicketDetails(commentData.ticketId);
      }
    } else {
      showAlert("Failed to add comment", "error");
    }
  } catch (error) {
    console.error("Error adding comment:", error);
    showAlert("Network error. Please try again.", "error");
  }
}

// Escalate ticket to admin
async function escalateTicketToAdmin(ticketId) {
  const reason = prompt("Please provide a reason for escalation:");
  if (!reason) return;

  const employeeId = localStorage.getItem("employeeId");
  if (!employeeId) {
    showAlert("Employee ID not found", "error");
    return;
  }

  const requestBody = {
    escalationReason: reason,
    escalateToAgentId: employeeId,
    // Backend will set escalateToAdminId to default admin (ID: 2)
  };

  try {
    const response = await fetch(
      `${API_BASE_URL}/agent/tickets/${ticketId}/escalate-to-admin`,
      {
        method: "POST",
        headers: window.authHeaders,
        body: JSON.stringify(requestBody),
      }
    );

    if (response.ok) {
      showAlert("Ticket escalated to admin successfully", "success");
      loadAssignedTickets();

      const detailsModal = document.getElementById("ticketDetailsModal");
      if (detailsModal && detailsModal.style.display === "block") {
        // Find the ticket entity ID from the ticketId
        const ticket = currentTickets.find((t) => t.ticketId === ticketId);
        if (ticket) {
          showTicketDetails(ticket.id);
        }
      }
    } else {
      const errorText = await response.text();
      console.error("Escalation failed:", errorText);
      showAlert("Failed to escalate ticket", "error");
    }
  } catch (error) {
    console.error("Error escalating ticket:", error);
    showAlert("Network error. Please try again.", "error");
  }
}

// Show assigned tickets (same as load but with modal)
function showAssignedTickets() {
  loadAssignedTickets();
  showAlert("Showing all assigned tickets", "success");
}

// Show high priority tickets
function showHighPriorityTickets() {
  const priorityFilter = document.getElementById("priorityFilter");
  const statusFilter = document.getElementById("statusFilter");

  if (priorityFilter) priorityFilter.value = "HIGH";
  if (statusFilter) statusFilter.value = "";

  filterTickets();
  showAlert("Showing high priority tickets", "success");
}

// Show pending tickets
function showPendingTickets() {
  const priorityFilter = document.getElementById("priorityFilter");
  const statusFilter = document.getElementById("statusFilter");

  if (priorityFilter) priorityFilter.value = "";
  if (statusFilter) statusFilter.value = "PENDING_CUSTOMER_RESPONSE";

  filterTickets();
  showAlert("Showing pending response tickets", "success");
}

// Load notifications
async function loadNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications?size=10`, {
      headers: window.authHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      displayNotifications(data.content || []);

      // Update notification badge
      const unreadCount = data.content.filter((n) => !n.isRead).length;
      updateNotificationBadge(unreadCount);
    }
  } catch (error) {
    console.error("Error loading notifications:", error);
  }
}

// Display notifications
function displayNotifications(notifications) {
  const container = document.getElementById("notificationsList");
  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML =
      '<div class="no-notifications">No new notifications</div>';
    return;
  }

  const notificationsHTML = notifications
    .map(
      (notification) => `
        <div class="notification-item ${
          !notification.isRead ? "unread" : ""
        }" onclick="markNotificationAsRead('${notification.id}')">
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
            <div class="time">${formatDate(notification.createdAt)}</div>
        </div>
    `
    )
    .join("");

  container.innerHTML = notificationsHTML;
}

// Update notification badge
function updateNotificationBadge(count) {
  const badge = document.getElementById("notificationBadge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

// Toggle notifications dropdown
function toggleNotifications() {
  const dropdown = document.getElementById("notificationsDropdown");
  const userDropdown = document.getElementById("userDropdown");

  if (dropdown) {
    dropdown.classList.toggle("show");
  }

  // Close user dropdown if open
  if (userDropdown) {
    userDropdown.classList.remove("show");
  }
}

// Toggle user menu dropdown
function toggleUserMenu() {
  const dropdown = document.getElementById("userDropdown");
  const notificationsDropdown = document.getElementById(
    "notificationsDropdown"
  );

  if (dropdown) {
    dropdown.classList.toggle("show");
  }

  // Close notifications dropdown if open
  if (notificationsDropdown) {
    notificationsDropdown.classList.remove("show");
  }
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
  try {
    await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: window.authHeaders,
    });

    // Reload notifications
    loadNotifications();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

// Mark all notifications as read
async function markAllAsRead() {
  try {
    await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: "PUT",
      headers: window.authHeaders,
    });

    // Reload notifications
    loadNotifications();
    showAlert("All notifications marked as read", "success");
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    showAlert("Failed to mark notifications as read", "error");
  }
}

// Show performance modal
async function showPerformance() {
  const performanceModal = document.getElementById("performanceModal");
  if (performanceModal) {
    performanceModal.style.display = "block";
  }

  const userId = localStorage.getItem("userId");
  if (!userId) {
    const performanceContent = document.getElementById("performanceContent");
    if (performanceContent) {
      performanceContent.innerHTML =
        '<div class="loading">User ID not found</div>';
    }
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/agent/${userId}/performance`,
      {
        headers: window.authHeaders,
      }
    );

    if (response.ok) {
      const performance = await response.json();
      displayPerformance(performance);
    }
  } catch (error) {
    console.error("Error loading performance:", error);
    const performanceContent = document.getElementById("performanceContent");
    if (performanceContent) {
      performanceContent.innerHTML =
        '<div class="loading">Error loading performance data</div>';
    }
  }

  // Close user dropdown
  const userDropdown = document.getElementById("userDropdown");
  if (userDropdown) {
    userDropdown.classList.remove("show");
  }
}

// Display performance data
function displayPerformance(performance) {
  const content = document.getElementById("performanceContent");
  if (!content) return;

  const gradeClass = performance.performanceGrade
    ? performance.performanceGrade.toLowerCase().replace("+", "-plus")
    : "c";

  content.innerHTML = `
        <div style="padding: 2rem;">
            <div class="performance-grid">
                <div class="performance-card">
                    <h4>Total Assigned</h4>
                    <div class="value">${performance.totalAssigned || 0}</div>
                    <div class="label">Tickets</div>
                </div>
                <div class="performance-card">
                    <h4>Total Resolved</h4>
                    <div class="value">${performance.totalResolved || 0}</div>
                    <div class="label">Tickets</div>
                </div>
                <div class="performance-card">
                    <h4>Resolution Rate</h4>
                    <div class="value">${Math.round(
                      performance.resolutionRate || 0
                    )}%</div>
                    <div class="label">Success Rate</div>
                </div>
                <div class="performance-card">
                    <h4>Avg Resolution Time</h4>
                    <div class="value">${Math.round(
                      performance.averageResolutionTime || 0
                    )}</div>
                    <div class="label">Hours</div>
                </div>
                <div class="performance-card">
                    <h4>Customer Rating</h4>
                    <div class="value">${(
                      performance.averageRating || 0
                    ).toFixed(1)}</div>
                    <div class="label">Out of 5</div>
                </div>
                <div class="performance-card">
                    <h4>Performance Score</h4>
                    <div class="value">${(
                      performance.performanceScore || 0
                    ).toFixed(2)}</div>
                    <div class="label">Score</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 2rem;">
                <h3>Performance Grade</h3>
                <div class="performance-grade ${gradeClass}">
                    ${performance.performanceGrade || "C"}
                </div>
            </div>
            
            <div style="margin-top: 2rem;">
                <h4>Performance Breakdown</h4>
                <p><strong>Resolution Rate:</strong> Percentage of assigned tickets that have been resolved</p>
                <p><strong>Average Resolution Time:</strong> Average time taken to resolve tickets</p>
                <p><strong>Customer Rating:</strong> Average rating from customer feedback</p>
                <p><strong>Performance Score:</strong> Overall performance calculated from multiple metrics</p>
            </div>
        </div>
    `;
}

// Show profile modal
function showProfile() {
  if (currentUser) {
    // Populate form with current user data
    const profileElements = {
      profileFirstName: document.getElementById("profileFirstName"),
      profileLastName: document.getElementById("profileLastName"),
      profileEmail: document.getElementById("profileEmail"),
      profilePhone: document.getElementById("profilePhone"),
      profileEmployeeId: document.getElementById("profileEmployeeId"),
      profileDepartments: document.getElementById("profileDepartments"),
    };

    if (profileElements.profileFirstName)
      profileElements.profileFirstName.value = currentUser.firstName || "";
    if (profileElements.profileLastName)
      profileElements.profileLastName.value = currentUser.lastName || "";
    if (profileElements.profileEmail)
      profileElements.profileEmail.value = currentUser.email || "";
    if (profileElements.profilePhone)
      profileElements.profilePhone.value = currentUser.phoneNumber || "";
    if (profileElements.profileEmployeeId)
      profileElements.profileEmployeeId.value = currentUser.employeeId || "";

    // Handle multiple departments
    const departments = currentUser.departments || [];
    if (profileElements.profileDepartments) {
      profileElements.profileDepartments.value = Array.isArray(departments)
        ? departments.join(", ")
        : departments || "";
    }

    const profileModal = document.getElementById("profileModal");
    if (profileModal) {
      profileModal.style.display = "block";
    }
  }

  // Close user dropdown
  const userDropdown = document.getElementById("userDropdown");
  if (userDropdown) {
    userDropdown.classList.remove("show");
  }
}

// Handle profile update
async function handleProfileUpdate(event) {
  event.preventDefault();

  const profileFirstNameElement = document.getElementById("profileFirstName");
  const profileLastNameElement = document.getElementById("profileLastName");
  const profilePhoneElement = document.getElementById("profilePhone");

  if (!profileFirstNameElement || !profileLastNameElement) {
    showAlert("Required form elements not found", "error");
    return;
  }

  const formData = {
    firstName: profileFirstNameElement.value.trim(),
    lastName: profileLastNameElement.value.trim(),
    phoneNumber: profilePhoneElement ? profilePhoneElement.value.trim() : "",
  };

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "PUT",
      headers: window.authHeaders,
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      currentUser = await response.json();
      updateUserDisplay();
      showAlert("Profile updated successfully", "success");
      closeModal("profileModal");
    } else {
      showAlert("Failed to update profile", "error");
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    showAlert("Network error. Please try again.", "error");
  }
}

// Handle profile image upload
async function handleProfileImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type and size
  if (!file.type.startsWith("image/")) {
    showAlert("Please select an image file", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB limit
    showAlert("Image size must be less than 5MB", "error");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/users/profile/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    });

    if (response.ok) {
      const updatedUser = await response.json();
      currentUser = updatedUser;
      updateUserDisplay();
      showAlert("Profile image updated successfully", "success");
    } else {
      showAlert("Failed to upload image", "error");
    }
  } catch (error) {
    console.error("Error uploading profile image:", error);
    showAlert("Network error. Please try again.", "error");
  }
}

// Show settings (placeholder)
function showSettings() {
  showAlert("Settings feature coming soon!", "success");
  const userDropdown = document.getElementById("userDropdown");
  if (userDropdown) {
    userDropdown.classList.remove("show");
  }
}

// Close modal
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = "none";
  }
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = "Login.html";
}

// Show alert
function showAlert(message, type) {
  const alert = document.getElementById("alertMessage");
  if (alert) {
    alert.textContent = message;
    alert.className = `alert ${type} show`;

    setTimeout(() => {
      alert.classList.remove("show");
    }, 5000);
  }
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}

// Add CSS for additional styles
const style = document.createElement("style");
style.textContent = `
    .escalated-badge {
        background: #ff6b6b;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .stat-icon.escalated {
        background: #ff6b6b;
    }
    
    .ticket-item.escalated {
        border-left: 4px solid #ff6b6b;
        background-color: #fff5f5;
    }
    
    .escalation-info {
        background: #fff3cd;
        padding: 1rem;
        border-radius: 6px;
        margin: 1rem 0;
        border-left: 4px solid #ffc107;
    }
    
    .escalation-info h4 {
        color: #856404;
        margin-bottom: 0.5rem;
    }
    
    .escalation-info p {
        color: #856404;
        margin-bottom: 0.5rem;
    }
    
    .escalation-info p:last-child {
        margin-bottom: 0;
    }
    
    .ticket-details-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e1e5e9;
    }
    
    .ticket-actions-header {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .ticket-actions-header button {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }
    
    .customer-details {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 6px;
        margin-top: 0.5rem;
    }
    
    .customer-details p {
        margin-bottom: 0.5rem;
    }
    
    .customer-details p:last-child {
        margin-bottom: 0;
    }
    
    .comment-item {
        border: 1px solid #e1e5e9;
        border-radius: 6px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .comment-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        align-items: center;
        flex-wrap: wrap;
    }
    
    .comment-type {
        background: #f0f0f0;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 500;
    }
    
    .comment-type.agent-response {
        background: #d4edda;
        color: #155724;
    }
    
    .comment-type.internal-note {
        background: #fff3cd;
        color: #856404;
    }
    
    .comment-type.system-update {
        background: #cce5ff;
        color: #004085;
    }
    
    .comment-time {
        color: #666;
        margin-left: auto;
    }
    
    .comment-content {
        color: #333;
        line-height: 1.5;
    }
    
    .attachment-item {
        margin-bottom: 0.5rem;
    }
    
    .attachment-item a {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #667eea;
        text-decoration: none;
        padding: 0.5rem;
        border: 1px solid #e1e5e9;
        border-radius: 4px;
        transition: background-color 0.3s ease;
    }
    
    .attachment-item a:hover {
        background-color: #f8f9fa;
        text-decoration: none;
    }
    
    .timeline-item {
        margin-bottom: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .timeline-item:last-child {
        border-bottom: none;
    }
    
    .rating-display {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0;
    }
    
    .rating-display .fas.fa-star {
        color: #ddd;
        font-size: 1.2rem;
    }
    
    .rating-display .fas.fa-star.rated {
        color: #ffc107;
    }
    
    .ticket-badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .performance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    
    .performance-card {
        background: white;
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        text-align: center;
    }
    
    .performance-card h4 {
        color: #333;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .performance-card .value {
        font-size: 2rem;
        font-weight: 700;
        color: #667eea;
        margin-bottom: 0.25rem;
    }
    
    .performance-card .label {
        color: #666;
        font-size: 0.8rem;
    }
    
    .performance-grade {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-weight: 600;
        font-size: 1.2rem;
    }
    
    .performance-grade.a-plus {
        background: #d4edda;
        color: #155724;
    }
    
    .performance-grade.a {
        background: #cce5ff;
        color: #004085;
    }
    
    .performance-grade.b {
        background: #fff3cd;
        color: #856404;
    }
    
    .performance-grade.c {
        background: #ffeaa7;
        color: #6c5ce7;
    }
    
    .performance-grade.d {
        background: #f8d7da;
        color: #721c24;
    }
    
    @media (max-width: 768px) {
        .ticket-details-header {
            flex-direction: column;
            gap: 1rem;
        }
        
        .ticket-actions-header {
            width: 100%;
        }
        
        .comment-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .comment-time {
            margin-left: 0;
        }
        
        .performance-grid {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);
