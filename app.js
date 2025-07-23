console.log("app.js loaded");

// SandBox AI Virtual Incubator - Main Application
class SandBoxApp {
    constructor() {
        this.authManager = window.authManager || {};
        this.currentUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
        this.currentStep = 0;
        this.totalSteps = 21;
        this.userResponses = {};
        this.workspaces = [];
        this.activeWorkspace = null;
        this.businessPlan = {};
        
        this.workflowSteps = [
            { id: 1, title: "Problem Definition", type: "question", completed: false },
            { id: 2, title: "Motivation - Innovation", type: "motivation", completed: false },
            { id: 3, title: "Problem Validation", type: "validation", completed: false },
            { id: 4, title: "Motivation - Persistence", type: "motivation", completed: false },
            { id: 5, title: "Idea Refinement", type: "refinement", completed: false },
            { id: 6, title: "Motivation - Creativity", type: "motivation", completed: false },
            { id: 7, title: "Customer Segments", type: "segments", completed: false },
            { id: 8, title: "Motivation - Customer Focus", type: "motivation", completed: false },
            { id: 9, title: "Customer Examples", type: "examples", completed: false },
            { id: 10, title: "Motivation - Storytelling", type: "motivation", completed: false },
            { id: 11, title: "Elevator Pitch", type: "pitch", completed: false },
            { id: 12, title: "Motivation - Planning", type: "motivation", completed: false },
            { id: 13, title: "Financial Forecasting", type: "financial", completed: false },
            { id: 14, title: "Motivation - Data", type: "motivation", completed: false },
            { id: 15, title: "Pitch Deck Creation", type: "pitch-deck", completed: false },
            { id: 16, title: "Motivation - Execution", type: "motivation", completed: false },
            { id: 17, title: "Business Plan Generation", type: "business-plan", completed: false },
            { id: 18, title: "Motivation - Documentation", type: "motivation", completed: false },
            { id: 19, title: "Additional Documents", type: "docs", completed: false },
            { id: 20, title: "Motivation - Funding", type: "motivation", completed: false },
            { id: 21, title: "Funding Inquiry", type: "funding", completed: false }
        ];
        
        this.elements = this.getDOMElements();
        console.log("SandBoxApp constructed", this.elements);
        this.bindEvents();
        this.init();
    }

    async init() {
        this.setupUserUI();
        this.renderSteps();
        this.addAIMessage("Welcome to SandBox! I'm your AI co-founder. Let's build your business. To begin, what problem are you trying to solve?");
    }

    getDOMElements() {
        return {
            welcomeScreen: document.getElementById('welcomeScreen'),
            chatInterface: document.getElementById('chatInterface'),
            resultsDashboard: document.getElementById('resultsDashboard'),
            chatMessages: document.getElementById('chatMessages'),
            userInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn'),
            quickActions: document.getElementById('quickActions'),
            stepsList: document.getElementById('stepsList'),
            insightsList: document.getElementById('insightsList'),
            progressBar: document.getElementById('progressFill'),
            dashboardToggles: document.getElementById('dashboardToggles'),
            logoutBtn: document.getElementById('logoutBtn'),
            resetBtn: document.getElementById('resetBtn'),
            exportBtn: document.getElementById('exportBtn'),
            collabBtn: document.getElementById('collabBtn'),
            collaborationHub: document.getElementById('collaborationHub'),
            workspacesList: document.getElementById('workspacesList'),
            projectsList: document.getElementById('projectsList'),
            newProjectName: document.getElementById('newProjectName'),
            createProjectBtn: document.getElementById('createProjectBtn'),
            newWorkspaceName: document.getElementById('newWorkspaceName'),
            createWorkspaceBtn: document.getElementById('createWorkspaceBtn'),
            startJourneyBtn: document.getElementById('startJourneyBtn'),
            loginBtn: document.getElementById('loginBtn'),
            userProfile: document.getElementById('userProfile'),
            userGreeting: document.getElementById('userGreeting'),
        };
    }

