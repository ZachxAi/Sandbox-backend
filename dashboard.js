class DashboardApp {
    constructor() {
        this.elements = {
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
            chatInput: document.getElementById('chatInput'),
            sendChatBtn: document.getElementById('sendChatBtn'),
            chatMessages: document.getElementById('chatMessages'),
            revenueChartCanvas: document.getElementById('revenueChart'),
            // Quick Actions
            generatePitchBtn: document.getElementById('generatePitchBtn'),
            analyzeMarketBtn: document.getElementById('analyzeMarketBtn'),
            financialForecastBtn: document.getElementById('financialForecastBtn'),
            competitorAnalysisBtn: document.getElementById('competitorAnalysisBtn'),
        };

        this.quotes = [
            { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
            { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
            { text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.", author: "Steve Jobs" },
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        ];
        
        this.init();
    }

    init() {
        AOS.init();
        this.bindEvents();
        this.initCharts();
        this.startQuoteRotator();
    }

    bindEvents() {
        // Page Navigation
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', e => this.handleNavigation(e));
        });

        // Chat Sidebar
        this.elements.chatToggle.addEventListener('click', () => this.elements.chatSidebar.classList.add('open'));
        this.elements.chatClose.addEventListener('click', () => this.elements.chatSidebar.classList.remove('open'));

        // Logout
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                if (window.authManager) window.authManager.logout();
            });
        }

        // Chat
        this.elements.sendChatBtn.addEventListener('click', () => this.handleSendChat());
        this.elements.chatInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') this.handleSendChat();
        });

        // Quick Actions
        this.bindQuickActions();
    }

    bindQuickActions() {
        const actions = {
            generatePitchBtn: 'Generating pitch deck...',
            analyzeMarketBtn: 'Analyzing market...',
            financialForecastBtn: 'Creating financial forecast...',
            competitorAnalysisBtn: 'Analyzing competitors...'
        };

        for (const btnId in actions) {
            if (this.elements[btnId]) {
                this.elements[btnId].addEventListener('click', () => {
                    alert(`Feature coming soon: ${actions[btnId]}`);
                });
            }
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const item = e.currentTarget;
        const page = item.getAttribute('data-page');

        this.elements.navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        this.elements.pageContents.forEach(content => content.classList.remove('active'));
        const activePage = document.getElementById(`${page}-page`);
        if (activePage) activePage.classList.add('active');

        this.elements.pageTitle.textContent = item.querySelector('span').textContent + ' Dashboard';
        this.elements.currentPage.textContent = item.querySelector('span').textContent;
    }

    startQuoteRotator() {
        let quoteIndex = 0;
        setInterval(() => {
            quoteIndex = (quoteIndex + 1) % this.quotes.length;
            this.elements.quoteText.style.opacity = 0;
            this.elements.quoteAuthor.style.opacity = 0;
            setTimeout(() => {
                this.elements.quoteText.textContent = `"${this.quotes[quoteIndex].text}"`;
                this.elements.quoteAuthor.textContent = `- ${this.quotes[quoteIndex].author}`;
                this.elements.quoteText.style.opacity = 1;
                this.elements.quoteAuthor.style.opacity = 1;
            }, 500);
        }, 7000);
    }

    initCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#C9D1D9' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                y: { ticks: { color: '#C9D1D9' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
        };

        if (this.elements.revenueChartCanvas) {
            new Chart(this.elements.revenueChartCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [12000, 19000, 15000, 24000, 22000, 30000],
                        borderColor: '#58A6FF',
                        tension: 0.4,
                        fill: true,
                        backgroundColor: 'rgba(88, 166, 255, 0.1)'
                    }]
                },
                options: chartOptions
            });
        }
    }

    addMessageToChat(text, sender, isLoading = false) {
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', `${sender}-message`);
        
        let content = `<p>${text}</p>`;
        if (isLoading) {
            content = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
        }

        messageEl.innerHTML = `
            <div class="message-avatar"><i class="fas fa-${sender === 'ai' ? 'robot' : 'user'}"></i></div>
            <div class="message-content">${content}</div>
        `;
        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
        return messageEl;
    }

    async handleSendChat() {
        const message = this.elements.chatInput.value.trim();
        if (!message) return;

        this.addMessageToChat(message, 'user');
        this.elements.chatInput.value = '';
        this.elements.chatInput.disabled = true;

        const loadingIndicator = this.addMessageToChat('', 'ai', true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
            if (!response.ok) throw new Error('Network response was not ok.');
            const data = await response.json();
            loadingIndicator.remove();
            this.addMessageToChat(data.response, 'ai');
        } catch (error) {
            console.error('Chat API error:', error);
            loadingIndicator.remove();
            this.addMessageToChat('Sorry, I am having trouble connecting. Please try again.', 'ai');
        } finally {
            this.elements.chatInput.disabled = false;
            this.elements.chatInput.focus();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardApp = new DashboardApp();
});
