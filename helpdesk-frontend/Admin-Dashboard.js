// API Configuration
const API_BASE_URL = "http://localhost:8080/api"

// Global variables
let currentUser = null
const currentPage = {
  users: 0,
  tickets: 0,
  agents: 0,
  customers: 0,
}
const pageSize = 10

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication()
  initializeEventListeners()
  loadDashboardData()
  showSection("dashboard")
})

// Check if user is authenticated and is admin
function checkAuthentication() {
  const token = localStorage.getItem("authToken")
  const userRole = localStorage.getItem("userRole")

  if (!token || userRole !== "ADMIN") {
    window.location.href = "Login.html"
    return
  }

  // Set up API headers
  setupAPIHeaders()
  loadUserInfo()
}

// Setup API headers with auth token
function setupAPIHeaders() {
  const token = localStorage.getItem("authToken")
  if (token) {
    window.authHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const section = item.dataset.section
      showSection(section)

      // Update active nav item
      document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"))
      item.classList.add("active")
    })
  })

  // Forms
  document.getElementById("createUserForm").addEventListener("submit", handleCreateUser)
  document.getElementById("createAgentForm").addEventListener("submit", handleCreateAgent)
  document.getElementById("updateAgentForm").addEventListener("submit", handleUpdateAgent)
  document.getElementById("updateUserStatusForm").addEventListener("submit", handleUpdateUserStatus)
  document.getElementById("reassignTicketForm").addEventListener("submit", handleReassignTicket)
  document.getElementById("escalateTicketForm").addEventListener("submit", handleEscalateTicket)
  document.getElementById("profileForm").addEventListener("submit", handleProfileUpdate)

  // Profile image upload
  document.getElementById("profileImageInput").addEventListener("change", handleProfileImageUpload)

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    const modals = document.querySelectorAll(".modal")
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  })

  // Close dropdowns when clicking outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".notifications") && !event.target.closest(".notifications-dropdown")) {
      document.getElementById("notificationsDropdown").classList.remove("show")
    }
    if (!event.target.closest(".user-menu") && !event.target.closest(".user-dropdown")) {
      document.getElementById("userDropdown").classList.remove("show")
    }
  })
}

// Load user information
async function loadUserInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      currentUser = await response.json()
      updateUserDisplay()
    } else {
      console.error("Failed to load user info")
    }
  } catch (error) {
    console.error("Error loading user info:", error)
  }
}

// Update user display in header
function updateUserDisplay() {
  if (currentUser) {
    document.getElementById("userName").textContent = `${currentUser.firstName} ${currentUser.lastName}`

    if (currentUser.profileImageUrl) {
      document.getElementById("profileImage").src = currentUser.profileImageUrl
      document.getElementById("profileImageLarge").src = currentUser.profileImageUrl
    }

    // Populate profile form
    document.getElementById("profileFirstName").value = currentUser.firstName || ""
    document.getElementById("profileLastName").value = currentUser.lastName || ""
    document.getElementById("profileEmail").value = currentUser.email || ""
    document.getElementById("profilePhone").value = currentUser.phoneNumber || ""
  }
}

// Show section
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active")
  })

  // Show selected section
  const targetSection = document.getElementById(`${sectionName}-section`)
  if (targetSection) {
    targetSection.classList.add("active")
  }

  // Load section-specific data
  switch (sectionName) {
    case "dashboard":
      loadDashboardData()
      break
    case "users":
      loadUsers()
      break
    case "tickets":
      loadTickets()
      break
    case "agents":
      loadAgents()
      break
    case "customers":
      loadCustomers()
      break
    case "escalated":
      loadEscalatedTickets()
      break
    case "reports":
      // Reports are loaded on demand
      break
    case "settings":
      // Settings are already populated
      break
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const stats = await response.json()
      updateDashboardStats(stats)
    }
  } catch (error) {
    console.error("Error loading dashboard stats:", error)
  }

  // Load recent activity
  loadRecentActivity()
  loadNotifications()
}

// Update dashboard statistics
function updateDashboardStats(stats) {
  document.getElementById("totalUsers").textContent = stats.totalUsers || 0
  document.getElementById("totalTickets").textContent = stats.totalTickets || 0
  document.getElementById("activeAgents").textContent = stats.totalAgents || 0
  document.getElementById("escalatedTickets").textContent = stats.escalatedTickets || 0
  document.getElementById("satisfactionRate").textContent = `${stats.satisfactionRate || 0}%`
}

// Load escalated tickets - FIXED: Use correct admin ID parameter
async function loadEscalatedTickets() {
  const container = document.getElementById("escalatedTicketsContainer")
  container.innerHTML = '<div class="loading">Loading escalated tickets...</div>'

  try {
    // Get admin user ID from localStorage or current user
    const adminId = localStorage.getItem("userId") || (currentUser ? currentUser.id : null)

    if (!adminId) {
      container.innerHTML = '<div class="loading">Admin ID not found</div>'
      return
    }

    const response = await fetch(`${API_BASE_URL}/admin/escalated-tickets?adminId=${adminId}`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      displayEscalatedTickets(data.content || [])
    } else {
      container.innerHTML = '<div class="loading">Error loading escalated tickets</div>'
    }
  } catch (error) {
    console.error("Error loading escalated tickets:", error)
    container.innerHTML = '<div class="loading">Error loading escalated tickets</div>'
  }
}

