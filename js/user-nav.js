/**
 * Shared user nav chip — reads Discord user from localStorage,
 * shows avatar + username + dropdown with Dashboard / Log out.
 * Call initUserNav() after DOMContentLoaded.
 */

export function initUserNav({ chipId, avatarId, nameId, dropdownId }) {
  const chip = document.getElementById(chipId);
  const avatarEl = document.getElementById(avatarId);
  const nameEl = document.getElementById(nameId);
  const dropdown = document.getElementById(dropdownId);

  if (!chip) return;

  // Load user from localStorage
  let user = null;
  try {
    const raw = localStorage.getItem("discord_user_profile");
    if (raw) user = JSON.parse(raw);
  } catch (e) {}

  if (user) {
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
      : "/assets/avatar.png";
    if (avatarEl) avatarEl.src = avatarUrl;
    if (nameEl) nameEl.textContent = user.global_name || user.username || "User";
  } else {
    // Not logged in — hide the chip, show nothing
    if (chip) chip.style.display = "none";
    return;
  }

  // Toggle dropdown on chip click
  chip.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!dropdown) return;
    const isOpen = dropdown.classList.toggle("open");
    dropdown.style.opacity = isOpen ? "1" : "0";
    dropdown.style.visibility = isOpen ? "visible" : "hidden";
    dropdown.style.transform = isOpen ? "translateY(0)" : "translateY(-8px)";
    // Rotate chevron
    const chevron = chip.querySelector(".nav-chevron");
    if (chevron) chevron.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
  });

  // Close on outside click
  document.addEventListener("click", () => {
    if (!dropdown) return;
    dropdown.classList.remove("open");
    dropdown.style.opacity = "0";
    dropdown.style.visibility = "hidden";
    dropdown.style.transform = "translateY(-8px)";
    const chevron = chip.querySelector(".nav-chevron");
    if (chevron) chevron.style.transform = "rotate(0deg)";
  });

  // Log out
  const logoutBtn = document.getElementById("navLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("bloxlink_logged_in");
      localStorage.removeItem("discord_user_profile");
      sessionStorage.removeItem("saved_roblox_username");
      sessionStorage.removeItem("saved_roblox_avatar");
      sessionStorage.removeItem("discord_token");
      window.location.href = "/";
    });
  }
}

export function getUserAvatarUrl(user) {
  if (!user || !user.avatar) return "/assets/avatar.png";
  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`;
}
