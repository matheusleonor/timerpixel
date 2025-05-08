let timerId = 0;
let editingRow = null;
let blinkInterval; // Variável para armazenar o intervalo de piscar

// Lista pré-definida de temporizadores
const predefinedTimers = [
    { minutes: 5, title: "MÚSICA INICIAL" },
    { minutes: 23, title: "LOUVOR" },
    { minutes: 5, title: "DÍZIMO" },
    { minutes: 5, title: "LOUVOR DO DÍZIMO" },
    { minutes: 3, title: "BOAS VINDAS E AVISOS MACRO" },
    { minutes: 55, title: "MENSAGEM E ENCERRAMENTO" }
];

// Funções utilitárias
const formatTime = (minutes, seconds) => `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

const updateFullscreenAppearance = (timeLeft) => {
    const fullscreenDiv = document.getElementById('fullscreenTimer');
    const h2 = fullscreenDiv.querySelector('h2');
    
    if (timeLeft <= 60) { // Último minuto
        h2.style.color = timeLeft <= 10 ? '#ff0000' : '#ffa500';
        if (timeLeft <= 10) {
            h2.style.animation = 'blink 1s infinite';
        }
    } else {
        h2.style.color = '#ffa500';
        h2.style.animation = 'none';
    }
};

// Funções de manipulação do temporizador
const createTimerRow = (id, title, minutes, seconds) => {
    const row = document.createElement('tr');
    row.dataset.id = id;
    row.innerHTML = `
        <td>${title}</td>
        <td><span class="time-display">${formatTime(minutes, seconds)}</span></td>
        <td>
            <button class="play">Iniciar</button>
            <button class="edit">Editar</button>
            <button class="reset">Redefinir</button>
            <button class="fullscreen">Tela Cheia</button>
            <button class="move-up">↑</button>
            <button class="move-down">↓</button>
        </td>
    `;
    return row;
};

const moveRow = (row, direction) => {
    const parent = row.parentElement;
    if (direction === 'up' && row.previousElementSibling) {
        parent.insertBefore(row, row.previousElementSibling);
    } else if (direction === 'down' && row.nextElementSibling) {
        parent.insertBefore(row.nextElementSibling, row);
    }
};

const updateTimer = (row, isCountingUp) => {
    const timeDisplay = row.querySelector('.time-display');
    let [minutes, seconds] = timeDisplay.textContent.match(/\d+/g).map(Number);

    if (!isCountingUp) {
        if (minutes === 0 && seconds === 0) return true;

        if (seconds > 0) {
            seconds--;
        } else if (minutes > 0) {
            minutes--;
            seconds = 59;
        }
        timeDisplay.textContent = formatTime(minutes, seconds);
        timeDisplay.style.color = '#ffa500'; // Cor padrão laranja

        // Atualiza o efeito de piscar na tela cheia
        const fullscreenDiv = document.getElementById('fullscreenTimer');
        if (fullscreenDiv.style.display === 'flex' && fullscreenDiv.dataset.id === row.dataset.id) {
            const totalSeconds = minutes * 60 + seconds;
            fullscreenDiv.classList.remove('blink-yellow', 'blink-red');
            
            if (totalSeconds <= 5 && totalSeconds > 3) {
                fullscreenDiv.classList.add('blink-yellow');
            } else if (totalSeconds <= 3) {
                fullscreenDiv.classList.add('blink-red');
            }
        }
    } else {
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        timeDisplay.style.color = '#ff0000'; // Vermelho para tempo excedido
        timeDisplay.textContent = `+${formatTime(minutes, seconds)}`;
        
        // Remove os efeitos de piscar quando estiver contando para cima
        const fullscreenDiv = document.getElementById('fullscreenTimer');
        if (fullscreenDiv.style.display === 'flex') {
            fullscreenDiv.classList.remove('blink-yellow', 'blink-red');
        }
    }
    return false;
};

// Função para verificar se o texto precisa de animação
function needsAnimation(text, containerWidth) {
    // Cria um elemento temporário para medir o texto
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'nowrap';
    temp.style.fontSize = 'clamp(1.5rem, 3vw, 2.5rem)';
    temp.style.padding = '0 20px'; // Adiciona um pequeno padding para margem de segurança
    temp.textContent = text;
    document.body.appendChild(temp);
    
    // Verifica se o texto é maior que 60% da largura do container
    const needsAnim = temp.offsetWidth > (containerWidth * 0.6);
    document.body.removeChild(temp);
    return needsAnim;
}

// Funções específicas do modo tela cheia
const setupFullscreenMode = (row) => {
    const fullscreenDiv = document.getElementById('fullscreenTimer');
    const content = fullscreenDiv.querySelector('.fullscreen-content');
    
    // Remove qualquer efeito de piscar anterior
    fullscreenDiv.classList.remove('blink-yellow', 'blink-red');
    
    // Atualiza o conteúdo
    content.querySelector('h1').textContent = row.querySelector('td:nth-child(1)').textContent;
    const timeDisplay = row.querySelector('.time-display');
    const fullscreenTimeDisplay = content.querySelector('h2');
    fullscreenTimeDisplay.textContent = timeDisplay.textContent;
    fullscreenTimeDisplay.style.color = timeDisplay.style.color;
    
    // Atualiza a informação do responsável
    const responsavelInput = document.getElementById('responsavelInput');
    const responsavelInfo = content.querySelector('.responsavel-info');
    const text = responsavelInput.value || '';
    
    // Cria o container para o checkbox e label
    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    
    // Cria o checkbox
    const editCheckbox = document.createElement('input');
    editCheckbox.type = 'checkbox';
    editCheckbox.id = 'editMode';
    editCheckbox.className = 'edit-checkbox';
    
    // Cria o label
    const editLabel = document.createElement('label');
    editLabel.htmlFor = 'editMode';
    editLabel.textContent = 'Editar';
    editLabel.className = 'edit-label';
    
    // Adiciona o checkbox e label ao container
    editContainer.appendChild(editCheckbox);
    editContainer.appendChild(editLabel);
    
    // Cria o input para edição
    const fullscreenInput = document.createElement('input');
    fullscreenInput.type = 'text';
    fullscreenInput.value = text;
    fullscreenInput.className = 'fullscreen-input';
    fullscreenInput.placeholder = 'Multimidia: Nome - Aviso';
    fullscreenInput.style.display = 'none';
    
    // Cria o div para exibição normal
    const textDisplay = document.createElement('div');
    textDisplay.className = 'text-display';
    textDisplay.textContent = text;
    
    // Verifica se o texto tem mais de 75 caracteres
    if (text.length > 74) {
        textDisplay.className = 'text-display marquee';
    } else {
        textDisplay.className = 'text-display centered';
    }
    
    // Função para atualizar a exibição baseada no estado do checkbox
    const updateDisplay = () => {
        if (editCheckbox.checked) {
            textDisplay.style.display = 'none';
            fullscreenInput.style.display = 'block';
            fullscreenInput.focus();
        } else {
            textDisplay.style.display = 'block';
            fullscreenInput.style.display = 'none';
            const newText = fullscreenInput.value;
            textDisplay.textContent = newText;
            responsavelInput.value = newText;
            
            // Atualiza a classe baseado no tamanho do texto
            if (newText.length > 74) {
                textDisplay.className = 'text-display marquee';
            } else {
                textDisplay.className = 'text-display centered';
            }
        }
    };
    
    // Adiciona o evento de mudança no checkbox
    editCheckbox.addEventListener('change', updateDisplay);
    
    // Adiciona o evento de input no campo de texto
    fullscreenInput.addEventListener('input', function() {
        if (editCheckbox.checked) {
            const upperText = this.value.toUpperCase();
            this.value = upperText;
            textDisplay.textContent = upperText;
            // Atualiza a classe baseado no tamanho do texto
            if (upperText.length > 74) {
                textDisplay.className = 'text-display marquee';
            } else {
                textDisplay.className = 'text-display centered';
            }
        }
    });
    
    // Limpa o container e adiciona os elementos
    responsavelInfo.innerHTML = '';
    responsavelInfo.appendChild(editContainer);
    responsavelInfo.appendChild(textDisplay);
    responsavelInfo.appendChild(fullscreenInput);
    
    // Configura o botão de play/pause
    const playButton = row.querySelector('.play');
    content.querySelector('.fullscreen-controls').innerHTML = `
        <button class="play" data-row-id="${row.dataset.id}">
            ${playButton.textContent}
        </button>
    `;
    
    // Configura os eventos
    const fullscreenPlayButton = content.querySelector('.play');
    fullscreenPlayButton.style.background = playButton.classList.contains('pause') 
        ? "linear-gradient(145deg, #f44336, #c73328)" 
        : "linear-gradient(145deg, #4caf50, #3a8e40)";

    fullscreenPlayButton.addEventListener('click', () => {
        const targetRow = document.querySelector(`tr[data-id="${fullscreenPlayButton.dataset.rowId}"]`);
        if (targetRow) {
            const targetPlayButton = targetRow.querySelector('.play');
            targetPlayButton.click();
            fullscreenPlayButton.textContent = targetPlayButton.textContent;
            fullscreenPlayButton.style.background = targetPlayButton.classList.contains('pause') 
                ? "linear-gradient(145deg, #f44336, #c73328)" 
                : "linear-gradient(145deg, #4caf50, #3a8e40)";
        }
    });
    
    // Configura o botão de sair
    const exitButton = content.querySelector('.exit-fullscreen');
    exitButton.onclick = () => {
        fullscreenDiv.style.display = 'none';
        fullscreenDiv.classList.remove('blink-yellow', 'blink-red');
    };
    
    // Mostra o modo tela cheia
    fullscreenDiv.style.display = 'flex';
    fullscreenDiv.dataset.id = row.dataset.id;
};

const updateFullscreenDisplay = (row) => {
    const fullscreenDiv = document.getElementById('fullscreenTimer');
    if (fullscreenDiv.style.display === 'flex' && fullscreenDiv.dataset.id === row.dataset.id) {
        const content = fullscreenDiv.querySelector('.fullscreen-content');
        const timeDisplay = row.querySelector('.time-display');
        const fullscreenTimeDisplay = content.querySelector('h2');
        
        fullscreenTimeDisplay.textContent = timeDisplay.textContent;
        fullscreenTimeDisplay.style.color = timeDisplay.style.color; // Sincroniza a cor
        
        const playButton = row.querySelector('.play');
        const fullscreenPlayButton = content.querySelector('.play');
        if (fullscreenPlayButton) {
            fullscreenPlayButton.textContent = playButton.textContent;
            fullscreenPlayButton.style.background = playButton.classList.contains('pause') 
                ? "linear-gradient(145deg, #f44336, #c73328)" 
                : "linear-gradient(145deg, #4caf50, #3a8e40)";
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('timersContainer');
    predefinedTimers.forEach(timer => {
        const newRow = createTimerRow(++timerId, timer.title.toUpperCase(), timer.minutes, 0);
        container.appendChild(newRow);
    });
});

document.getElementById('clearTimers').addEventListener('click', () => {
    const container = document.getElementById('timersContainer');
    container.innerHTML = '';
    timerId = 0; // Reseta o contador de IDs
    
    // Fecha o modo tela cheia se estiver aberto
    const fullscreenDiv = document.getElementById('fullscreenTimer');
    if (fullscreenDiv.style.display === 'flex') {
        fullscreenDiv.style.display = 'none';
        fullscreenDiv.classList.remove('blink-yellow', 'blink-red');
    }
});

document.getElementById('addTimer').addEventListener('click', () => {
    editingRow = null;
    document.getElementById('timerTitle').value = '';
    document.getElementById('timerMinutes').value = '';
    document.getElementById('timerSeconds').value = '';
    document.getElementById('timerModal').style.display = 'flex';
});

// Função para formatar entrada de tempo
const formatTimeInput = (input) => {
    // Remove qualquer caractere não numérico
    let value = input.value.replace(/\D/g, '');
    
    // Limita a 2 dígitos
    value = value.slice(0, 2);
    
    // Se for segundos, garante que seja menor que 60
    if (input.id === 'timerSeconds' && parseInt(value) > 59) {
        value = '59';
    }
    
    input.value = value;
};

// Event listeners para os campos de tempo
const minutesInput = document.getElementById('timerMinutes');
const secondsInput = document.getElementById('timerSeconds');

minutesInput.addEventListener('input', function() {
    formatTimeInput(this);
});

secondsInput.addEventListener('input', function() {
    formatTimeInput(this);
});

// Ao perder o foco, garante que tenha 2 dígitos
minutesInput.addEventListener('blur', function() {
    if (this.value) {
        this.value = this.value.padStart(2, '0');
    }
});

secondsInput.addEventListener('blur', function() {
    if (this.value) {
        this.value = this.value.padStart(2, '0');
    }
});

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('timerModal').style.display = 'none';
    editingRow = null;
});

document.getElementById('confirmAddTimer').addEventListener('click', () => {
    const title = document.getElementById('timerTitle').value || 'Sem Título';
    let minutes = document.getElementById('timerMinutes').value;
    let seconds = document.getElementById('timerSeconds').value;

    // Garante que os valores são números válidos
    minutes = minutes ? parseInt(minutes) : 0;
    seconds = seconds ? parseInt(seconds) : 0;

    // Não permite criar temporizador com tempo zero
    if (minutes === 0 && seconds === 0) {
        alert('Por favor, insira um tempo válido maior que zero.');
        return;
    }

    if (editingRow) {
        // Para edição, verifica se o temporizador está rodando
        const playButton = editingRow.querySelector('.play');
        if (playButton.classList.contains('pause')) {
            playButton.click(); // Para o temporizador antes de editar
        }
        editingRow.querySelector('td:nth-child(1)').textContent = title;
        editingRow.querySelector('.time-display').textContent = formatTime(minutes, seconds);
        editingRow.querySelector('.time-display').style.color = '#ffa500'; // Reseta a cor
        editingRow.dataset.isCountingUp = "false"; // Reseta o estado
    } else {
        const container = document.getElementById('timersContainer');
        const newRow = createTimerRow(++timerId, title, minutes, seconds);
        container.appendChild(newRow);
    }

    document.getElementById('timerModal').style.display = 'none';
    editingRow = null;
});

document.getElementById('timersContainer').addEventListener('click', (e) => {
    const button = e.target;
    if (!button.matches('button')) return;
    
    const row = button.closest('tr');

    if (button.classList.contains('play')) {
        handlePlayButton(button, row);
    } else if (button.classList.contains('edit')) {
        handleEditButton(row);
    } else if (button.classList.contains('reset')) {
        handleResetButton(row);
    } else if (button.classList.contains('fullscreen')) {
        setupFullscreenMode(row);
    } else if (button.classList.contains('move-up') || button.classList.contains('move-down')) {
        moveRow(row, button.classList.contains('move-up') ? 'up' : 'down');
    }
});

const handlePlayButton = (button, row) => {
    if (button.classList.contains('pause')) {
        clearInterval(button.dataset.interval);
        button.textContent = 'Iniciar';
        button.classList.remove('pause');
        button.style.background = "linear-gradient(145deg, #4caf50, #3a8e40)";
        return;
    }

    button.textContent = 'Parar';
    button.classList.add('pause');
    button.style.background = "linear-gradient(145deg, #f44336, #c73328)";

    if (!row.dataset.isCountingUp) {
        row.dataset.isCountingUp = "false";
    }

    const interval = setInterval(() => {
        const isCountingUp = row.dataset.isCountingUp === "true";
        const completed = updateTimer(row, isCountingUp);
        updateFullscreenDisplay(row);

        if (completed && row.dataset.isCountingUp === "false") {
            row.dataset.isCountingUp = "true";
            handleTimerCompletion(row);
        }
    }, 1000);

    button.dataset.interval = interval;
};

const handleEditButton = (row) => {
    editingRow = row;
    const title = row.querySelector('td:nth-child(1)').textContent;
    const [minutes, seconds] = row.querySelector('.time-display')
        .textContent
        .replace('+', '') // Remove o + se estiver contando para cima
        .match(/\d+/g)
        .map(Number);
    
    document.getElementById('timerTitle').value = title;
    document.getElementById('timerMinutes').value = String(minutes).padStart(2, '0');
    document.getElementById('timerSeconds').value = String(seconds).padStart(2, '0');
    document.getElementById('timerModal').style.display = 'flex';
};

const handleResetButton = (row) => {
    const playButton = row.querySelector('.play');
    if (playButton.classList.contains('pause')) {
        playButton.click();
    }
    
    const title = row.querySelector('td:nth-child(1)').textContent;
    const defaultTimer = predefinedTimers.find(timer => timer.title === title);
    
    if (defaultTimer) {
        row.querySelector('.time-display').textContent = formatTime(defaultTimer.minutes, 0);
    } else {
        const [minutes] = row.querySelector('.time-display').textContent.match(/\d+/g).map(Number);
        row.querySelector('.time-display').textContent = formatTime(minutes, 0);
    }
    
    row.querySelector('.time-display').style.color = '#ffa500';
    row.dataset.isCountingUp = "false";
    updateFullscreenDisplay(row);
};

const handleTimerCompletion = (row) => {
    const nextRow = row.nextElementSibling;
    const fullscreenDiv = document.getElementById('fullscreenTimer');
    
    if (nextRow) {
        fullscreenDiv.style.opacity = "0";
        
        setTimeout(() => {
            setupFullscreenMode(nextRow);
            fullscreenDiv.style.opacity = "1";
            
            const nextPlayButton = nextRow.querySelector('.play');
            if (!nextPlayButton.classList.contains('pause')) {
                nextPlayButton.click();
            }
        }, 600);
    }
};

// Adiciona o evento de input para o campo de responsável
document.getElementById('responsavelInput').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
    const fullscreenDiv = document.getElementById('fullscreenTimer');
    if (fullscreenDiv.style.display === 'flex') {
        const responsavelInfo = fullscreenDiv.querySelector('.responsavel-info');
        const text = this.value;
        
        // Verifica se precisa de animação
        const needsAnim = text.length > 74;
        
        const marquee = document.createElement('div');
        if (needsAnim) {
            marquee.className = 'text-display marquee';
        } else {
            marquee.className = 'text-display centered';
        }
        marquee.textContent = text;
        responsavelInfo.innerHTML = '';
        responsavelInfo.appendChild(marquee);
    }
});