// Display escalated tickets - FIXED: Use correct ticket ID for actions
function displayEscalatedTickets(tickets) {
  const container = document.getElementById("escalatedTicketsContainer")

  if (tickets.length === 0) {
    container.innerHTML = '<div class="loading">No escalated tickets</div>'
    return
  }

  const ticketsHTML = tickets
    .map(
      (ticket) => `
        <div class="ticket-item escalated" onclick="viewTicketDetails(${ticket.id})">
            <div class="ticket-header">
                <span class="ticket-id">${ticket.ticketId}</span>
                <div class="ticket-badges">
                    <span class="ticket-priority ${ticket.priority.toLowerCase()}">${ticket.priority}</span>
                    <span class="ticket-status ${ticket.status
                      .toLowerCase()
                      .replace("_", "-")}">${ticket.status.replace("_", " ")}</span>
                    <span class="escalated-badge">Escalated from Agent</span>
                </div>
            </div>
            <div class="ticket-title">${ticket.title}</div>
            <div class="ticket-meta">
                <span class="ticket-category">${ticket.category.replace("_", " ")}</span>
                <span class="ticket-customer">Customer: ${ticket.customer.firstName} ${ticket.customer.lastName}</span>
                <span>Agent: ${
                  ticket.assignedAgent
                    ? `${ticket.assignedAgent.firstName} ${ticket.assignedAgent.lastName}`
                    : "Unassigned"
                }</span>
                <span>Escalated: ${formatDate(ticket.escalatedAt)}</span>
                ${ticket.escalationReason ? `<span>Reason: ${ticket.escalationReason}</span>` : ""}
            </div>
            <div class="ticket-actions">
                <button class="action-btn-small view" onclick="event.stopPropagation(); viewTicketDetails(${
                  ticket.id
                })" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn-small edit" onclick="event.stopPropagation(); showEscalateTicketToAgent('${
                  ticket.ticketId
                }')" title="Escalate to Agent">
                    <i class="fas fa-user-tie"></i>
                </button>
                <button class="action-btn-small edit" onclick="event.stopPropagation(); showReassignTicket(${
                  ticket.id
                })" title="Reassign">
                    <i class="fas fa-user-edit"></i>
                </button>
            </div>
        </div>
    `,
    )
    .join("")

  container.innerHTML = ticketsHTML
}

// Load recent activity
async function loadRecentActivity() {
  const activityContainer = document.getElementById("recentActivity")

  // Mock recent activity data - in real implementation, this would come from an API
  const activities = [
    {
      type: "ticket",
      icon: "fas fa-ticket-alt",
      title: "New ticket created",
      description: "TKT-2024001 - Login issues reported by customer",
      time: "5 minutes ago",
    },
    {
      type: "user",
      icon: "fas fa-user-plus",
      title: "New agent registered",
      description: "John Smith joined the Technical Support team",
      time: "15 minutes ago",
    },
    {
      type: "ticket",
      icon: "fas fa-check-circle",
      title: "Ticket resolved",
      description: "TKT-2024000 - Password reset issue resolved",
      time: "30 minutes ago",
    },
    {
      type: "agent",
      icon: "fas fa-exclamation-triangle",
      title: "Ticket escalated",
      description: "TKT-2023999 - Billing issue escalated to admin",
      time: "1 hour ago",
    },
  ]

  const activityHTML = activities
    .map(
      (activity) => `
    <div class="activity-item">
      <div class="activity-icon ${activity.type}">
        <i class="${activity.icon}"></i>
      </div>
      <div class="activity-info">
        <h4>${activity.title}</h4>
        <p>${activity.description}</p>
      </div>
      <div class="activity-time">${activity.time}</div>
    </div>
  `,
    )
    .join("")

  activityContainer.innerHTML = activityHTML
}

// Load users - FIXED: Use correct API endpoint
async function loadUsers(page = 0) {
  const tableBody = document.getElementById("usersTableBody")
  tableBody.innerHTML = '<tr><td colspan="6" class="loading">Loading users...</td></tr>'

  try {
    const role = document.getElementById("userRoleFilter").value
    const status = document.getElementById("userStatusFilter").value
    const searchTerm = document.getElementById("userSearchInput").value

    let url = `${API_BASE_URL}/admin/users?page=${page}&size=${pageSize}&sortBy=createdAt&sortDir=desc`

    if (role) url += `&role=${role}`
    if (status) url += `&status=${status}`
    if (searchTerm) {
      url = `${API_BASE_URL}/admin/users/search?searchTerm=${encodeURIComponent(searchTerm)}&page=${page}&size=${pageSize}`
      if (role) url += `&role=${role}`
      if (status) url += `&status=${status}`
    }

    const response = await fetch(url, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      displayUsers(data.content || [])
      updatePagination("users", data.totalPages, page)
      currentPage.users = page
    } else {
      tableBody.innerHTML = '<tr><td colspan="6" class="loading">Error loading users</td></tr>'
    }
  } catch (error) {
    console.error("Error loading users:", error)
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">Error loading users</td></tr>'
  }
}

// Display users in table
function displayUsers(users) {
  const tableBody = document.getElementById("usersTableBody")

  if (users.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="6" class="loading">No users found</td></tr>'
    return
  }

  const usersHTML = users
    .map(
      (user) => `
    <tr>
      <td>${user.firstName} ${user.lastName}</td>
      <td>${user.email}</td>
      <td><span class="status-badge ${user.role.toLowerCase()}">${user.role}</span></td>
      <td><span class="status-badge ${user.status.toLowerCase()}">${user.status}</span></td>
      <td>${formatDate(user.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn-small edit" onclick="showUpdateUserStatus(${
            user.id
          }, '${user.status}')" title="Update Status">
            <i class="fas fa-toggle-on"></i>
          </button>
          <button class="action-btn-small view" onclick="viewUserDetails(${user.id})" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn-small delete" onclick="deleteUser(${user.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("")

  tableBody.innerHTML = usersHTML
}

// Load tickets - FIXED: Use correct API endpoint
async function loadTickets(page = 0) {
  const tableBody = document.getElementById("ticketsTableBody")
  tableBody.innerHTML = '<tr><td colspan="8" class="loading">Loading tickets...</td></tr>'

  try {
    const status = document.getElementById("ticketStatusFilter").value
    const priority = document.getElementById("ticketPriorityFilter").value
    const searchTerm = document.getElementById("ticketSearchInput").value

    let url = `${API_BASE_URL}/admin/tickets?page=${page}&size=${pageSize}&sortBy=createdAt&sortDir=desc`

    if (status) url += `&status=${status}`
    if (priority) url += `&priority=${priority}`
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`

    const response = await fetch(url, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      displayTickets(data.content || [])
      updatePagination("tickets", data.totalPages, page)
      currentPage.tickets = page
    } else {
      tableBody.innerHTML = '<tr><td colspan="8" class="loading">Error loading tickets</td></tr>'
    }
  } catch (error) {
    console.error("Error loading tickets:", error)
    tableBody.innerHTML = '<tr><td colspan="8" class="loading">Error loading tickets</td></tr>'
  }
}