    bindEvents() {
        // Safely bind events only if elements exist
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => this.handleUserInput());
        }
        
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.handleUserInput();
                }
            });
        }

        if (this.elements.quickActions) {
            this.elements.quickActions.addEventListener('click', (e) => {
                if (e.target.classList.contains('quick-action-btn')) {
                    this.elements.userInput.value = e.target.dataset.action;
                    this.handleUserInput();
                }
            });
        }

        if (this.elements.startJourneyBtn) {
            this.elements.startJourneyBtn.addEventListener('click', () => this.startJourney());
        }

        // Chat input handling
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !this.elements.userInput.disabled) {
                    this.handleUserInput();
                }
            });
        }

        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => {
                if (!this.elements.sendBtn.disabled) {
                    this.handleUserInput();
                }
            });
        }

        // Navigation buttons
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetJourney());
        }

        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => this.exportBusinessPlan());
        }

        if (this.elements.collabBtn) {
            this.elements.collabBtn.addEventListener('click', () => this.showCollaborationHub());
        }

        // Auth buttons
        if (this.elements.loginBtn) {
            this.elements.loginBtn.addEventListener('click', () => {
                window.location.href = 'auth.html';
            });
        }

        // Fix logout button functionality
        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => {
                if (window.authManager && typeof window.authManager.logout === 'function') {
                    window.authManager.logout();
                } else {
                    // Fallback logout functionality
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('user');
                    sessionStorage.removeItem('authToken');
                    sessionStorage.removeItem('user');
                    window.location.href = 'auth.html';
                }
            });
        }
    }

    startJourney() {
        if (!this.currentUser) {
            window.location.href = 'auth.html';
            return;
        }
        console.log("Starting journey...");
        if (this.elements.welcomeScreen) {
            this.elements.welcomeScreen.style.display = 'none';
        }
        if (this.elements.chatInterface) {
            this.elements.chatInterface.style.display = 'grid';
        }
        if (this.elements.userInput) this.elements.userInput.disabled = false;
        if (this.elements.sendBtn) this.elements.sendBtn.disabled = false;
        this.addAIMessage("Great! Let's start with the first step: defining the problem you want to solve.");
        this.markStepActive(1);
    }

    handleUserInput() {
        const message = this.elements.userInput.value.trim();
        if (message) {
            this.addUserMessage(message);
            this.storeUserResponse(message);
            this.elements.userInput.value = '';
            this.processUserResponse(message);
        }
    }

    async processUserResponse(message) {
        console.log("Processing user response:", message);
        
        // Show loading state
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        try {
            // Call ChatGPT API for AI response
            const aiResponse = await this.getAIResponse(message);
            
            // Hide loading state
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Add AI response to chat
            this.addAIMessage(aiResponse);
            
            // Process the current step
            setTimeout(() => {
                this.completeCurrentStep();
            }, 1000);
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            
            // Hide loading state
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            
            // Fallback response
            this.addAIMessage("I understand. Let me help you with the next step in your journey.");
            setTimeout(() => {
                this.completeCurrentStep();
            }, 1000);
        }
    }

    async getAIResponse(userMessage) {
        const API_BASE = 'https://sandbox-backend-pxtc.onrender.com/api';
        const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!authToken) {
            throw new Error('No authentication token found');
        }
        
        // Create context based on current step
        const currentStepInfo = this.workflowSteps[this.currentStep] || {};
        const context = `You are an AI business advisor helping an entrepreneur. Current step: ${currentStepInfo.title}. User response: ${userMessage}. Provide helpful, encouraging advice and ask follow-up questions to guide them through their business planning journey.`;
        
        const response = await fetch(`${API_BASE}/chat/ai-response`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': authToken
            },
            body: JSON.stringify({
                message: userMessage,
                context: context,
                step: this.currentStep
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.response || "Thank you for sharing that. Let's continue with your business journey.";
    }

    addAIMessage(message) {
        if (!this.elements.chatMessages) return;
        const messageEl = document.createElement('div');
        messageEl.className = 'message ai';
        messageEl.innerHTML = message;
        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    addUserMessage(message) {
        if (!this.elements.chatMessages) return;
        const messageEl = document.createElement('div');
        messageEl.className = 'message user';
        messageEl.textContent = message;
        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    storeUserResponse(message) {
        const step = this.workflowSteps[this.currentStep];
        if (!step) return;
        
        switch (step.type) {
            case 'question':
                this.userResponses.problemStatement = message;
                break;
            case 'validation':
                this.userResponses.problemValidation = message;
                break;
            case 'refinement':
                this.userResponses.solutionDetails = message;
                break;
            case 'segments':
                this.userResponses.customerSegments = message;
                break;
            case 'examples':
                this.userResponses.customerExamples = message;
                break;
        }
    }

    processUserResponse(message) {
        this.completeCurrentStep();
    }

    completeCurrentStep() {
        if (this.currentStep < this.workflowSteps.length) {
            this.markStepCompleted(this.currentStep + 1);
            this.currentStep++;
            if (this.currentStep < this.workflowSteps.length) {
                this.processCurrentStep();
            } else {
                this.showResultsDashboard();
            }
        }
    }

    processCurrentStep() {
        const step = this.workflowSteps[this.currentStep];
        if (!step) return;
        
        switch (step.type) {
            case 'question':
                this.addAIMessage("What is the core problem you are trying to solve? Describe it in a few sentences.");
                break;
            case 'motivation':
                this.addAIMessage("Great progress! Keep going - you're building something amazing.");
                setTimeout(() => this.completeCurrentStep(), 2000);
                break;
            case 'validation':
                this.addAIMessage("How have you validated this problem? Have you talked to potential customers?");
                break;
            case 'refinement':
                this.addAIMessage("Let's refine your idea. What is your proposed solution?");
                break;
            case 'segments':
                this.addAIMessage("Who are your target customers? Describe your ideal customer segment.");
                break;
            case 'examples':
                this.addAIMessage("Can you give a specific example of a potential customer and their story?");
                break;
            default:
                this.addAIMessage("Let's move to the next step.");
                setTimeout(() => this.completeCurrentStep(), 1000);
        }
    }

    markStepActive(stepNumber) {
        if (!this.elements.stepsList) return;
        const steps = this.elements.stepsList.querySelectorAll('.step-item');
        steps.forEach(el => {
            if (el.dataset.step == stepNumber) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    markStepCompleted(stepNumber) {
        if (!this.elements.stepsList) return;
        const stepEl = this.elements.stepsList.querySelector(`.step-item[data-step='${stepNumber}']`);
        if (stepEl) {
            stepEl.classList.add('completed');
        }
    }

    renderSteps() {
        if (!this.elements.stepsList) return;
        this.elements.stepsList.innerHTML = '';
        this.workflowSteps.forEach(step => {
            const stepEl = document.createElement('div');
            stepEl.className = 'step-item';
            stepEl.textContent = step.title;
            stepEl.dataset.step = step.id;
            this.elements.stepsList.appendChild(stepEl);
        });
    }

    setupUserUI() {
        // Setup user interface elements
        const isLoggedIn = !!this.currentUser;
        if (this.elements.userProfile) {
            this.elements.userProfile.style.display = isLoggedIn ? 'flex' : 'none';
        }
        if (this.elements.loginBtn) {
            this.elements.loginBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
        }
        if (this.elements.userGreeting) {
            this.elements.userGreeting.textContent = isLoggedIn && this.currentUser && this.currentUser.firstName ? `Hi, ${this.currentUser.firstName}` : '';
        }
        // Enable/disable chat input based on auth and chat interface
        const chatVisible = this.elements.chatInterface && this.elements.chatInterface.style.display !== 'none';
        if (this.elements.userInput) this.elements.userInput.disabled = !(isLoggedIn && chatVisible);
        if (this.elements.sendBtn) this.elements.sendBtn.disabled = !(isLoggedIn && chatVisible);
    }

    showResultsDashboard() {
        if (this.elements.chatInterface) {
            this.elements.chatInterface.style.display = 'none';
        }
        if (this.elements.resultsDashboard) {
            this.elements.resultsDashboard.style.display = 'block';
        }
        if (this.elements.userInput) this.elements.userInput.disabled = true;
        if (this.elements.sendBtn) this.elements.sendBtn.disabled = true;
        this.addAIMessage("Congratulations! You've completed your business planning journey.");
    }

    showCollaborationHub() {
        console.log("Showing collaboration hub");
    }

    resetJourney() {
        if (confirm('Are you sure you want to reset your journey? All progress will be lost.')) {
            location.reload();
        }
    }

    exportBusinessPlan() {
        console.log("Exporting business plan");
        alert("Business plan export feature coming soon!");
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing SandBoxApp');
    try {
        new SandBoxApp();
    } catch (error) {
        console.error('Error initializing SandBoxApp:', error);
    }
});
