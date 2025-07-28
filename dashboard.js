document.addEventListener('DOMContentLoaded', () => {
    // Initialize AOS
    AOS.init();

    const elements = {
        sidebar: document.querySelector('.sidebar'),
        navItems: document.querySelectorAll('.nav-item'),
        pageContents: document.querySelectorAll('.page-content'),
        pageTitle: document.getElementById('pageTitle'),
        currentPage: document.getElementById('currentPage'),
        chatToggle: document.getElementById('chatToggle'),
        chatSidebar: document.getElementById('chatSidebar'),
        chatClose: document.getElementById('chatClose'),
        logoutBtn: document.getElementById('logoutBtn'),
        quoteText: document.getElementById('quoteText'),
        quoteAuthor: document.getElementById('quoteAuthor'),
        // Financial Calculator
        calculateBtn: document.getElementById('calculateBtn'),
        initialInvestment: document.getElementById('initialInvestment'),
        monthlyRevenue: document.getElementById('monthlyRevenue'),
        monthlyExpenses: document.getElementById('monthlyExpenses'),
        calculationResult: document.getElementById('calculationResult'),
        // Chat
        chatInput: document.getElementById('chatInput'),
        sendChatBtn: document.getElementById('sendChatBtn'),
        chatMessages: document.getElementById('chatMessages'),
        // Charts
        revenueChartCanvas: document.getElementById('revenueChart'),
        cashFlowChartCanvas: document.getElementById('cashFlowChart'),
    };

    const quotes = [
        { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
        { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
        { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" },
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    ];

    // --- Page Navigation ---
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            
            elements.navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            elements.pageContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${page}-page`).classList.add('active');

            elements.pageTitle.textContent = item.querySelector('span').textContent + ' Dashboard';
            elements.currentPage.textContent = item.querySelector('span').textContent;
        });
    });

    // --- Chat Sidebar --- 
    elements.chatToggle.addEventListener('click', () => elements.chatSidebar.classList.add('open'));
    elements.chatClose.addEventListener('click', () => elements.chatSidebar.classList.remove('open'));

    // --- Logout ---
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            // Assuming auth.js has a logout function
            if(window.authManager) {
                window.authManager.logout();
            }
        });
    }

    // --- Quote Rotator ---
    let quoteIndex = 0;
    const changeQuote = () => {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        elements.quoteText.style.opacity = 0;
        elements.quoteAuthor.style.opacity = 0;
        setTimeout(() => {
            elements.quoteText.textContent = `"${quotes[quoteIndex].text}"`;
            elements.quoteAuthor.textContent = `- ${quotes[quoteIndex].author}`;
            elements.quoteText.style.opacity = 1;
            elements.quoteAuthor.style.opacity = 1;
        }, 500);
    };
    setInterval(changeQuote, 7000);

    // --- Financial Calculator ---
    if (elements.calculateBtn) {
        elements.calculateBtn.addEventListener('click', () => {
            const investment = parseFloat(elements.initialInvestment.value);
            const revenue = parseFloat(elements.monthlyRevenue.value);
            const expenses = parseFloat(elements.monthlyExpenses.value);

            if (isNaN(investment) || isNaN(revenue) || isNaN(expenses)) {
                elements.calculationResult.textContent = 'Please enter valid numbers.';
                return;
            }

            const monthlyProfit = revenue - expenses;
            if (monthlyProfit <= 0) {
                elements.calculationResult.textContent = 'ROI cannot be calculated with non-positive profit.';
                return;
            }

            const roi = (investment / monthlyProfit).toFixed(1);
            elements.calculationResult.textContent = `Break-even in ${roi} months.`;
        });
    }

    // --- Charting ---
    const createChart = (canvas, type, data, options) => {
        if(canvas) new Chart(canvas.getContext('2d'), { type, data, options });
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
    };

    createChart(elements.revenueChartCanvas, 'line', {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Revenue',
            data: [12000, 19000, 15000, 24000, 22000, 30000],
            borderColor: '#58A6FF',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(88, 166, 255, 0.1)'
        }]
    }, chartOptions);

    createChart(elements.cashFlowChartCanvas, 'bar', {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [
            { label: 'Income', data: [50000, 59000, 70000, 81000], backgroundColor: '#2E7D32' },
            { label: 'Expenses', data: [42000, 45000, 52000, 58000], backgroundColor: '#C62828' }
        ]
    }, chartOptions);

    // --- Chat Functionality (Placeholder) ---
    const addMessageToChat = (text, sender) => {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', `${sender}-message`);
        messageEl.innerHTML = `
            <div class="message-avatar"><i class="fas fa-${sender === 'ai' ? 'robot' : 'user'}"></i></div>
            <div class="message-content"><p>${text}</p></div>
        `;
        elements.chatMessages.appendChild(messageEl);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    };

    const handleSendChat = async () => {
        const message = elements.chatInput.value.trim();
        if (!message) return;

        addMessageToChat(message, 'user');
        elements.chatInput.value = '';

        // API call to your backend
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            const data = await response.json();
            addMessageToChat(data.reply, 'ai');
        } catch (error) {
            console.error('Chat API error:', error);
            addMessageToChat('Sorry, I am having trouble connecting.', 'ai');
        }
    };

    elements.sendChatBtn.addEventListener('click', handleSendChat);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendChat();
    });
});