// Display tickets in table - FIXED: Use correct ticket ID for actions
function displayTickets(tickets) {
  const tableBody = document.getElementById("ticketsTableBody")

  if (tickets.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="loading">No tickets found</td></tr>'
    return
  }

  const ticketsHTML = tickets
    .map(
      (ticket) => `
    <tr>
      <td><strong>${ticket.ticketId}</strong></td>
      <td>${ticket.title}</td>
      <td>${ticket.customer.firstName} ${ticket.customer.lastName}</td>
      <td>${
        ticket.assignedAgent ? `${ticket.assignedAgent.firstName} ${ticket.assignedAgent.lastName}` : "Unassigned"
      }</td>
      <td><span class="priority-badge ${ticket.priority.toLowerCase()}">${ticket.priority}</span></td>
      <td><span class="status-badge ${ticket.status
        .toLowerCase()
        .replace("_", "-")}">${ticket.status.replace("_", " ")}</span></td>
      <td>${formatDate(ticket.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn-small view" onclick="viewTicketDetails(${ticket.id})" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn-small edit" onclick="showReassignTicket(${ticket.id})" title="Reassign">
            <i class="fas fa-user-edit"></i>
          </button>
          <button class="action-btn-small edit" onclick="showEscalateTicketToAgent('${
            ticket.ticketId
          }')" title="Escalate to Agent">
            <i class="fas fa-arrow-up"></i>
          </button>
          <button class="action-btn-small delete" onclick="deleteTicket(${ticket.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("")

  tableBody.innerHTML = ticketsHTML
}

// Load agents
async function loadAgents(page = 0) {
  const agentsGrid = document.getElementById("agentsGrid")
  agentsGrid.innerHTML = '<div class="loading">Loading agents...</div>'

  try {
    const department = document.getElementById("agentDepartmentFilter").value
    const searchTerm = document.getElementById("agentSearchInput").value

    let url = `${API_BASE_URL}/admin/agents?page=${page}&size=${pageSize}&sortBy=createdAt&sortDir=desc`

    if (searchTerm) {
      url = `${API_BASE_URL}/admin/agents/search?searchTerm=${encodeURIComponent(
        searchTerm,
      )}&page=${page}&size=${pageSize}`
    }

    const response = await fetch(url, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      displayAgents(data.content || [])
      updatePagination("agents", data.totalPages, page)
      currentPage.agents = page
    } else {
      agentsGrid.innerHTML = '<div class="loading">Error loading agents</div>'
    }
  } catch (error) {
    console.error("Error loading agents:", error)
    agentsGrid.innerHTML = '<div class="loading">Error loading agents</div>'
  }
}

// Display agents in grid
function displayAgents(agents) {
  const agentsGrid = document.getElementById("agentsGrid")

  if (agents.length === 0) {
    agentsGrid.innerHTML = '<div class="loading">No agents found</div>'
    return
  }

  const agentsHTML = agents
    .map(
      (agent) => `
    <div class="agent-card">
      <div class="agent-header">
        <img src="${agent.profileImageUrl || "/placeholder.svg?height=60&width=60"}" alt="Agent" class="agent-avatar">
        <div class="agent-info">
          <h3>${agent.firstName} ${agent.lastName}</h3>
          <p>${agent.employeeId || "N/A"}</p>
        </div>
      </div>
      <div class="agent-details">
        <div class="agent-detail">
          <span>Email:</span>
          <strong>${agent.email}</strong>
        </div>
        <div class="agent-detail">
          <span>Departments:</span>
          <strong>${
            Array.isArray(agent.departments) ? agent.departments.join(", ") : agent.departments || "N/A"
          }</strong>
        </div>
        <div class="agent-detail">
          <span>Status:</span>
          <strong class="status-badge ${agent.status.toLowerCase()}">${agent.status}</strong>
        </div>
        <div class="agent-detail">
          <span>Joined:</span>
          <strong>${formatDate(agent.createdAt)}</strong>
        </div>
      </div>
      <div class="agent-actions">
        <button class="action-btn-small view" onclick="viewAgentTickets(${agent.id})" title="View Tickets">
          <i class="fas fa-ticket-alt"></i>
        </button>
        <button class="action-btn-small edit" onclick="showUpdateAgent(${agent.id})" title="Update Agent">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn-small edit" onclick="showUpdateUserStatus(${
          agent.id
        }, '${agent.status}')" title="Update Status">
          <i class="fas fa-toggle-on"></i>
        </button>
      </div>
    </div>
  `,
    )
    .join("")

  agentsGrid.innerHTML = agentsHTML
}

// Load customers
async function loadCustomers(page = 0) {
  const tableBody = document.getElementById("customersTableBody")
  tableBody.innerHTML = '<tr><td colspan="7" class="loading">Loading customers...</td></tr>'

  try {
    const searchTerm = document.getElementById("customerSearchInput").value

    let url = `${API_BASE_URL}/admin/customers?page=${page}&size=${pageSize}&sortBy=createdAt&sortDir=desc`

    if (searchTerm) {
      url = `${API_BASE_URL}/admin/customers/search?searchTerm=${encodeURIComponent(
        searchTerm,
      )}&page=${page}&size=${pageSize}`
    }

    const response = await fetch(url, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      displayCustomers(data.content || [])
      updatePagination("customers", data.totalPages, page)
      currentPage.customers = page
    } else {
      tableBody.innerHTML = '<tr><td colspan="7" class="loading">Error loading customers</td></tr>'
    }
  } catch (error) {
    console.error("Error loading customers:", error)
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Error loading customers</td></tr>'
  }
}

// Display customers in table
function displayCustomers(customers) {
  const tableBody = document.getElementById("customersTableBody")

  if (customers.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">No customers found</td></tr>'
    return
  }

  const customersHTML = customers
    .map(
      (customer) => `
    <tr>
      <td>${customer.firstName} ${customer.lastName}</td>
      <td>${customer.email}</td>
      <td>${customer.companyName || "N/A"}</td>
      <td>-</td>
      <td>-</td>
      <td><span class="status-badge ${customer.status.toLowerCase()}">${customer.status}</span></td>
      <td>
        <div class="action-buttons">
          <button class="action-btn-small view" onclick="viewCustomerTickets(${customer.id})" title="View Tickets">
            <i class="fas fa-ticket-alt"></i>
          </button>
          <button class="action-btn-small edit" onclick="showUpdateUserStatus(${
            customer.id
          }, '${customer.status}')" title="Update Status">
            <i class="fas fa-toggle-on"></i>
          </button>
          <button class="action-btn-small edit" onclick="editCustomer(${customer.id})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </td>
    </tr>
  `,
    )
    .join("")

  tableBody.innerHTML = customersHTML
}

// Load notifications
async function loadNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications?size=10`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      displayNotifications(data.content || [])

      // Update notification badge
      const unreadCount = data.content.filter((n) => !n.isRead).length
      updateNotificationBadge(unreadCount)
    }
  } catch (error) {
    console.error("Error loading notifications:", error)
  }
}

