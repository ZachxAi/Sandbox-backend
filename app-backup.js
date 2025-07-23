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
        this.motivationalQuotes = [
            {
                quote: "The way to get started is to quit talking and begin doing.",
                author: "Walt Disney",
                category: "execution"
            },
            {
                quote: "Innovation distinguishes between a leader and a follower.",
                author: "Steve Jobs",
                category: "innovation"
            },
            {
                quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                author: "Winston Churchill",
                category: "persistence"
            },
            {
                quote: "Creativity is intelligence having fun.",
                author: "Albert Einstein",
                category: "creativity"
            },
            {
                quote: "Your most unhappy customers are your greatest source of learning.",
                author: "Bill Gates",
                category: "customer"
            },
            {
                quote: "The best stories are the ones that connect us to something larger than ourselves.",
                author: "Simon Sinek",
                category: "storytelling"
            },
            {
                quote: "By failing to prepare, you are preparing to fail.",
                author: "Benjamin Franklin",
                category: "planning"
            },
            {
                quote: "In God we trust. All others must bring data.",
                author: "W. Edwards Deming",
                category: "data"
            },
            {
                quote: "Ideas are easy. Implementation is hard.",
                author: "Guy Kawasaki",
                category: "execution"
            },
            {
                quote: "Documentation is a love letter that you write to your future self.",
                author: "Damian Conway",
                category: "documentation"
            },
            {
                quote: "Capital is important, but it's not the most important thing. The most important thing is the people.",
                author: "Jack Ma",
                category: "funding"
            }
        ];

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
            { id: 14, title: "Motivation - Data-Driven Decisions", type: "motivation", completed: false },
            { id: 15, title: "Pitch Deck Generation", type: "pitch-deck", completed: false },
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
        await this.loadWorkspaces();
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
            console.log("Binding startJourneyBtn");
            this.elements.startJourneyBtn.addEventListener('click', () => {
                console.log("Start Journey clicked");
                this.startJourney();
            });
        } else {
            console.log("startJourneyBtn not found in DOM");
        }

        if (this.elements.stepsList) {
            this.elements.stepsList.addEventListener('click', (e) => {
                if (e.target.classList.contains('step-item')) {
                    this.showDashboardView(e.target.dataset.view);
                }
            });
        }

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.authManager.logout && this.authManager.logout());
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetJourney());
        }
        
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', () => this.exportBusinessPlan());
        }
        
        if (this.elements.collabBtn) {
            this.elements.collabBtn.addEventListener('click', () => this.showCollaborationHub());
        }
        
        if (this.elements.createWorkspaceBtn) {
            this.elements.createWorkspaceBtn.addEventListener('click', () => this.createWorkspace());
        }
        
        if (this.elements.createProjectBtn) {
            this.elements.createProjectBtn.addEventListener('click', () => this.createProject());
        }
    }

    startJourney() {
        if (this.elements.welcomeScreen) {
            this.elements.welcomeScreen.style.display = 'none';
        }
        if (this.elements.chatInterface) {
            this.elements.chatInterface.style.display = 'grid';
        }
        this.addAIMessage("Great! Let's start with the first step: defining the problem you want to solve.");
        this.markStepActive(1);
    }

    processCurrentStep() {
        const step = this.workflowSteps[this.currentStep];
        switch (step.type) {
            case 'question':
                this.handleProblemDefinition();
                break;
            case 'motivation':
                this.handleMotivation(step.title);
                break;
            case 'validation':
                this.handleProblemValidation();
                break;
            case 'refinement':
                this.handleIdeaRefinement();
                break;
            case 'segments':
                this.handleCustomerSegments();
                break;
            case 'examples':
                this.handleCustomerExamples();
                break;
            case 'pitch':
                this.handleElevatorPitch();
                break;
            case 'financial':
                this.handleFinancialForecasting();
                break;
            case 'pitch-deck':
                this.handlePitchDeck();
                break;
            case 'business-plan':
                this.handleBusinessPlan();
                break;
            case 'docs':
                this.handleAdditionalDocuments();
                break;
            case 'funding':
                this.handleFundingInquiry();
                break;
            default:
                this.addAIMessage("Let's move to the next step.");
        }
    }

    handleProblemDefinition() {
        this.addAIMessage("What is the core problem you are trying to solve? Describe it in a few sentences.");
        this.showQuickActions(['Pain point for users', 'Market gap', 'Inefficient process']);
    }

    handleMotivation(stepTitle) {
        const category = this.getMotivationCategory(stepTitle);
        const quote = this.getRandomQuote(category);
        this.addMotivationMessage(`${quote.quote} - ${quote.author}`);
        this.completeCurrentStep();
    }

    handleProblemValidation() {
        this.addAIMessage("How have you validated this problem? Have you talked to potential customers?");
        this.businessPlan.problemValidation = this.userResponses.problemValidation;
        this.showQuickActions(['Conducted surveys', 'Interviewed users', 'Analyzed competitors', 'Not yet']);
    }

    handleIdeaRefinement() {
        this.addAIMessage("Let's refine your idea. What is your proposed solution?");
        this.businessPlan.solution = this.userResponses.solution;
    }

    handleCustomerSegments() {
        this.addAIMessage("Who are your target customers? Describe your ideal customer segment.");
        this.businessPlan.targetMarket = this.userResponses.targetMarket;
    }

    handleCustomerExamples() {
        this.addAIMessage("Can you give a specific example of a potential customer and their story?");
        this.businessPlan.customerExamples = this.userResponses.customerExamples;
    }

    handleElevatorPitch() {
        this.addAIMessage("It's time to craft your elevator pitch. I'll help you generate one based on our conversation.");
        this.generateElevatorPitch();
        this.completeCurrentStep();
    }

    handleFinancialForecasting() {
        this.addAIMessage("Let's talk numbers. What are your projected revenues and costs for the first three years?");
        this.generateFinancialForecast();
        this.completeCurrentStep();
    }

    handlePitchDeck() {
        this.addAIMessage("A great pitch deck is crucial. I will now generate a starter pitch deck for you.");
        this.generatePitchDeck();
        this.completeCurrentStep();
    }

    handleBusinessPlan() {
        this.addAIMessage("Now for the full business plan. I'll compile everything we've discussed into a comprehensive document.");
        this.generateBusinessPlan();
        this.completeCurrentStep();
    }

    handleAdditionalDocuments() {
        this.addAIMessage("Are there any other documents you need? (e.g., technical specifications, marketing plan)");
    }

    handleFundingInquiry() {
        this.addAIMessage("Are you interested in exploring funding options? I can provide information on angel investors, VCs, and grants.");
        this.showQuickActions(['Yes, tell me more', 'No, not at this time']);
    }

    showCompetitorAnalysis() {
        this.addAIMessage("Let's analyze your competitors. Who are the main players in this space?");
        const competitors = this.userResponses.competitors || 'Not yet defined';
        this.businessPlan.competitorAnalysis = competitors;
        this.addInsight(`Competitor analysis added: ${competitors}`);
    }

    generateElevatorPitch() {
        const pitch = `For ${this.userResponses.customerSegments}, who are struggling with ${this.userResponses.problemStatement}, our solution, ${this.userResponses.ideaName}, is a ${this.userResponses.solutionDetails} that provides ${this.userResponses.keyBenefit}.`;
        this.businessPlan.elevatorPitch = pitch;
        this.addInsight(`Elevator Pitch generated: "${pitch}"`);
    }

    generateFinancialForecast() {
        // In a real app, this would involve more complex calculations or a dedicated module
        const forecast = { year1: '...', year2: '...', year3: '...' };
        this.businessPlan.financialForecast = forecast;
        this.addInsight('Financial forecast placeholder generated.');
    }

    generatePitchDeck() {
        // Placeholder for pitch deck generation logic
        const deck = 'Pitch deck contents...';
        this.businessPlan.pitchDeck = deck;
        this.addInsight('Pitch deck placeholder generated.');
    }

    generateBusinessPlan() {
        // Placeholder for business plan generation
        const plan = 'Business plan contents...';
        this.businessPlan.fullBusinessPlan = plan;
        this.addInsight('Full business plan placeholder generated.');
    }

    sendMessage() {
        const message = this.elements.chatInput.value.trim();
        if (message) {
            this.addUserMessage(message);
            this.storeUserResponse(message);
            this.processUserResponse(message);
            this.elements.chatInput.value = '';
        }
    }

    storeUserResponse(message) {
        const step = this.workflowSteps[this.currentStep];
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
            // Other cases as needed
        }
    }

    processUserResponse(message) {
        // Simple logic to move to the next step after any user input
        // In a real app, this would involve NLP and more complex logic
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

    showResultsDashboard() {
        this.elements.chatInterface.style.display = 'none';
        this.elements.resultsDashboard.style.display = 'block';
        this.populateDashboard();
    }

    populateDashboard() {
        document.getElementById('finalBusinessPlan').textContent = JSON.stringify(this.businessPlan, null, 2);
        this.createFinancialChart();
        // Populate other dashboard elements
    }

    setupUserUI() {
        const user = this.currentUser;
        if (user) {
            document.getElementById('userName').textContent = `${user.firstName} ${user.lastName}`;
            document.getElementById('userAvatar').src = user.avatar || 'https://i.pravatar.cc/150?u=' + user.email;
        }
    }

    createFinancialChart() {
        const ctx = document.getElementById('financialChart').getContext('2d');
        if(window.financialChart instanceof Chart) {
            window.financialChart.destroy();
        }
        window.financialChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Year 1', 'Year 2', 'Year 3'],
                datasets: [{
                    label: 'Revenue',
                    data: [50000, 150000, 500000],
                    borderColor: 'rgba(108, 92, 231, 1)',
                    backgroundColor: 'rgba(108, 92, 231, 0.2)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Profit',
                    data: [10000, 40000, 200000],
                    borderColor: 'rgba(0, 206, 201, 1)',
                    backgroundColor: 'rgba(0, 206, 201, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value / 1000 + 'k';
                            }
                        }
                    }
                }
            }
        });
    }

    // Helper methods
    addAIMessage(message) {
        const formattedMessage = this.formatMessage(message);
        const messageEl = document.createElement('div');
        messageEl.className = 'message ai';
        messageEl.innerHTML = formattedMessage;
        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    addUserMessage(message) {
        const formattedMessage = this.formatMessage(message);
        const messageEl = document.createElement('div');
        messageEl.className = 'message user';
        messageEl.textContent = formattedMessage;
        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    addMotivationMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'message motivation';
        messageEl.innerHTML = `<i class="fas fa-lightbulb"></i><p>${message}</p>`;
        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    formatMessage(message) {
        // Basic formatting for now, can be extended for markdown, etc.
        return message.replace(/\n/g, '<br>');
    }

    showQuickActions(actions) {
        this.elements.quickActions.innerHTML = '';
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'quick-action-btn';
            button.textContent = action;
            button.dataset.action = action;
            this.elements.quickActions.appendChild(button);
        });
    }

    updateProgress() {
        const percentage = (this.currentStep / this.totalSteps) * 100;
        this.elements.progressBar.style.width = `${percentage}%`;
    }

    renderSteps() {
        const stepsList = this.elements.stepsList;
        stepsList.innerHTML = '';
        this.workflowSteps.forEach(step => {
            const stepEl = document.createElement('div');
            stepEl.className = 'step-item';
            stepEl.textContent = step.title;
            stepEl.dataset.step = step.id;
            stepsList.appendChild(stepEl);
        });
    }

    markStepActive(stepNumber) {
        document.querySelectorAll('.step-item').forEach(el => {
            if (el.dataset.step == stepNumber) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    markStepCompleted(stepNumber) {
        const stepEl = document.querySelector(`.step-item[data-step='${stepNumber}']`);
        if (stepEl) {
            stepEl.classList.add('completed');
        }
    }

    addInsight(insight) {
        const insightEl = document.createElement('div');
        insightEl.className = 'insight-item';
        insightEl.textContent = insight;
        this.elements.insightsList.appendChild(insightEl);
    }

    getMotivationCategory(stepTitle) {
        if (stepTitle.includes('Innovation')) return 'innovation';
        if (stepTitle.includes('Persistence')) return 'persistence';
        if (stepTitle.includes('Creativity')) return 'creativity';
        if (stepTitle.includes('Customer')) return 'customer';
        if (stepTitle.includes('Storytelling')) return 'storytelling';
        if (stepTitle.includes('Planning')) return 'planning';
        if (stepTitle.includes('Data')) return 'data';
        if (stepTitle.includes('Execution')) return 'execution';
        if (stepTitle.includes('Documentation')) return 'documentation';
        if (stepTitle.includes('Funding')) return 'funding';
        return 'execution';
    }

    getRandomQuote(category) {
        const quotes = this.motivationalQuotes.filter(q => q.category === category);
        return quotes[Math.floor(Math.random() * quotes.length)];
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
        };
    }
    }

    resetJourney() {
        if (confirm('Are you sure you want to reset your journey? All progress will be lost.')) {
            location.reload();
        }
    }

    async loadWorkspaces() {
        try {
            const response = await fetch('/api/workspaces', {
                headers: { 'x-auth-token': this.authManager.authToken }
            });
            if (!response.ok) throw new Error('Failed to load workspaces');
            this.workspaces = await response.json();
            this.renderWorkspaces();
        } catch (error) {
            console.error('Error loading workspaces:', error);
            this.addAIMessage('Error: Could not load your workspaces.');
        }
    }

    renderWorkspaces() {
        const list = this.elements.workspacesList;
        list.innerHTML = '';
        this.workspaces.forEach(workspace => {
            const item = document.createElement('div');
            item.className = 'workspace-item';
            item.textContent = workspace.name;
            item.dataset.id = workspace._id;
            item.addEventListener('click', () => this.selectWorkspace(workspace._id));
            list.appendChild(item);
        });
    }

    async createWorkspace() {
        const name = this.elements.newWorkspaceName.value.trim();
        if (!name) return;

        try {
            const response = await fetch('/api/workspaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.authManager.authToken
                },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to create workspace');
            const newWorkspace = await response.json();
            this.workspaces.push(newWorkspace);
            this.renderWorkspaces();
            this.elements.newWorkspaceName.value = '';
        } catch (error) {
            console.error('Error creating workspace:', error);
            this.addAIMessage('Error: Could not create the workspace.');
        }
    }

    async selectWorkspace(workspaceId) {
        this.activeWorkspace = this.workspaces.find(w => w._id === workspaceId);
        document.querySelectorAll('.workspace-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === workspaceId);
        });

        if (this.activeWorkspace) {
            this.elements.newProjectName.style.display = 'block';
            this.elements.createProjectBtn.style.display = 'block';
            await this.loadProjects(workspaceId);
        } else {
            this.elements.newProjectName.style.display = 'none';
            this.elements.createProjectBtn.style.display = 'none';
            this.elements.projectsList.innerHTML = '';
        }
    }

    async loadProjects(workspaceId) {
        const list = this.elements.projectsList;
        list.innerHTML = '<h3>Projects</h3>';
        try {
            const response = await fetch(`/api/workspaces/${workspaceId}/projects`, {
                headers: { 'x-auth-token': this.authManager.authToken }
            });
            if (!response.ok) throw new Error('Failed to load projects');
            const projects = await response.json();
            this.renderProjects(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            list.innerHTML += '<p>Could not load projects.</p>';
        }
    }

    async createProject() {
        const name = this.elements.newProjectName.value.trim();
        if (!name || !this.activeWorkspace) return;

        try {
            const response = await fetch(`/api/workspaces/${this.activeWorkspace._id}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.authManager.authToken
                },
                body: JSON.stringify({ name })
            });
            if (!response.ok) throw new Error('Failed to create project');
            
            this.elements.newProjectName.value = '';
            await this.loadProjects(this.activeWorkspace._id);
        } catch (error) {
            console.error('Error creating project:', error);
            this.addAIMessage('Error: Could not create the project.');
        }
    }

    renderProjects(projects) {
        const list = this.elements.projectsList;
        if (projects.length === 0) {
            list.innerHTML += '<p>No projects yet.</p>';
            return;
        }
        projects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'project-item';
            item.textContent = project.name;
            list.appendChild(item);
        });
    }

    exportBusinessPlan() {
        // Create PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('SandBox Business Plan', 20, 30);
        
        doc.setFontSize(12);
        doc.text('Generated by SandBox AI Virtual Incubator', 20, 45);
        
        doc.setFontSize(14);
        doc.text('Problem Statement:', 20, 65);
        doc.setFontSize(10);
        doc.text(this.userResponses.problemStatement || 'Not defined', 20, 75);
        
        doc.setFontSize(14);
        doc.text('Solution:', 20, 95);
        doc.setFontSize(10);
        doc.text(this.userResponses.solutionDetails || 'Not defined', 20, 105);
        
        doc.setFontSize(14);
        doc.text('Target Market:', 20, 125);
        doc.setFontSize(10);
        doc.text(this.userResponses.customerSegments || 'Not defined', 20, 135);
        
        doc.save('sandbox-business-plan.pdf');
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
