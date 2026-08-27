import { CONFIG } from "./config.js";
import {
  redirectToDiscordOAuth,
  getDiscordOAuthToken,
  fetchDiscordUserData,
  formatDiscordAvatar
} from "./discord.js";
import {
  handleVerificationAction,
  openVerificationModal,
  initModalListeners
} from "./modal.js";

/**
 * Ponto de Entrada Principal da Aplicação
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Inicializa listeners do modal
  initModalListeners();

  // Elementos do Header / Nav
  const loggedOutSection = document.getElementById("loggedOutSection");
  const loggedInSection = document.getElementById("loggedInSection");
  const signInDiscordBtn = document.getElementById("signInDiscordBtn");
  const profileChipBtn = document.getElementById("profileChipBtn");
  const userDropdownMenu = document.getElementById("userDropdownMenu");
  const dropdownChevron = document.getElementById("dropdownChevron");
  const logoutBtn = document.getElementById("logoutBtn");
  const userAvatarImg = document.getElementById("userAvatarImg");
  const userDisplayName = document.getElementById("userDisplayName");
  const mobileToggle = document.getElementById("mobileToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  // Elementos de Entrada de Verificação
  const robloxUserInput = document.getElementById("robloxUserInput");
  const getVerifiedBtn = document.getElementById("getVerifiedBtn");
  const footerRobloxInput = document.getElementById("footerRobloxInput");
  const footerVerifiedBtn = document.getElementById("footerVerifiedBtn");

  // Atualiza UI para estado conectado
  function applyLoggedInState(user) {
    if (!user) return;
    if (loggedOutSection) loggedOutSection.style.display = "none";
    if (loggedInSection) loggedInSection.style.display = "block";

    if (userDisplayName) {
      userDisplayName.textContent = user.global_name || user.username || "Usuário";
    }
    if (userAvatarImg) {
      userAvatarImg.src = formatDiscordAvatar(user);
    }
  }

  // 1. Processa Retorno de Token do Discord OAuth
  const accessToken = getDiscordOAuthToken();
  if (accessToken) {
    const user = await fetchDiscordUserData(accessToken);
    if (user) {
      localStorage.setItem("bloxlink_logged_in", "true");
      localStorage.setItem("discord_user_profile", JSON.stringify(user));
      applyLoggedInState(user);

      // Abre automaticamente o modal após retorno do OAuth
      const savedUser = sessionStorage.getItem("saved_roblox_username") || "";
      openVerificationModal(savedUser);
    }
  } else if (localStorage.getItem("bloxlink_logged_in") === "true") {
    // 2. Restaura Sessão Salva
    try {
      const savedProfile = JSON.parse(localStorage.getItem("discord_user_profile"));
      if (savedProfile) applyLoggedInState(savedProfile);
    } catch (e) {}
  }

  // 3. Auto-abre o modal se ?verify=1 está na URL (ex: vindo do dashboard)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("verify") === "1") {
    // Remove o param da URL sem recarregar
    const cleanUrl = window.location.pathname;
    window.history.replaceState(null, "", cleanUrl);
    // Dispara o modal
    const savedUser = sessionStorage.getItem("saved_roblox_username") || "";
    handleVerificationAction(savedUser);
  }

  // Eventos de Autenticação & Menu
  if (signInDiscordBtn) {
    signInDiscordBtn.addEventListener("click", (e) => {
      e.preventDefault();
      redirectToDiscordOAuth();
    });
  }

  if (profileChipBtn) {
    profileChipBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = userDropdownMenu.classList.toggle("open");
      if (dropdownChevron) {
        dropdownChevron.style.transform = isOpen ? "rotate(180deg)" : "rotate(0deg)";
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (userDropdownMenu && !userDropdownMenu.contains(e.target) && profileChipBtn && !profileChipBtn.contains(e.target)) {
      userDropdownMenu.classList.remove("open");
      if (dropdownChevron) dropdownChevron.style.transform = "rotate(0deg)";
    }
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("bloxlink_logged_in");
      localStorage.removeItem("discord_user_profile");
      sessionStorage.removeItem("saved_roblox_username");
      sessionStorage.removeItem("saved_roblox_avatar");

      if (loggedOutSection) loggedOutSection.style.display = "block";
      if (loggedInSection) loggedInSection.style.display = "none";
      if (userDropdownMenu) userDropdownMenu.classList.remove("open");
    });
  }

  // "Get Verified Now" → redirect to dashboard
  if (getVerifiedBtn) {
    getVerifiedBtn.addEventListener("click", () => {
      window.location.href = "/dashboard";
    });
  }

  if (robloxUserInput) {
    robloxUserInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleVerificationAction(robloxUserInput.value);
      }
    });
  }

  if (footerVerifiedBtn) {
    footerVerifiedBtn.addEventListener("click", () => {
      const val = footerRobloxInput ? footerRobloxInput.value : "";
      handleVerificationAction(val);
    });
  }

  if (footerRobloxInput) {
    footerRobloxInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleVerificationAction(footerRobloxInput.value);
      }
    });
  }

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
  }
});