// Display notifications
function displayNotifications(notifications) {
  const container = document.getElementById("notificationsList")

  if (notifications.length === 0) {
    container.innerHTML = '<div class="no-notifications">No new notifications</div>'
    return
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
  `,
    )
    .join("")

  container.innerHTML = notificationsHTML
}

// Update notification badge
function updateNotificationBadge(count) {
  const badge = document.getElementById("notificationBadge")
  badge.textContent = count
  badge.style.display = count > 0 ? "flex" : "none"
}

// Toggle notifications dropdown
function toggleNotifications() {
  const dropdown = document.getElementById("notificationsDropdown")
  dropdown.classList.toggle("show")

  // Close user dropdown if open
  document.getElementById("userDropdown").classList.remove("show")
}

// Toggle user menu dropdown
function toggleUserMenu() {
  const dropdown = document.getElementById("userDropdown")
  dropdown.classList.toggle("show")

  // Close notifications dropdown if open
  document.getElementById("notificationsDropdown").classList.remove("show")
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
  try {
    await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: window.authHeaders,
    })

    // Reload notifications
    loadNotifications()
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

// Mark all notifications as read
async function markAllAsRead() {
  try {
    await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: "PUT",
      headers: window.authHeaders,
    })

    // Reload notifications
    loadNotifications()
    showAlert("All notifications marked as read", "success")
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    showAlert("Failed to mark notifications as read", "error")
  }
}

// Filter functions
function filterUsers() {
  loadUsers(0)
}

function filterTickets() {
  loadTickets(0)
}

function filterAgents() {
  loadAgents(0)
}

// Search functions
function searchUsers() {
  loadUsers(0)
}

function searchTickets() {
  loadTickets(0)
}

function searchAgents() {
  loadAgents(0)
}

function searchCustomers() {
  loadCustomers(0)
}

// Search key press handlers
function handleUserSearchKeyPress(event) {
  if (event.key === "Enter") {
    searchUsers()
  }
}

function handleTicketSearchKeyPress(event) {
  if (event.key === "Enter") {
    searchTickets()
  }
}

function handleAgentSearchKeyPress(event) {
  if (event.key === "Enter") {
    searchAgents()
  }
}

function handleCustomerSearchKeyPress(event) {
  if (event.key === "Enter") {
    searchCustomers()
  }
}

function handleGlobalSearchKeyPress(event) {
  if (event.key === "Enter") {
    performGlobalSearch()
  }
}

// Global search - FIXED: Use correct ticket search endpoint
function performGlobalSearch() {
  const searchTerm = document.getElementById("globalSearch").value.trim()
  if (!searchTerm) {
    showAlert("Please enter a search term", "warning")
    return
  }

  // Check if it looks like a ticket ID
  if (searchTerm.startsWith("TKT-")) {
    searchTicketByTicketId(searchTerm)
  } else {
    // Search in current section
    const activeSection = document.querySelector(".nav-item.active").dataset.section
    switch (activeSection) {
      case "users":
        document.getElementById("userSearchInput").value = searchTerm
        searchUsers()
        break
      case "tickets":
        document.getElementById("ticketSearchInput").value = searchTerm
        searchTickets()
        break
      case "agents":
        document.getElementById("agentSearchInput").value = searchTerm
        searchAgents()
        break
      case "customers":
        document.getElementById("customerSearchInput").value = searchTerm
        searchCustomers()
        break
      default:
        showAlert("Please select a section to search in", "info")
    }
  }
}

// Search ticket by ticket ID - FIXED: Use correct API endpoint
async function searchTicketByTicketId(ticketId) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/by-ticket-id/${ticketId}`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const ticket = await response.json()
      viewTicketDetails(ticket.id)
      document.getElementById("globalSearch").value = ""
    } else {
      showAlert("Ticket not found", "error")
    }
  } catch (error) {
    console.error("Error searching ticket:", error)
    showAlert("Error searching ticket", "error")
  }
}

