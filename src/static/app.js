document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupContainer = document.getElementById("signup-container");
  const messageDiv = document.getElementById("message");
  const authButton = document.getElementById("auth-button");
  const authButtonLabel = document.getElementById("auth-button-label");
  const loginDialog = document.getElementById("login-dialog");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  let authorizationHeader = null;
  let isTeacher = false;

  function updateAuthControls() {
    authButtonLabel.textContent = isTeacher ? "Log out" : "Teacher login";
    authButton.setAttribute(
      "aria-label",
      isTeacher ? "Log out of teacher mode" : "Log in as a teacher"
    );
    signupContainer.classList.toggle("hidden", !isTeacher);
  }

  function makeAuthorizationHeader(username, password) {
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return `Basic ${btoa(binary)}`;
  }

  authButton.addEventListener("click", () => {
    if (isTeacher) {
      authorizationHeader = null;
      isTeacher = false;
      updateAuthControls();
      fetchActivities();
      return;
    }

    loginMessage.textContent = "";
    loginMessage.classList.add("hidden");
    loginDialog.showModal();
  });

  document.getElementById("cancel-login").addEventListener("click", () => {
    loginDialog.close();
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const candidateAuthorization = makeAuthorizationHeader(
      formData.get("username"),
      formData.get("password")
    );

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { Authorization: candidateAuthorization },
      });

      if (!response.ok) {
        const result = await response.json();
        loginMessage.textContent = result.detail || "Unable to sign in.";
        loginMessage.className = "error";
        return;
      }

      authorizationHeader = candidateAuthorization;
      isTeacher = true;
      loginForm.reset();
      updateAuthControls();
      loginDialog.close();
      fetchActivities();
    } catch (error) {
      loginMessage.textContent = "Failed to sign in. Please try again.";
      loginMessage.className = "error";
      console.error("Error signing in:", error);
    }
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) => `<li>
                      <span class="participant-email">${email}</span>
                      ${
                        isTeacher
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}" aria-label="Unregister ${email} from ${name}">❌</button>`
                          : ""
                      }
                    </li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: { Authorization: authorizationHeader },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { Authorization: authorizationHeader },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  updateAuthControls();
  fetchActivities();
});
