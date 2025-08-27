document.addEventListener('DOMContentLoaded', () => {
    const dot = document.getElementById('dot');
    const label = document.getElementById('label');
    const toggleButton = document.getElementById('toggle');
    const refreshButton = document.getElementById('refresh');

    const API_BASE_URL = '/api';

    async function updateStatus() {
        try {
            label.textContent = 'Carregando status...';
            dot.className = 'dot'; // Reseta as classes

            const response = await fetch(`${API_BASE_URL}/status`);
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.enabled) {
                dot.classList.add('on');
                label.textContent = 'Bot Ativado (atendimento por IA)';
            } else {
                dot.classList.add('off');
                label.textContent = 'Bot Desativado (atendimento manual)';
            }
        } catch (error) {
            console.error('Falha ao buscar status:', error);
            dot.className = 'dot';
            label.textContent = 'Erro ao carregar status';
        }
    }

    async function toggleBotState() {
        try {
            const response = await fetch(`${API_BASE_URL}/toggle`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.statusText}`);
            }
            
            // Atualiza o status na interface após o toggle
            await updateStatus();

        } catch (error) {
            console.error('Falha ao alternar o estado do bot:', error);
            alert('Não foi possível alterar o estado do bot. Verifique o console.');
        }
    }

    // Adiciona os event listeners
    toggleButton.addEventListener('click', toggleBotState);
    refreshButton.addEventListener('click', updateStatus);

    // Carrega o status inicial
    updateStatus();
});