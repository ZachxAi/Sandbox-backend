class DashboardApp {
    constructor() {
        // DOM Elements
        this.elements = {
            // Navigation
            navItems: document.querySelectorAll('.nav-item'),
            currentPage: document.getElementById('currentPage'),
            
            // User Interface
            saveProgressBtn: document.getElementById('saveProgressBtn'),
            notificationsBtn: document.getElementById('notificationsBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            
            // AI Assistant
            aiAssistant: document.getElementById('aiAssistant'),
            minimizeChat: document.getElementById('minimizeChat'),
            aiChat: document.getElementById('aiChat'),
            aiInput: document.getElementById('aiInput'),
            sendMessage: document.getElementById('sendMessage'),
            
            // Page Contents
            pageContents: document.querySelectorAll('.page-content')
        };
        
        // State
        this.currentPage = 'problem-definition';
        this.isChatMinimized = false;
        
        // Initialize the app
        this.init();
    }
    
    init() {
        // Initialize event listeners
        this.bindEvents();
        
        // Load user data
        this.loadUserData();
        
        // Update UI
        this.updateActivePage();
        
        // Initialize tooltips and other UI components
        this.initUIComponents();
    }
    
    bindEvents() {
        // Navigation
        this.elements.navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });
        
        // Buttons
        this.elements.saveProgressBtn?.addEventListener('click', () => this.saveProgress());
        this.elements.logoutBtn?.addEventListener('click', () => this.handleLogout());
        this.elements.minimizeChat?.addEventListener('click', () => this.toggleChat());
        this.elements.sendMessage?.addEventListener('click', () => this.sendMessage());
        this.elements.aiInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    initUIComponents() {
        // Initialize any third-party UI components
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true
            });
        }
        
        // Initialize tooltips
        this.initTooltips();
    }
    
    initTooltips() {
        // Add tooltip functionality to elements with data-tooltip attribute
        document.querySelectorAll('[data-tooltip]').forEach(el => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = el.getAttribute('data-tooltip');
            el.appendChild(tooltip);
            
            el.addEventListener('mouseenter', () => {
                tooltip.classList.add('show');
            });
            
            el.addEventListener('mouseleave', () => {
                tooltip.classList.remove('show');
            });
        });
    }
    
    handleNavigation(event) {
        event.preventDefault();
        const target = event.currentTarget;
        const page = target.getAttribute('data-page');
        
        if (!page) return;
        
        // Update active navigation item
        this.elements.navItems.forEach(item => item.classList.remove('active'));
        target.classList.add('active');
        
        // Update current page
        this.currentPage = page;
        this.updateActivePage();
        
        // Update URL without page reload
        history.pushState({ page }, '', `#${page}`);
    }
    
    updateActivePage() {
        // Hide all pages
        this.elements.pageContents.forEach(page => {
            page.classList.remove('active');
        });
        
        // Show current page
        const activePage = document.getElementById(`${this.currentPage}-page`);
        if (activePage) {
            activePage.classList.add('active');
        }
        
        // Update page title
        const activeNavItem = document.querySelector(`.nav-item[data-page="${this.currentPage}"]`);
        if (activeNavItem && this.elements.currentPage) {
            const pageName = activeNavItem.querySelector('span')?.textContent || 'Dashboard';
            this.elements.currentPage.textContent = pageName;
            document.title = `${pageName} | SandBox`;
        }
    }
    
    toggleChat() {
        this.isChatMinimized = !this.isChatMinimized;
        this.elements.aiAssistant.classList.toggle('minimized', this.isChatMinimized);
        
        // Update icon
        const icon = this.elements.minimizeChat.querySelector('i');
        if (icon) {
            icon.className = this.isChatMinimized ? 'fas fa-plus' : 'fas fa-minus';
        }
    }
    
    async sendMessage() {
        const message = this.elements.aiInput.value.trim();
        if (!message) return;
        
        // Clear input immediately for better UX
        this.elements.aiInput.value = '';
        
        // Add user message to chat
        this.addMessage(message, 'user');
        this.updateConversationHistory('user', message);
        
        try {
            // Show typing indicator
            const typingIndicator = this.addTypingIndicator();
            
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            typingIndicator.remove();
            
            // Add AI response to chat
            this.addMessage(response, 'ai');
            this.updateConversationHistory('assistant', response);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'ai');
        }
    }
    
    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = sender === 'ai' ? 'AI' : 'You';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'content';
        messageContent.innerHTML = `<p>${content}</p>`;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.elements.aiChat.appendChild(messageDiv);
        this.elements.aiChat.scrollTop = this.elements.aiChat.scrollHeight;
    }
    
    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai typing';
        typingDiv.innerHTML = `
            <div class="avatar">AI</div>
            <div class="content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        this.elements.aiChat.appendChild(typingDiv);
        this.elements.aiChat.scrollTop = this.elements.aiChat.scrollHeight;
        
        return typingDiv;
    }
    
    async getAIResponse(message) {
        try {
            // Get the current conversation history
            const conversation = this.getConversationHistory();
            
            // Get the current page/step for context
            const currentStep = this.currentPage.replace('-', ' ');
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    message,
                    context: `Current step in the startup journey: ${currentStep}`,
                    conversation: conversation.filter(msg => msg.role !== 'system')
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from AI');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            // Fallback response if API call fails
            const fallbackResponses = [
                "I'm having trouble connecting to the AI service. Let me think about that...",
                "I'm currently experiencing some technical difficulties. Here's something to consider in the meantime...",
                "I can't reach the AI service right now, but based on my knowledge..."
            ];
            
            return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }
    }
    
    getConversationHistory() {
        // Get conversation from session storage or initialize a new one
        const history = JSON.parse(sessionStorage.getItem('chatHistory') || '[]');
        
        // Add system message if this is a new conversation
        if (history.length === 0) {
            history.push({
                role: 'system',
                content: 'You are SandBox, an AI assistant for entrepreneurs. Provide helpful, concise, and actionable advice for startup development.'
            });
        }
        
        return history;
    }
    
    updateConversationHistory(role, content) {
        const history = this.getConversationHistory();
        history.push({ role, content });
        
        // Keep only the last 20 messages to avoid hitting token limits
        if (history.length > 20) {
            // Keep the system message and the last 19 messages
            const systemMessage = history[0];
            const recentMessages = history.slice(-19);
            sessionStorage.setItem('chatHistory', JSON.stringify([systemMessage, ...recentMessages]));
        } else {
            sessionStorage.setItem('chatHistory', JSON.stringify(history));
        }
    }
    
    async saveProgress() {
        // Show loading state
        const originalText = this.elements.saveProgressBtn.innerHTML;
        this.elements.saveProgressBtn.disabled = true;
        this.elements.saveProgressBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        try {
            // Simulate API call to save progress
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show success message
            this.showToast('Progress saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving progress:', error);
            this.showToast('Failed to save progress', 'error');
            
        } finally {
            // Reset button state
            this.elements.saveProgressBtn.disabled = false;
            this.elements.saveProgressBtn.innerHTML = originalText;
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Hide after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    handleLogout() {
        // Clear user session
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
    
    loadUserData() {
        // Load user data from localStorage or API
        const userName = localStorage.getItem('userName') || 'User';
        const userGreeting = document.getElementById('userGreeting');
        if (userGreeting) userGreeting.textContent = `Hello, ${userName}`;
        
        // Update other user-specific UI elements
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(el => {
            el.textContent = userName;
        });
    }
    
    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth < 992) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
    }
}

// Initialize the dashboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardApp();
});