// Modal functions
function showCreateUserModal() {
  document.getElementById("createUserModal").style.display = "block"
}

function showCreateAgentModal() {
  document.getElementById("createAgentModal").style.display = "block"
}

function showUpdateAgent(agentId) {
  // Load agent data and populate form
  loadAgentForUpdate(agentId)
  document.getElementById("updateAgentModal").style.display = "block"
}

function showUpdateUserStatus(userId, currentStatus) {
  document.getElementById("updateStatusUserId").value = userId
  document.getElementById("newUserStatus").value = currentStatus
  document.getElementById("updateUserStatusModal").style.display = "block"
}

// FIXED: Use correct ticket ID parameter for reassign
function showReassignTicket(ticketId) {
  document.getElementById("reassignTicketId").value = ticketId
  loadAgentsForReassign()
  document.getElementById("reassignTicketModal").style.display = "block"
}

// FIXED: Use ticketId (string) for escalation
function showEscalateTicketToAgent(ticketId) {
  document.getElementById("escalateTicketId").value = ticketId
  loadAgentsForEscalation()
  document.getElementById("escalateTicketModal").style.display = "block"
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
}

// Toggle role-specific fields in create user modal
function toggleRoleFields() {
  const role = document.getElementById("userRole").value
  const customerFields = document.getElementById("customerFields")
  const agentFields = document.getElementById("agentFields")

  customerFields.style.display = role === "CUSTOMER" ? "block" : "none"
  agentFields.style.display = role === "AGENT" ? "block" : "none"
}

// Handle create user
async function handleCreateUser(event) {
  event.preventDefault()

  const formData = {
    firstName: document.getElementById("userFirstName").value.trim(),
    lastName: document.getElementById("userLastName").value.trim(),
    email: document.getElementById("userEmail").value.trim(),
    password: document.getElementById("userPassword").value,
    phoneNumber: document.getElementById("userPhone").value.trim(),
    role: document.getElementById("userRole").value,
  }

  // Add role-specific fields
  if (formData.role === "CUSTOMER") {
    formData.companyName = document.getElementById("userCompany").value.trim()
    formData.address = document.getElementById("userAddress").value.trim()
  } else if (formData.role === "AGENT") {
    formData.employeeId = document.getElementById("userEmployeeId").value.trim()

    // Get selected departments
    const departmentCheckboxes = document.querySelectorAll('input[name="userDepartments"]:checked')
    formData.departments = Array.from(departmentCheckboxes).map((cb) => cb.value)
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: window.authHeaders,
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      showAlert("User created successfully", "success")
      closeModal("createUserModal")
      document.getElementById("createUserForm").reset()
      loadUsers()
    } else {
      const error = await response.json()
      showAlert(error.message || "Failed to create user", "error")
    }
  } catch (error) {
    console.error("Error creating user:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Handle create agent
async function handleCreateAgent(event) {
  event.preventDefault()

  // Get selected departments
  const departmentCheckboxes = document.querySelectorAll('input[name="agentDepartments"]:checked')
  const departments = Array.from(departmentCheckboxes).map((cb) => cb.value)

  const formData = {
    firstName: document.getElementById("agentFirstName").value.trim(),
    lastName: document.getElementById("agentLastName").value.trim(),
    email: document.getElementById("agentEmail").value.trim(),
    password: document.getElementById("agentPassword").value,
    phoneNumber: document.getElementById("agentPhone").value.trim(),
    employeeId: document.getElementById("agentEmployeeId").value.trim(),
    departments: departments,
    role: "AGENT",
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/agents`, {
      method: "POST",
      headers: window.authHeaders,
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      showAlert("Agent created successfully", "success")
      closeModal("createAgentModal")
      document.getElementById("createAgentForm").reset()
      loadAgents()
    } else {
      const error = await response.json()
      showAlert(error.message || "Failed to create agent", "error")
    }
  } catch (error) {
    console.error("Error creating agent:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Load agent for update - FIXED: Use correct API endpoint
async function loadAgentForUpdate(agentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${agentId}`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const agent = await response.json()

      // Populate form
      document.getElementById("updateAgentId").value = agent.id
      document.getElementById("updateAgentFirstName").value = agent.firstName || ""
      document.getElementById("updateAgentLastName").value = agent.lastName || ""
      document.getElementById("updateAgentPhone").value = agent.phoneNumber || ""
      document.getElementById("updateAgentStatus").value = agent.agentStatus || "ONLINE"
      document.getElementById("updateUserStatus").value = agent.status || "ACTIVE"

      // Handle departments
      const departmentCheckboxes = document.querySelectorAll('input[name="updateAgentDepartments"]')
      departmentCheckboxes.forEach((checkbox) => {
        checkbox.checked = agent.departments && agent.departments.includes(checkbox.value)
      })
    }
  } catch (error) {
    console.error("Error loading agent for update:", error)
    showAlert("Failed to load agent details", "error")
  }
}

// Handle update agent
async function handleUpdateAgent(event) {
  event.preventDefault()

  const agentId = document.getElementById("updateAgentId").value

  // Get selected departments
  const departmentCheckboxes = document.querySelectorAll('input[name="updateAgentDepartments"]:checked')
  const departments = Array.from(departmentCheckboxes).map((cb) => cb.value)

  const updateData = {
    firstName: document.getElementById("updateAgentFirstName").value.trim(),
    lastName: document.getElementById("updateAgentLastName").value.trim(),
    phoneNumber: document.getElementById("updateAgentPhone").value.trim(),
    departments: departments,
    agentStatus: document.getElementById("updateAgentStatus").value,
    userStatus: document.getElementById("updateUserStatus").value,
  }

  // Remove empty fields
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === "" || (Array.isArray(updateData[key]) && updateData[key].length === 0)) {
      delete updateData[key]
    }
  })

  try {
    const response = await fetch(`${API_BASE_URL}/admin/agents/${agentId}`, {
      method: "PUT",
      headers: window.authHeaders,
      body: JSON.stringify(updateData),
    })

    if (response.ok) {
      showAlert("Agent updated successfully", "success")
      closeModal("updateAgentModal")
      loadAgents()
    } else {
      showAlert("Failed to update agent", "error")
    }
  } catch (error) {
    console.error("Error updating agent:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Handle update user status
async function handleUpdateUserStatus(event) {
  event.preventDefault()

  const userId = document.getElementById("updateStatusUserId").value
  const newStatus = document.getElementById("newUserStatus").value

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status?status=${newStatus}`, {
      method: "PUT",
      headers: window.authHeaders,
    })

    if (response.ok) {
      showAlert("User status updated successfully", "success")
      closeModal("updateUserStatusModal")

      // Reload appropriate section
      const activeSection = document.querySelector(".nav-item.active").dataset.section
      switch (activeSection) {
        case "users":
          loadUsers()
          break
        case "agents":
          loadAgents()
          break
        case "customers":
          loadCustomers()
          break
      }
    } else {
      showAlert("Failed to update user status", "error")
    }
  } catch (error) {
    console.error("Error updating user status:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Load agents for reassign dropdown
async function loadAgentsForReassign() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/agents?size=100`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      const select = document.getElementById("newAgentSelect")

      select.innerHTML =
        '<option value="">Select Agent</option>' +
        data.content
          .map(
            (agent) =>
              `<option value="${agent.id}">${agent.firstName} ${agent.lastName} (${agent.employeeId})</option>`,
          )
          .join("")
    }
  } catch (error) {
    console.error("Error loading agents for reassign:", error)
  }
}

