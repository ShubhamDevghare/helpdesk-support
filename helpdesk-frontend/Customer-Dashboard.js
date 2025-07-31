// Fixed Customer Dashboard JavaScript with proper profile update handling
// API Configuration
const API_BASE_URL = "http://localhost:8080/api";

// Global variables
let currentUser = null;
let currentPage = 0;
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

  if (!token || userRole !== "CUSTOMER") {
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
    // This will be used in fetch requests
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
    .addEventListener("change", handleProfileImageUpload);

  // Create ticket form
  document
    .getElementById("createTicketForm")
    .addEventListener("submit", handleCreateTicket);

  // Profile form
  document
    .getElementById("profileForm")
    .addEventListener("submit", handleProfileUpdate);

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
      document.getElementById("notificationsDropdown").classList.remove("show");
    }
    if (
      !event.target.closest(".user-menu") &&
      !event.target.closest(".user-dropdown")
    ) {
      document.getElementById("userDropdown").classList.remove("show");
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
      updateUserDisplay();
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
    document.getElementById(
      "userName"
    ).textContent = `${currentUser.firstName} ${currentUser.lastName}`;

    if (currentUser.profileImageUrl) {
      document.getElementById("profileImage").src = currentUser.profileImageUrl;
      document.getElementById("profileImageLarge").src =
        currentUser.profileImageUrl;
    }
  }
}

// Load dashboard data
async function loadDashboardData() {
  await Promise.all([
    loadDashboardStats(),
    loadRecentTickets(),
    loadNotifications(),
  ]);
}

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/tickets/my-tickets?size=1000`,
      {
        headers: window.authHeaders,
      }
    );

    if (response.ok) {
      const data = await response.json();
      const tickets = data.content || [];

      const stats = {
        total: tickets.length,
        open: tickets.filter((t) => t.status === "OPEN").length,
        inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
        resolved: tickets.filter((t) => t.status === "RESOLVED").length,
      };

      updateStatsDisplay(stats);
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error);
  }
}

// Update stats display
function updateStatsDisplay(stats) {
  document.getElementById("totalTickets").textContent = stats.total;
  document.getElementById("openTickets").textContent = stats.open;
  document.getElementById("inProgressTickets").textContent = stats.inProgress;
  document.getElementById("resolvedTickets").textContent = stats.resolved;
}

// Load recent tickets
async function loadRecentTickets() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/tickets/my-tickets?size=5&sortBy=createdAt&sortDir=desc`,
      {
        headers: window.authHeaders,
      }
    );

    if (response.ok) {
      const data = await response.json();
      displayRecentTickets(data.content || []);
    }
  } catch (error) {
    console.error("Error loading recent tickets:", error);
    document.getElementById("recentTicketsContainer").innerHTML =
      '<div class="loading">Error loading tickets</div>';
  }
}

