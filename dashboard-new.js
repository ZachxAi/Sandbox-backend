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
        // Initialize AI chat functionality
        this.initAIChat();
        
        // Initialize modal functionality
        this.initModals();
        
        // Initialize event listeners
        this.bindEvents();
        
        // Load user data
        this.loadUserData();
        
        // Update UI
        this.updateActivePage();
        
        // Initialize tooltips and other UI components
        this.initUIComponents();
        
        // Set initial page based on URL hash
        const initialPage = window.location.hash.substring(1) || 'problem-definition';
        this.navigateToPage(initialPage);
    }
    
    initAIChat() {
        // Handle chat form submission
        this.elements.chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = this.elements.chatInput.value.trim();
            if (message) {
                this.addMessageToChat('user', message);
                this.elements.chatInput.value = '';
                this.elements.chatInput.disabled = true;
                
                try {
                    const response = await this.getAIResponse(message);
                    this.addMessageToChat('ai', response);
                } catch (error) {
                    console.error('Error getting AI response:', error);
                    this.addMessageToChat('ai', 'Sorry, I encountered an error. Please try again.');
                } finally {
                    this.elements.chatInput.disabled = false;
                    this.elements.chatInput.focus();
                }
            }
        });

        // Handle Enter key in chat input (without Shift)
        this.elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.elements.chatForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    initModals() {
        // Handle modal close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        });

        // Handle clicks outside modal content to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            });
        });

        // Handle Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    openModal.classList.remove('show');
                    setTimeout(() => {
                        openModal.style.display = 'none';
                    }, 300);
                }
            }
        });

        // Handle interview form submission
        const interviewForm = document.getElementById('interview-form');
        if (interviewForm) {
            interviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveInterview();
            });
        }

        // Handle feature form submission
        const featureForm = document.getElementById('feature-form');
        if (featureForm) {
            featureForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveFeature();
            });
        }
    }
    
    // Debounce function to limit how often a function can be called
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
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
        
        // Handle window resize with debounce
        const debouncedResize = this.debounce(() => this.handleResize(), 250);
        window.addEventListener('resize', debouncedResize);
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
        try {
            event.preventDefault();
            const target = event.currentTarget;
            const page = target.getAttribute('data-page');
            
            if (!page) {
                console.error('No page specified for navigation');
                return;
            }
            
            console.log(`Navigating to: ${page}`);
            
            // Update active navigation item
            this.elements.navItems.forEach(item => item.classList.remove('active'));
            target.classList.add('active');
            
            // Update current page
            this.currentPage = page;
            this.updateActivePage();
            
            // Update URL without page reload
            history.pushState({ page }, '', `#${page}`);
            
            // Scroll to top of the page
            window.scrollTo(0, 0);
            
            // Close mobile menu if open
            const mobileMenu = document.querySelector('.mobile-menu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                this.toggleMobileMenu();
            }
        } catch (error) {
            console.error('Navigation error:', error);
            this.showToast('Failed to navigate. Please try again.', 'error');
        }
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
        const message = this.elements.aiInput?.value.trim();
        if (!message) return;
        
        try {
            // Disable input and button during processing
            if (this.elements.aiInput) this.elements.aiInput.disabled = true;
            if (this.elements.sendMessage) this.elements.sendMessage.disabled = true;
            
            // Clear input immediately for better UX
            if (this.elements.aiInput) this.elements.aiInput.value = '';
            
            // Add user message to chat
            this.addMessage(message, 'user');
            this.updateConversationHistory('user', message);
            
            // Show typing indicator
            const typingIndicator = this.addTypingIndicator();
            
            try {
                // Get AI response
                const response = await this.getAIResponse(message);
                
                // Remove typing indicator
                if (typingIndicator && typingIndicator.remove) {
                    typingIndicator.remove();
                }
                
                // Add AI response to chat
                this.addMessage(response, 'ai');
                this.updateConversationHistory('assistant', response);
                
            } catch (error) {
                console.error('Error getting AI response:', error);
                this.addMessage('I\'m having trouble connecting to the AI service. Please check your internet connection and try again.', 'ai');
            }
            
        } catch (error) {
            console.error('Error in sendMessage:', error);
            this.showToast('Failed to send message. Please try again.', 'error');
        } finally {
            // Re-enable input and button
            if (this.elements.aiInput) this.elements.aiInput.disabled = false;
            if (this.elements.sendMessage) this.elements.sendMessage.disabled = false;
            
            // Focus the input field
            if (this.elements.aiInput) this.elements.aiInput.focus();
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
            const currentStep = this.currentPage ? this.currentPage.replace(/-/g, ' ') : 'general';
            const token = localStorage.getItem('token') || '';
            
            // Show loading state
            this.showToast('Getting AI response...', 'info');
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    context: `Current step in the startup journey: ${currentStep}`,
                    conversation: conversation.filter(msg => msg.role !== 'system').slice(-10) // Limit to last 10 messages
                }),
                timeout: 30000 // 30 second timeout
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            return data.response;
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            // Fallback responses based on current page
            const fallbackResponses = [
                "That's a great insight! Let me help you develop that idea further.",
                "I understand your perspective. This information will be valuable for your business strategy.",
                "Excellent thinking! Your response shows you're considering the key factors for success.",
                "Thank you for sharing that. Let's use this to strengthen your business foundation.",
                "I can't reach the AI service at the moment. Please check your internet connection and try again."
            ];
            
            return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
        }
    }

    getCurrentPageContext() {
        const pageContexts = {
            'problem-definition': 'The user is defining their business problem. Help them articulate a clear, specific problem statement and identify their target audience.',
            'problem-validation': 'The user is validating their problem through customer research. Help them design effective interviews and analyze validation data.',
            'idea-refinement': 'The user is refining their solution concept. Help them develop a unique value proposition and prioritize features.',
            'customer-segments': 'The user is identifying customer segments. Help them understand different user personas and market segments.',
            'customer-examples': 'The user is finding specific customer examples. Help them identify and reach potential early adopters.',
            'elevator-pitch': 'The user is crafting their elevator pitch. Help them create a compelling, concise presentation of their business.',
            'financial-forecasting': 'The user is working on financial projections. Help them understand revenue models and cost structures.',
            'pitch-deck': 'The user is creating their pitch deck. Help them structure a compelling investor presentation.',
            'business-plan': 'The user is developing their business plan. Help them think through all aspects of their business strategy.',
            'additional-docs': 'The user is working on additional documentation. Help them organize and present their business information.',
            'funding-inquiry': 'The user is preparing for funding. Help them understand investor requirements and funding strategies.'
        };
        
        return pageContexts[this.currentPage] || 'The user is working on their startup journey. Provide helpful business advice.';
    }

    // Enhanced navigation with page-specific initialization
    navigateToPage(pageId) {
        // Update active navigation item
        this.elements.navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });
        
        // Update current page
        this.currentPage = pageId;
        this.updateActivePage();
        
        // Initialize page-specific functionality
        this.initializePageFeatures(pageId);
        
        // Update URL without page reload
        if (history.pushState) {
            history.pushState(null, null, `#${pageId}`);
        }
    }

    initializePageFeatures(pageId) {
        // Initialize features specific to each page
        switch(pageId) {
            case 'problem-definition':
                this.initProblemDefinitionFeatures();
                break;
            case 'problem-validation':
                this.initProblemValidationFeatures();
                break;
            case 'idea-refinement':
                this.initIdeaRefinementFeatures();
                break;
            // Add more cases for other pages
        }
        
        // Initialize AI assist buttons for all pages
        this.initAIAssistButtons();
    }

    initProblemDefinitionFeatures() {
        // Initialize tag inputs
        this.initTagInput('audience-tags-container', 'audience-input');
        this.initTagInput('differentiators-tags-container', 'differentiators-input');
        
        // Initialize AI assist buttons
        this.initAIAssistButtons();
    }

    initProblemValidationFeatures() {
        // Initialize interview tracking
        const addInterviewBtn = document.getElementById('add-interview-btn');
        if (addInterviewBtn) {
            addInterviewBtn.addEventListener('click', () => {
                this.openInterviewModal();
            });
        }
        
        // Initialize AI assist buttons
        this.initAIAssistButtons();
    }

    initIdeaRefinementFeatures() {
        // Initialize feature matrix
        const addFeatureBtn = document.getElementById('add-feature-btn');
        if (addFeatureBtn) {
            addFeatureBtn.addEventListener('click', () => {
                this.openFeatureModal();
            });
        }
    }

    initAIAssistButtons() {
        // Initialize all AI assist buttons on the current page
        const aiButtons = document.querySelectorAll('.ai-assist-btn');
        aiButtons.forEach(button => {
            // Remove existing listeners to prevent duplicates
            button.replaceWith(button.cloneNode(true));
        });
        
        // Re-select and add new listeners
        document.querySelectorAll('.ai-assist-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const context = button.getAttribute('data-context');
                await this.handleAIAssist(context, button);
            });
        });
    }

    async handleAIAssist(context, button) {
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Thinking...';
        
        try {
            let prompt = this.generateContextualPrompt(context);
            const response = await this.getAIResponse(prompt);
            
            // Show AI response in chat or modal
            this.showAIResponse(response, context);
            
        } catch (error) {
            console.error('AI assist error:', error);
            this.showToast('AI assistance temporarily unavailable', 'error');
        } finally {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    generateContextualPrompt(context) {
        const prompts = {
            'problem-statement': 'Help me refine my problem statement. Here\'s what I have so far: ' + (document.getElementById('problemStatement')?.value || 'I need help defining my problem.'),
            'impact-assessment': 'Analyze the impact of my problem based on the frequency, severity, and market size I\'ve described.',
            'interview-questions': 'Generate specific interview questions for validating my problem with potential customers.',
            'validation-insights': 'Help me analyze my validation research and identify key insights.',
            'solution-refinement': 'Help me refine my solution concept: ' + (document.getElementById('solutionConcept')?.value || 'I need help defining my solution.'),
            'feature-suggestions': 'Suggest features for my solution based on the problem I\'m solving.'
        };
        
        return prompts[context] || 'I need help with my startup. Can you provide guidance?';
    }

    showAIResponse(response, context) {
        // Add response to chat
        this.addMessage(response, 'ai');
        
        // Optionally show in a modal for certain contexts
        if (['interview-questions', 'feature-suggestions'].includes(context)) {
            this.showResponseModal(response, context);
        }
    }

    addTag(container, text) {
        const tag = document.createElement('span');
        tag.className = 'tag removable';
        tag.innerHTML = `${text} <i class="fas fa-times"></i>`;
        
        tag.querySelector('i').addEventListener('click', () => {
            tag.remove();
        });
        
        container.appendChild(tag);
    }

    initRemovableTags() {
        document.querySelectorAll('.tag.removable i').forEach(icon => {
            icon.addEventListener('click', () => {
                icon.parentElement.remove();
            });
        });
    }

    saveAudienceData() {
        const audienceData = {
            description: document.getElementById('targetAudience')?.value,
            tags: Array.from(document.querySelectorAll('#audienceTags .tag')).map(tag => 
                tag.textContent.replace('×', '').trim()
            ),
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('audienceData', JSON.stringify(audienceData));
        this.showToast('Audience data saved successfully!', 'success');
    }

    showInterviewModal() {
        // Use HTML modal instead of creating dynamically
        const modal = document.getElementById('interview-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // Handle form submission
            const form = document.getElementById('interview-form');
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    this.saveInterview();
                };
            }
        }
    }

    showFeatureModal() {
        // Use HTML modal instead of creating dynamically
        const modal = document.getElementById('feature-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            
            // Handle form submission
            const form = document.getElementById('feature-form');
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    this.saveFeature();
                };
            }
        }
    }

    showResponseModal(response, context) {
        const title = context === 'interview-questions' ? 'Suggested Interview Questions' : 'AI Suggestions';
        
        // Use HTML modal instead of creating dynamically
        const modal = document.getElementById('response-modal');
        const responseContent = document.getElementById('ai-response-content');
        
        if (modal && responseContent) {
            // Set the title
            const titleElement = modal.querySelector('.modal-header h3');
            if (titleElement) {
                titleElement.textContent = title;
            }
            
            // Set the content
            responseContent.innerHTML = response;
            
            // Show the modal
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }
    }

    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }

    getInterviewModalContent() {
        return `
            <form id="interviewForm">
                <div class="form-group">
                    <label>Interviewee Name:</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Interview Date:</label>
                    <input type="date" name="date" required>
                </div>
                <div class="form-group">
                    <label>Key Insights:</label>
                    <textarea name="insights" rows="4" placeholder="What did you learn?"></textarea>
                </div>
                <div class="form-group">
                    <label>Problem Confirmed:</label>
                    <select name="confirmed">
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="partially">Partially</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Save Interview</button>
            </form>
        `;
    }

    getFeatureModalContent() {
        return `
            <form id="featureForm">
                <div class="form-group">
                    <label>Feature Name:</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea name="description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Impact Level:</label>
                    <select name="impact">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Effort Level:</label>
                    <select name="effort">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Add Feature</button>
            </form>
        `;
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
    
    saveInterview() {
        const form = document.getElementById('interviewForm') || document.querySelector('#interviewForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const interview = {
            name: formData.get('name'),
            date: formData.get('date'),
            insights: formData.get('insights'),
            confirmed: formData.get('confirmed'),
            timestamp: new Date().toISOString()
        };
        
        // In a real app, you would save this to a database
        console.log('Saving interview:', interview);
        
        // Show success message
        this.showToast('Interview recorded successfully!', 'success');
        
        // Close modal
        const modal = form.closest('.modal');
        if (modal) {
            modal.remove();
        }
        
        // Reset form
        form.reset();
    }
    
    saveFeature() {
        const form = document.getElementById('featureForm') || document.querySelector('#featureForm');
        if (!form) return;
        
        const formData = new FormData(form);
        const feature = {
            name: formData.get('name'),
            description: formData.get('description'),
            impact: formData.get('impact'),
            effort: formData.get('effort'),
            timestamp: new Date().toISOString()
        };
        
        // In a real app, you would save this to a database
        console.log('Saving feature:', feature);
        
        // Show success message
        this.showToast('Feature added successfully!', 'success');
        
        // Close modal
        const modal = form.closest('.modal');
        if (modal) {
            modal.remove();
        }
        
        // Reset form
        form.reset();
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