// Load agents for escalation dropdown
async function loadAgentsForEscalation() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/agents?size=100`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      const select = document.getElementById("escalateAgentSelect")

      select.innerHTML =
        '<option value="">Select Agent</option>' +
        data.content
          .map(
            (agent) =>
              `<option value="${agent.id}">${agent.firstName} ${agent.lastName} (${agent.employeeId})</option>`,
          )
          .join("")
    }
  } catch (error) {
    console.error("Error loading agents for escalation:", error)
  }
}

// Handle reassign ticket - FIXED: Use correct ticket ID
async function handleReassignTicket(event) {
  event.preventDefault()

  const ticketId = document.getElementById("reassignTicketId").value
  const agentId = document.getElementById("newAgentSelect").value

  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign?agentId=${agentId}`, {
      method: "PUT",
      headers: window.authHeaders,
    })

    if (response.ok) {
      showAlert("Ticket reassigned successfully", "success")
      closeModal("reassignTicketModal")
      loadTickets()
    } else {
      showAlert("Failed to reassign ticket", "error")
    }
  } catch (error) {
    console.error("Error reassigning ticket:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Handle escalate ticket to agent 
async function handleEscalateTicket(event) {
  event.preventDefault()

  const ticketId = document.getElementById("escalateTicketId").value
  const agentId = document.getElementById("escalateAgentSelect").value
  const reason = document.getElementById("escalationReason").value.trim()
  try {
    // Get admin ID from localStorage or current user
    const adminId = localStorage.getItem("userId") || (currentUser ? currentUser.id : null)

    const response = await fetch(`${API_BASE_URL}/admin/tickets/${ticketId}/escalate-to-agent?adminId=${adminId}`, {
      method: "POST",
      headers: window.authHeaders,
      body: JSON.stringify({
        escalationReason: reason,
        escalateToAdminId :adminId,
        escalateToAgentId :agentId,
      }),
    })

    if (response.ok) {
      showAlert("Ticket escalated to agent successfully", "success")
      closeModal("escalateTicketModal")
      loadEscalatedTickets()
    } else {
      showAlert("Failed to escalate ticket", "error")
    }
  } catch (error) {
    console.error("Error escalating ticket:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// View ticket details - FIXED: Use correct ticket ID
async function viewTicketDetails(ticketId) {
  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const ticket = await response.json()
      displayTicketDetailsModal(ticket)
      document.getElementById("ticketDetailsModal").style.display = "block"
    }
  } catch (error) {
    console.error("Error loading ticket details:", error)
    showAlert("Failed to load ticket details", "error")
  }
}

// Display ticket details in modal
function displayTicketDetailsModal(ticket) {
  document.getElementById("ticketDetailsTitle").textContent = `Ticket ${ticket.ticketId}`

  const content = document.getElementById("ticketDetailsContent")
  content.innerHTML = `
    <div style="padding: 2rem;">
      <div class="ticket-details-header">
        <div class="ticket-info">
          <h3>${ticket.title}</h3>
          <div class="ticket-meta">
            <span class="status-badge ${ticket.status
              .toLowerCase()
              .replace("_", "-")}">${ticket.status.replace("_", " ")}</span>
            <span class="priority-badge ${ticket.priority.toLowerCase()}">${ticket.priority}</span>
            <span class="ticket-category">${ticket.category.replace("_", " ")}</span>
            ${ticket.escalatedToAdmin ? '<span class="escalated-badge">Escalated to Admin</span>' : ""}
            ${ticket.escalatedToAgent ? '<span class="escalated-badge">Escalated to Agent</span>' : ""}
          </div>
        </div>
      </div>
      
      <div class="ticket-description">
        <h4>Description</h4>
        <p>${ticket.description}</p>
      </div>
      
      <div class="ticket-customer-info">
        <h4>Customer Information</h4>
        <div class="customer-details">
          <p><strong>Name:</strong> ${ticket.customer.firstName} ${ticket.customer.lastName}</p>
          <p><strong>Email:</strong> ${ticket.customer.email}</p>
          ${ticket.customer.phoneNumber ? `<p><strong>Phone:</strong> ${ticket.customer.phoneNumber}</p>` : ""}
          ${ticket.customer.companyName ? `<p><strong>Company:</strong> ${ticket.customer.companyName}</p>` : ""}
        </div>
      </div>
      
      ${
        ticket.assignedAgent
          ? `
        <div class="ticket-agent-info">
          <h4>Assigned Agent</h4>
          <div class="agent-details">
            <p><strong>Name:</strong> ${ticket.assignedAgent.firstName} ${ticket.assignedAgent.lastName}</p>
            <p><strong>Email:</strong> ${ticket.assignedAgent.email}</p>
            <p><strong>Employee ID:</strong> ${ticket.assignedAgent.employeeId || "N/A"}</p>
            <p><strong>Departments:</strong> ${
              Array.isArray(ticket.assignedAgent.departments)
                ? ticket.assignedAgent.departments.join(", ")
                : ticket.assignedAgent.departments || "N/A"
            }</p>
          </div>
        </div>
      `
          : '<div class="ticket-agent-info"><h4>Agent</h4><p>Unassigned</p></div>'
      }
      
      ${
        ticket.escalationReason
          ? `
        <div class="escalation-info">
          <h4>Escalation Information</h4>
          <p><strong>Reason:</strong> ${ticket.escalationReason}</p>
          <p><strong>Escalated At:</strong> ${formatDate(ticket.escalatedAt)}</p>
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
            <strong>Resolved:</strong> ${formatDate(ticket.resolvedAt)}
          </div>
        `
            : ""
        }
        ${
          ticket.escalatedAt
            ? `
          <div class="timeline-item">
            <strong>Escalated:</strong> ${formatDate(ticket.escalatedAt)}
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
                <strong>${comment.author.firstName} ${comment.author.lastName}</strong>
                <span class="comment-type ${comment.type
                  .toLowerCase()
                  .replace("_", "-")}">${comment.type.replace("_", " ")}</span>
                <span class="comment-time">${formatDate(comment.createdAt)}</span>
              </div>
              <div class="comment-content">${comment.content}</div>
            </div>
          `,
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
                <small>(${formatFileSize(attachment.fileSize)})</small>
              </a>
            </div>
          `,
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
              <i class="fas fa-star ${star <= ticket.customerRating ? "rated" : ""}"></i>
            `,
              )
              .join("")}
            <span>(${ticket.customerRating}/5)</span>
          </div>
          ${ticket.customerFeedback ? `<p><strong>Feedback:</strong> ${ticket.customerFeedback}</p>` : ""}
        </div>
      `
          : ""
      }
    </div>
  `
}

// View agent tickets
async function viewAgentTickets(agentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/agents/${agentId}/tickets?size=20`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      showAlert(`Agent has ${data.totalElements} tickets`, "info")
    }
  } catch (error) {
    console.error("Error loading agent tickets:", error)
    showAlert("Failed to load agent tickets", "error")
  }
}