// Display recent tickets
function displayRecentTickets(tickets) {
  const container = document.getElementById("recentTicketsContainer");

  if (tickets.length === 0) {
    container.innerHTML = '<div class="loading">No tickets found</div>';
    return;
  }

  const ticketsHTML = tickets
    .map(
      (ticket) => `
        <div class="ticket-item" onclick="showTicketDetails('${ticket.id}')">
            <div class="ticket-header">
                <span class="ticket-id">${ticket.ticketId}</span>
                <span class="ticket-status ${ticket.status
                  .toLowerCase()
                  .replace("_", "-")}">${ticket.status.replace("_", " ")}</span>
            </div>
            <div class="ticket-title">${ticket.title}</div>
            <div class="ticket-meta">
                <span class="ticket-category">${ticket.category.replace(
                  "_",
                  " "
                )}</span>
                <span>Created: ${formatDate(ticket.createdAt)}</span>
                ${
                  ticket.assignedAgent
                    ? `<span>Agent: ${ticket.assignedAgent.firstName} ${ticket.assignedAgent.lastName}</span>`
                    : "<span>Unassigned</span>"
                }
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = ticketsHTML;
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
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

// Toggle notifications dropdown
function toggleNotifications() {
  const dropdown = document.getElementById("notificationsDropdown");
  dropdown.classList.toggle("show");

  // Close user dropdown if open
  document.getElementById("userDropdown").classList.remove("show");
}

// Toggle user menu dropdown
function toggleUserMenu() {
  const dropdown = document.getElementById("userDropdown");
  dropdown.classList.toggle("show");

  // Close notifications dropdown if open
  document.getElementById("notificationsDropdown").classList.remove("show");
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

// Show create ticket modal
function showCreateTicket() {
  document.getElementById("createTicketModal").style.display = "block";
}

// Handle create ticket form submission
async function handleCreateTicket(event) {
  event.preventDefault();

  const formData = new FormData();
  const ticketData = {
    title: document.getElementById("ticketTitle").value.trim(),
    category: document.getElementById("ticketCategory").value,
    description: document.getElementById("ticketDescription").value.trim(),
  };

  if (!ticketData.title || !ticketData.category || !ticketData.description) {
    showAlert("Please fill in all required fields", "error");
    return;
  }

  setCreateTicketLoading(true);

  try {
    // Create ticket
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: "POST",
      headers: window.authHeaders,
      body: JSON.stringify(ticketData),
    });

    if (response.ok) {
      const ticket = await response.json();

      // Handle file attachment if present
      const fileInput = document.getElementById("ticketAttachment");
      if (fileInput.files.length > 0) {
        await uploadTicketAttachment(ticket.id, fileInput.files[0]);
      }

      showAlert("Ticket created successfully!", "success");
      closeModal("createTicketModal");
      document.getElementById("createTicketForm").reset();

      // Reload dashboard data
      loadDashboardData();
    } else {
      const error = await response.json();
      showAlert(error.message || "Failed to create ticket", "error");
    }
  } catch (error) {
    console.error("Error creating ticket:", error);
    showAlert("Network error. Please try again.", "error");
  } finally {
    setCreateTicketLoading(false);
  }
}

// Upload ticket attachment
async function uploadTicketAttachment(ticketId, file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    await fetch(`${API_BASE_URL}/tickets/${ticketId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    });
  } catch (error) {
    console.error("Error uploading attachment:", error);
  }
}

// Set create ticket loading state
function setCreateTicketLoading(isLoading) {
  const btn = document.getElementById("createTicketBtn");
  const spinner = document.getElementById("createTicketSpinner");

  if (isLoading) {
    btn.disabled = true;
    spinner.classList.add("show");
    btn.querySelector("span").textContent = "Creating...";
  } else {
    btn.disabled = false;
    spinner.classList.remove("show");
    btn.querySelector("span").textContent = "Create Ticket";
  }
}

// Show my tickets modal
function showMyTickets() {
  document.getElementById("myTicketsModal").style.display = "block";
  loadMyTickets();
}

// Load my tickets with filters
async function loadMyTickets() {
  try {
    const status = document.getElementById("statusFilter").value;
    const sortBy = document.getElementById("sortBy").value;

    let url = `${API_BASE_URL}/tickets/my-tickets?page=${currentPage}&size=10&sortBy=${sortBy}&sortDir=desc`;
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      headers: window.authHeaders,
    });

    if (response.ok) {
      const data = await response.json();
      displayMyTickets(data.content || []);
      updatePagination(data);
    }
  } catch (error) {
    console.error("Error loading my tickets:", error);
    document.getElementById("myTicketsList").innerHTML =
      '<div class="loading">Error loading tickets</div>';
  }
}

// Display my tickets
function displayMyTickets(tickets) {
  const container = document.getElementById("myTicketsList");

  if (tickets.length === 0) {
    container.innerHTML = '<div class="loading">No tickets found</div>';
    return;
  }

  const ticketsHTML = tickets
    .map(
      (ticket) => `
        <div class="ticket-item" onclick="showTicketDetails('${ticket.id}')">
            <div class="ticket-header">
                <span class="ticket-id">${ticket.ticketId}</span>
                <span class="ticket-status ${ticket.status
                  .toLowerCase()
                  .replace("_", "-")}">${ticket.status.replace("_", " ")}</span>
            </div>
            <div class="ticket-title">${ticket.title}</div>
            <div class="ticket-meta">
                <span class="ticket-category">${ticket.category.replace(
                  "_",
                  " "
                )}</span>
                <span>Priority: ${ticket.priority}</span>
                <span>Created: ${formatDate(ticket.createdAt)}</span>
                ${
                  ticket.assignedAgent
                    ? `<span>Agent: ${ticket.assignedAgent.firstName} ${ticket.assignedAgent.lastName}</span>`
                    : "<span>Unassigned</span>"
                }
            </div>
        </div>
    `
    )
    .join("");

  container.innerHTML = ticketsHTML;
}

