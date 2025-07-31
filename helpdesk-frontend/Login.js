// API Configuration
const API_BASE_URL = "http://localhost:8080/api"

// DOM Elements
const loginForm = document.getElementById("loginForm")
const emailInput = document.getElementById("email")
const passwordInput = document.getElementById("password")
const loginBtn = document.getElementById("loginBtn")
const loginSpinner = document.getElementById("loginSpinner")
const alertMessage = document.getElementById("alertMessage")
const forgotPasswordModal = document.getElementById("forgotPasswordModal")
const forgotPasswordForm = document.getElementById("forgotPasswordForm")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  const token = localStorage.getItem("authToken")
  if (token) {
    redirectToDashboard()
  }

  // Add event listeners
  loginForm.addEventListener("submit", handleLogin)
  forgotPasswordForm.addEventListener("submit", handleForgotPassword)

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target === forgotPasswordModal) {
      closeForgotPassword()
    }
  })
})

// Handle Login
async function handleLogin(event) {
  event.preventDefault()

  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()

  if (!email || !password) {
    showAlert("Please fill in all fields", "error")
    return
  }

  setLoading(true)

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      // Store authentication data
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("userRole", data.user.role)
      localStorage.setItem("userId", data.user.id)
      localStorage.setItem("userEmail", data.user.email)
      localStorage.setItem("userName", `${data.user.firstName} ${data.user.lastName}`)

      // Store additional agent data if applicable
      if (data.employeeId) {
        localStorage.setItem("employeeId", data.employeeId)
      }
      if (data.department) {
        localStorage.setItem("department", data.department)
      }

      showAlert("Login successful! Redirecting...", "success")

      // Redirect after short delay
      setTimeout(() => {
        redirectToDashboard()
      }, 1500)
    } else {
      showAlert(data.message || "Login failed. Please check your credentials.", "error")
    }
  } catch (error) {
    console.error("Login error:", error)
    showAlert("Network error. Please try again.", "error")
  } finally {
    setLoading(false)
  }
}

// Handle Forgot Password
async function handleForgotPassword(event) {
  event.preventDefault()

  const email = document.getElementById("resetEmail").value.trim()

  if (!email) {
    showAlert("Please enter your email address", "error")
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
      }),
    })

    if (response.ok) {
      showAlert("Password reset link sent to your email!", "success")
      closeForgotPassword()
      document.getElementById("resetEmail").value = ""
    } else {
      const data = await response.json()
      showAlert(data.message || "Failed to send reset email", "error")
    }
  } catch (error) {
    console.error("Forgot password error:", error)
    showAlert("Network error. Please try again.", "error")
  }
}

// Redirect to appropriate dashboard based on user role
function redirectToDashboard() {
  const userRole = localStorage.getItem("userRole")

  switch (userRole) {
    case "CUSTOMER":
      window.location.href = "Customer-Dashboard.html"
      break
    case "AGENT":
      window.location.href = "Agent-Dashboard.html"
      break
    case "ADMIN":
      window.location.href = "Admin-Dashboard.html"
      break
    default:
      console.error("Unknown user role:", userRole)
      localStorage.clear()
      showAlert("Invalid user role. Please contact support.", "error")
  }
}

// Toggle password visibility
function togglePassword() {
  const passwordField = document.getElementById("password")
  const toggleIcon = document.getElementById("toggleIcon")

  if (passwordField.type === "password") {
    passwordField.type = "text"
    toggleIcon.classList.remove("fa-eye")
    toggleIcon.classList.add("fa-eye-slash")
  } else {
    passwordField.type = "password"
    toggleIcon.classList.remove("fa-eye-slash")
    toggleIcon.classList.add("fa-eye")
  }
}

// Show/Hide forgot password modal
function showForgotPassword() {
  forgotPasswordModal.style.display = "block"
}

function closeForgotPassword() {
  forgotPasswordModal.style.display = "none"
}

// Set loading state
function setLoading(isLoading) {
  if (isLoading) {
    loginBtn.disabled = true
    loginSpinner.classList.add("show")
    document.querySelector(".btn-text").textContent = "Signing In..."
  } else {
    loginBtn.disabled = false
    loginSpinner.classList.remove("show")
    document.querySelector(".btn-text").textContent = "Sign In"
  }
}

// Show alert message
function showAlert(message, type) {
  alertMessage.textContent = message
  alertMessage.className = `alert ${type} show`

  // Auto hide after 5 seconds
  setTimeout(() => {
    alertMessage.classList.remove("show")
  }, 5000)
}

// Utility function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Handle Enter key press
document.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && !forgotPasswordModal.style.display) {
    handleLogin(event)
  }
})