// View customer tickets
async function viewCustomerTickets(customerId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}/tickets?size=20`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      showAlert(`Customer has ${data.totalElements} tickets`, "info")
    }
  } catch (error) {
    console.error("Error loading customer tickets:", error)
    showAlert("Failed to load customer tickets", "error")
  }
}

// Delete functions - FIXED: Use correct ticket ID
async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE",
      headers: window.authHeaders,
    })

    if (response.ok) {
      showAlert("User deleted successfully", "success")
      loadUsers()
    } else {
      showAlert("Failed to delete user", "error")
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

async function deleteTicket(ticketId) {
  if (!confirm("Are you sure you want to delete this ticket?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
      method: "DELETE",
      headers: window.authHeaders,
    })

    if (response.ok) {
      showAlert("Ticket deleted successfully", "success")
      loadTickets()
    } else {
      showAlert("Failed to delete ticket", "error")
    }
  } catch (error) {
    console.error("Error deleting ticket:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Edit functions (placeholder implementations)
function editUser(userId) {
  showAlert("Edit user functionality coming soon!", "info")
}

function editCustomer(customerId) {
  showAlert("Edit customer functionality coming soon!", "info")
}

function viewUserDetails(userId) {
  showAlert("View user details functionality coming soon!", "info")
}

// Reports functions
async function viewAgentPerformance() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reports/agent-performance`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      displayAgentPerformance(data)
      document.getElementById("agentPerformanceSection").style.display = "block"
    }
  } catch (error) {
    console.error("Error loading agent performance:", error)
    showAlert("Failed to load agent performance report", "error")
  }
}

function displayAgentPerformance(performanceData) {
  const tableBody = document.getElementById("performanceTableBody")

  const performanceHTML = performanceData
    .map(
      (performance) => `
    <tr>
      <td>${performance.agentName}</td>
      <td>${performance.employeeId || "N/A"}</td>
      <td>${
        Array.isArray(performance.departments) ? performance.departments.join(", ") : performance.departments || "N/A"
      }</td>
      <td>${performance.ticketsAssigned}</td>
      <td>${performance.ticketsResolved}</td>
      <td>${Math.round((performance.ticketsResolved / performance.ticketsAssigned) * 100)}%</td>
      <td>${performance.averageResolutionTime.toFixed(1)} hrs</td>
      <td>${performance.averageCustomerRating.toFixed(1)}/5</td>
      <td><span class="performance-grade ${performance.performanceGrade.toLowerCase()}">${
        performance.performanceGrade
      }</span></td>
    </tr>
  `,
    )
    .join("")

  tableBody.innerHTML = performanceHTML
}