// Update pagination
function updatePagination(data) {
  const container = document.getElementById("ticketsPagination");
  const totalPages = data.totalPages || 0;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let paginationHTML = "";

  // Previous button
  paginationHTML += `<button onclick="changePage(${currentPage - 1})" ${
    currentPage === 0 ? "disabled" : ""
  }>Previous</button>`;

  // Page numbers
  for (let i = 0; i < totalPages; i++) {
    if (i === currentPage) {
      paginationHTML += `<button class="active">${i + 1}</button>`;
    } else {
      paginationHTML += `<button onclick="changePage(${i})">${i + 1}</button>`;
    }
  }

  // Next button
  paginationHTML += `<button onclick="changePage(${currentPage + 1})" ${
    currentPage === totalPages - 1 ? "disabled" : ""
  }>Next</button>`;

  container.innerHTML = paginationHTML;
}

// Change page
function changePage(page) {
  currentPage = page;
  loadMyTickets();
}

// Filter tickets
function filterTickets() {
  currentPage = 0;
  loadMyTickets();
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
      document.getElementById("ticketDetailsModal").style.display = "block";
    }
  } catch (error) {
    console.error("Error loading ticket details:", error);
    showAlert("Failed to load ticket details", "error");
  }
}

// Display ticket details
function displayTicketDetails(ticket) {
  document.getElementById(
    "ticketDetailsTitle"
  ).textContent = `Ticket ${ticket.ticketId}`;

  const content = document.getElementById("ticketDetailsContent");
  content.innerHTML = `
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
                        <span class="ticket-category">${ticket.category.replace(
                          "_",
                          " "
                        )}</span>
                        <span>Priority: ${ticket.priority}</span>
                    </div>
                </div>
            </div>
            
            <div class="ticket-description">
                <h4>Description</h4>
                <p>${ticket.description}</p>
            </div>
            
            <div class="ticket-timeline">
                <h4>Timeline</h4>
                <div class="timeline-item">
                    <strong>Created:</strong> ${formatDate(ticket.createdAt)}
                </div>
                ${
                  ticket.assignedAgent
                    ? `
                    <div class="timeline-item">
                        <strong>Assigned to:</strong> ${ticket.assignedAgent.firstName} ${ticket.assignedAgent.lastName}
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
            </div>
            
            ${
              ticket.comments && ticket.comments.length > 0
                ? `
                <div class="ticket-comments">
                    <h4>Comments</h4>
                    ${ticket.comments
                      .map(
                        (comment) => `
                        <div class="comment-item">
                            <div class="comment-header">
                                <strong>${comment.author.firstName} ${
                          comment.author.lastName
                        }</strong>
                                <span class="comment-type">${comment.type.replace(
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
              ticket.status === "RESOLVED" && !ticket.customerRating
                ? `
                <div class="rating-section">
                    <h4>Rate this resolution</h4>
                    <div class="rating-stars">
                        ${[1, 2, 3, 4, 5]
                          .map(
                            (star) => `
                            <i class="fas fa-star rating-star" data-rating="${star}" onclick="rateTicket('${ticket.id}', ${star})"></i>
                        `
                          )
                          .join("")}
                    </div>
                    <textarea id="feedbackText" placeholder="Optional feedback..." rows="3" style="width: 100%; margin-top: 1rem; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                    <button onclick="submitRating('${
                      ticket.id
                    }')" class="btn-primary" style="margin-top: 1rem;">Submit Rating</button>
                </div>
            `
                : ""
            }
            
            ${
              ticket.customerRating
                ? `
                <div class="existing-rating">
                    <h4>Your Rating</h4>
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
            
            ${
              (ticket.status === "RESOLVED" || ticket.status === "CLOSED") &&
              !ticket.customerRating
                ? `
                <div class="ticket-actions">
                    <button onclick="reopenTicket('${ticket.id}')" class="btn-secondary">Reopen Ticket</button>
                </div>
            `
                : ""
            }
        </div>
    `;
}

// Rate ticket
function rateTicket(ticketId, rating) {
  // Update star display
  const stars = document.querySelectorAll(".rating-star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.add("rated");
    } else {
      star.classList.remove("rated");
    }
  });

  // Store rating for submission
  window.selectedRating = rating;
}

// Submit rating
async function submitRating(ticketId) {
  if (!window.selectedRating) {
    showAlert("Please select a rating", "error");
    return;
  }

  const feedback = document.getElementById("feedbackText").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/rate`, {
      method: "POST",
      headers: window.authHeaders,
      body: JSON.stringify({
        rating: window.selectedRating,
        feedback: feedback,
      }),
    });

    if (response.ok) {
      showAlert("Thank you for your feedback!", "success");
      showTicketDetails(ticketId); // Refresh ticket details
    } else {
      showAlert("Failed to submit rating", "error");
    }
  } catch (error) {
    console.error("Error submitting rating:", error);
    showAlert("Network error. Please try again.", "error");
  }
}

// Reopen ticket
async function reopenTicket(ticketId) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/reopen`, {
      method: "PUT",
      headers: window.authHeaders,
    });

    if (response.ok) {
      showAlert("Ticket reopened successfully", "success");
      showTicketDetails(ticketId); // Refresh ticket details
      loadDashboardData(); // Refresh dashboard
    } else {
      showAlert("Failed to reopen ticket", "error");
    }
  } catch (error) {
    console.error("Error reopening ticket:", error);
    showAlert("Network error. Please try again.", "error");
  }
}

