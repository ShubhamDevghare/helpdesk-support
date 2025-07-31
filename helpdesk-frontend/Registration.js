// API Configuration
const API_BASE_URL = "http://localhost:8080/api"

// DOM Elements
const registerForm = document.getElementById("registerForm")
const registerBtn = document.getElementById("registerBtn")
const registerSpinner = document.getElementById("registerSpinner")
const alertMessage = document.getElementById("alertMessage")
const passwordInput = document.getElementById("password")
const confirmPasswordInput = document.getElementById("confirmPassword")
const passwordStrength = document.getElementById("passwordStrength")

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners
  registerForm.addEventListener("submit", handleRegistration)
  passwordInput.addEventListener("input", checkPasswordStrength)
  confirmPasswordInput.addEventListener("input", checkPasswordMatch)

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    const modals = document.querySelectorAll(".modal")
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  })
})

// Handle Registration
async function handleRegistration(event) {
  event.preventDefault()

  // Get form data
  const formData = new FormData(registerForm)
  const registrationData = {
    firstName: formData.get("firstName").trim(),
    lastName: formData.get("lastName").trim(),
    email: formData.get("email").trim(),
    phoneNumber: formData.get("phoneNumber").trim(),
    password: formData.get("password"),
    companyName: formData.get("companyName").trim(),
    address: formData.get("address").trim(),
    role: "CUSTOMER", // Default role for registration
  }

  // Validation
  if (!validateForm(registrationData)) {
    return
  }

  setLoading(true)

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    })

    const data = await response.json()

    if (response.ok) {
      showAlert("Registration successful! Please check your email to verify your account.", "success")

      // Clear form
      registerForm.reset()
      passwordStrength.textContent = ""

      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = "Login.html"
      }, 3000)
    } else {
      if (data.validationErrors) {
        // Handle validation errors
        let errorMessage = "Please fix the following errors:\n"
        Object.keys(data.validationErrors).forEach((field) => {
          errorMessage += `• ${data.validationErrors[field]}\n`
        })
        showAlert(errorMessage, "error")
      } else {
        showAlert(data.message || "Registration failed. Please try again.", "error")
      }
    }
  } catch (error) {
    console.error("Registration error:", error)
    showAlert("Network error. Please try again.", "error")
  } finally {
    setLoading(false)
  }
}

// Form validation
function validateForm(data) {
  // Check required fields
  if (!data.firstName || !data.lastName || !data.email || !data.password) {
    showAlert("Please fill in all required fields.", "error")
    return false
  }

  // Validate email format
  if (!isValidEmail(data.email)) {
    showAlert("Please enter a valid email address.", "error")
    return false
  }

  // Validate password strength
  if (!isStrongPassword(data.password)) {
    showAlert(
      "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.",
      "error",
    )
    return false
  }

  // Check password confirmation
  const confirmPassword = document.getElementById("confirmPassword").value
  if (data.password !== confirmPassword) {
    showAlert("Passwords do not match.", "error")
    return false
  }

  // Check terms agreement
  if (!document.getElementById("agreeTerms").checked) {
    showAlert("Please agree to the Terms of Service and Privacy Policy.", "error")
    return false
  }

  return true
}

// Check password strength
function checkPasswordStrength() {
  const password = passwordInput.value
  const strength = getPasswordStrength(password)

  passwordStrength.className = `password-strength ${strength.class}`
  passwordStrength.textContent = strength.text
}

// Get password strength
function getPasswordStrength(password) {
  if (password.length === 0) {
    return { class: "", text: "" }
  }

  let score = 0

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Character variety checks
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score < 3) {
    return { class: "weak", text: "Weak password" }
  } else if (score < 5) {
    return { class: "medium", text: "Medium strength" }
  } else {
    return { class: "strong", text: "Strong password" }
  }
}

// Check if password is strong enough
function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}

// Check password match
function checkPasswordMatch() {
  const password = passwordInput.value
  const confirmPassword = confirmPasswordInput.value

  if (confirmPassword.length > 0) {
    if (password === confirmPassword) {
      confirmPasswordInput.style.borderColor = "#28a745"
    } else {
      confirmPasswordInput.style.borderColor = "#dc3545"
    }
  } else {
    confirmPasswordInput.style.borderColor = "#e1e5e9"
  }
}

// Toggle password visibility
function togglePassword(fieldId) {
  const passwordField = document.getElementById(fieldId)
  const toggleIcon =
    fieldId === "password" ? document.getElementById("toggleIcon1") : document.getElementById("toggleIcon2")

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

// Show modals
function showTerms() {
  document.getElementById("termsModal").style.display = "block"
}

function showPrivacy() {
  document.getElementById("privacyModal").style.display = "block"
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none"
}

// Set loading state
function setLoading(isLoading) {
  if (isLoading) {
    registerBtn.disabled = true
    registerSpinner.classList.add("show")
    document.querySelector(".btn-text").textContent = "Creating Account..."
  } else {
    registerBtn.disabled = false
    registerSpinner.classList.remove("show")
    document.querySelector(".btn-text").textContent = "Create Account"
  }
}

// Show alert message
function showAlert(message, type) {
  alertMessage.textContent = message
  alertMessage.className = `alert ${type} show`

  // Auto hide after 8 seconds for success, 10 seconds for error
  const hideDelay = type === "success" ? 8000 : 10000
  setTimeout(() => {
    alertMessage.classList.remove("show")
  }, hideDelay)
}

// Utility function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Handle Enter key press
document.addEventListener("keypress", (event) => {
  if (event.key === "Enter" && event.target.tagName !== "TEXTAREA") {
    const openModal = document.querySelector('.modal[style*="block"]')
    if (!openModal) {
      handleRegistration(event)
    }
  }
})