async function viewCustomerSatisfaction() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reports/customer-satisfaction`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const data = await response.json()
      showAlert(`Customer Satisfaction: ${data.csatScore.toFixed(1)}% (${data.totalRatings} ratings)`, "info")
    }
  } catch (error) {
    console.error("Error loading customer satisfaction:", error)
    showAlert("Failed to load customer satisfaction report", "error")
  }
}

function viewTicketAnalytics() {
  showAlert("Ticket analytics functionality coming soon!", "info")
}

// Export reports
async function exportReport(reportType, format = "excel") {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reports/export/${format}?reportType=${reportType}`, {
      headers: window.authHeaders,
    })

    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${reportType}-report.${format === "excel" ? "xlsx" : "pdf"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showAlert(`${reportType} report exported successfully`, "success")
    } else {
      showAlert("Failed to export report", "error")
    }
  } catch (error) {
    console.error("Error exporting report:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Handle profile update
async function handleProfileUpdate(event) {
  event.preventDefault()

  const formData = {
    firstName: document.getElementById("profileFirstName").value.trim(),
    lastName: document.getElementById("profileLastName").value.trim(),
    phoneNumber: document.getElementById("profilePhone").value.trim(),
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "PUT",
      headers: window.authHeaders,
      body: JSON.stringify(formData),
    })

    if (response.ok) {
      currentUser = await response.json()
      updateUserDisplay()
      showAlert("Profile updated successfully", "success")
    } else {
      showAlert("Failed to update profile", "error")
    }
  } catch (error) {
    console.error("Error updating profile:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Handle profile image upload
async function handleProfileImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type and size
  if (!file.type.startsWith("image/")) {
    showAlert("Please select an image file", "error")
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showAlert("Image size must be less than 5MB", "error")
    return
  }

  try {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/users/profile/image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    })

    if (response.ok) {
      const updatedUser = await response.json()
      currentUser = updatedUser
      updateUserDisplay()
      showAlert("Profile image updated successfully", "success")
    } else {
      showAlert("Failed to upload image", "error")
    }
  } catch (error) {
    console.error("Error uploading profile image:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Pagination
function updatePagination(section, totalPages, currentPageNum) {
  const paginationContainer = document.getElementById(`${section}Pagination`)

  if (totalPages <= 1) {
    paginationContainer.innerHTML = ""
    return
  }

  let paginationHTML = ""

  // Previous button
  paginationHTML += `
    <button ${currentPageNum === 0 ? "disabled" : ""} onclick="changePage('${section}', ${currentPageNum - 1})">
      <i class="fas fa-chevron-left"></i> Previous
    </button>
  `

  // Page numbers
  for (let i = 0; i < totalPages; i++) {
    if (i === currentPageNum || i === 0 || i === totalPages - 1 || Math.abs(i - currentPageNum) <= 2) {
      paginationHTML += `
        <button class="${i === currentPageNum ? "active" : ""}" onclick="changePage('${section}', ${i})">
          ${i + 1}
        </button>
      `
    } else if (i === currentPageNum - 3 || i === currentPageNum + 3) {
      paginationHTML += "<span>...</span>"
    }
  }

  // Next button
  paginationHTML += `
    <button ${
      currentPageNum === totalPages - 1 ? "disabled" : ""
    } onclick="changePage('${section}', ${currentPageNum + 1})">
      Next <i class="fas fa-chevron-right"></i>
    </button>
  `

  paginationContainer.innerHTML = paginationHTML
}

function changePage(section, page) {
  switch (section) {
    case "users":
      loadUsers(page)
      break
    case "tickets":
      loadTickets(page)
      break
    case "agents":
      loadAgents(page)
      break
    case "customers":
      loadCustomers(page)
      break
  }
}

// Refresh functions
function refreshDashboard() {
  loadDashboardData()
  showAlert("Dashboard refreshed", "success")
}

function refreshTickets() {
  loadTickets()
  showAlert("Tickets refreshed", "success")
}

function refreshEscalatedTickets() {
  loadEscalatedTickets()
  showAlert("Escalated tickets refreshed", "success")
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Show alert
function showAlert(message, type) {
  const alert = document.getElementById("alertMessage")
  alert.textContent = message
  alert.className = `alert ${type} show`

  setTimeout(() => {
    alert.classList.remove("show")
  }, 5000)
}

// Logout
function logout() {
  localStorage.clear()
  window.location.href = "Login.html"
}
const escalatedTicketStyles = document.createElement("style");
escalatedTicketStyles.textContent = `
  .ticket-item {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 1rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    transition: background-color 0.2s ease;
    cursor: pointer;
  }

  .ticket-item:hover {
    background-color: #f9f9f9;
  }

  .ticket-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .ticket-id {
    font-weight: bold;
    font-size: 0.9rem;
    color: #333;
  }

  .ticket-badges span {
    margin-left: 0.5rem;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
    color: #fff;
  }

  .ticket-priority.high {
    background-color: #e74c3c;
  }

  .ticket-priority.medium {
    background-color: #f39c12;
  }

  .ticket-priority.low {
    background-color: #2ecc71;
  }

  .ticket-status {
    background-color: #3498db;
  }

  .ticket-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #222;
  }

  .ticket-meta {
    font-size: 0.9rem;
    color: #666;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  #escalatedTicketsContainer {
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }
`;
document.head.appendChild(escalatedTicketStyles);

// Add CSS for additional styles
const style = document.createElement("style")
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
  
  .escalated-tickets-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
  
  .ticket-details-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e1e5e9;
  }
  
  .customer-details, .agent-details {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 6px;
    margin-top: 0.5rem;
  }
  
  .customer-details p, .agent-details p {
    margin-bottom: 0.5rem;
  }
  
  .customer-details p:last-child, .agent-details p:last-child {
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
  
  .performance-grade {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .performance-grade.a-plus, .performance-grade.a {
    background: #e8f5e8;
    color: #388e3c;
  }
  
  .performance-grade.b {
    background: #fff3e0;
    color: #f57c00;
  }
  
  .performance-grade.c, .performance-grade.d {
    background: #ffebee;
    color: #d32f2f;
  }
  
  @media (max-width: 768px) {
    .ticket-details-header {
      flex-direction: column;
      gap: 1rem;
    }
    
    .comment-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    
    .comment-time {
      margin-left: 0;
    }
  }
`
document.head.appendChild(style)