// Show profile modal
function showProfile() {
  if (currentUser) {
    // Populate form with current user data
    document.getElementById("profileFirstName").value =
      currentUser.firstName || "";
    document.getElementById("profileLastName").value =
      currentUser.lastName || "";
    document.getElementById("profileEmail").value = currentUser.email || "";
    document.getElementById("profilePhone").value =
      currentUser.phoneNumber || "";
    document.getElementById("profileCompany").value =
      currentUser.companyName || "";
    document.getElementById("profileAddress").value = currentUser.address || "";

    document.getElementById("profileModal").style.display = "block";
  }

  // Close user dropdown
  document.getElementById("userDropdown").classList.remove("show");
}

// Handle profile update - FIXED VERSION
async function handleProfileUpdate(event) {
  event.preventDefault();

  // Create a clean request object with only the fields that can be updated
  const formData = {
    firstName: document.getElementById("profileFirstName").value.trim(),
    lastName: document.getElementById("profileLastName").value.trim(),
    phoneNumber: document.getElementById("profilePhone").value.trim() || null,
    companyName: document.getElementById("profileCompany").value.trim() || null,
    address: document.getElementById("profileAddress").value.trim() || null,
  };

  // Remove empty strings and convert to null
  Object.keys(formData).forEach((key) => {
    if (formData[key] === "") {
      formData[key] = null;
    }
  });

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
      const errorData = await response.json();
      console.error("Profile update error:", errorData);
      showAlert(errorData.message || "Failed to update profile", "error");
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
  document.getElementById("userDropdown").classList.remove("show");
}

// Show knowledge base (placeholder)
function showKnowledgeBase() {
  showAlert("Knowledge base feature coming soon!", "success");
}

// Show contact support (placeholder)
function showContactSupport() {
  showAlert("Contact support feature coming soon!", "success");
}

// Close modal
function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

// Logout
function logout() {
  localStorage.clear();
  window.location.href = "Login.html";
}

// Show alert
function showAlert(message, type) {
  const alert = document.getElementById("alertMessage");
  alert.textContent = message;
  alert.className = `alert ${type} show`;

  setTimeout(() => {
    alert.classList.remove("show");
  }, 5000);
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

// Add CSS for rating stars
const style = document.createElement("style");
style.textContent = `
    .rating-stars {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
    }
    
    .rating-star {
        font-size: 1.5rem;
        color: #ddd;
        cursor: pointer;
        transition: color 0.3s ease;
    }
    
    .rating-star:hover,
    .rating-star.rated {
        color: #ffc107;
    }
    
    .rating-display {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .rating-display .fas.fa-star {
        color: #ddd;
    }
    
    .rating-display .fas.fa-star.rated {
        color: #ffc107;
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
    }
    
    .comment-type {
        background: #f0f0f0;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        text-transform: uppercase;
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
    }
    
    .attachment-item a:hover {
        text-decoration: underline;
    }
    
    .ticket-actions {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e1e5e9;
    }
    
    .timeline-item {
        margin-bottom: 0.5rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .timeline-item:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);
