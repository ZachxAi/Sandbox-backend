/**
 * SandBox Authentication Module
 * Handles user authentication flows including login, registration, and password reset
 */

const API_BASE = 'https://sandbox-backend-bgc0.onrender.com/api';

class AuthManager {
    constructor() {
        // DOM Elements
        this.loginCard = document.getElementById('loginCard');
        this.registerCard = document.getElementById('registerCard');
        this.forgotPasswordCard = document.getElementById('forgotPasswordCard');

        // Auth state
        this.currentUser = null;
        this.authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

        // Initialize the auth module
        this.init();
    }

    init() {
        // If on auth page, set up listeners. If not, check if user should be redirected.
        if (document.querySelector('.auth-page')) {
            if (this.authToken) {
                this.verifyTokenAndRedirect();
            }
            this.setupEventListeners();
            this.checkUrlParams();
        } 
    }

    setupEventListeners() {
        document.getElementById('showRegister')?.addEventListener('click', (e) => { e.preventDefault(); this.showCard('register'); });
        document.getElementById('showLogin')?.addEventListener('click', (e) => { e.preventDefault(); this.showCard('login'); });
        document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => { e.preventDefault(); this.showCard('forgotPassword'); });
        document.getElementById('backToLogin')?.addEventListener('click', (e) => { e.preventDefault(); this.showCard('login'); });
        document.getElementById('loginForm')?.addEventListener('submit', this.handleLogin.bind(this));
        document.getElementById('registerForm')?.addEventListener('submit', this.handleRegister.bind(this));
        document.getElementById('forgotPasswordForm')?.addEventListener('submit', this.handleForgotPassword.bind(this));
        document.querySelectorAll('.toggle-password').forEach(button => button.addEventListener('click', this.togglePasswordVisibility));
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', this.updatePasswordStrength.bind(this));
        }
        // Social login buttons
        const googleBtn = document.querySelector('.social-button.google');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                window.location.href = `${API_BASE}/auth/google`;
            });
        }
    }

    showCard(cardName) {
        this.loginCard.style.display = 'none';
        this.registerCard.style.display = 'none';
        this.forgotPasswordCard.style.display = 'none';

        const card = document.getElementById(`${cardName}Card`);
        if(card) card.style.display = 'block';
    }

    togglePasswordVisibility(e) {
        const targetId = e.currentTarget.getAttribute('data-target');
        const passwordInput = document.getElementById(targetId);
        const icon = e.currentTarget.querySelector('i');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    updatePasswordStrength(e) {
        const password = e.target.value;
        const strengthBars = document.querySelectorAll('.strength-segment');
        const strengthText = document.querySelector('.strength-text');
        strengthBars.forEach(bar => { bar.style.width = '0%'; bar.style.backgroundColor = '#e0e0e0'; });
        if (!password) { strengthText.textContent = 'Password strength'; return; }
        let strength = (password.length >= 8) + (/[\d]/.test(password)) + (/[!@#$%^&*(),.?":{}|<>]/.test(password));
        const levels = {0: 'Too weak', 1: 'Weak', 2: 'Good', 3: 'Strong'};
        const colors = {0: '#ff4d4f', 1: '#ffa940', 2: '#faad14', 3: '#52c41a'};
        strengthText.textContent = levels[strength] || 'Strong';
        for(let i = 0; i <= strength && i < 3; i++) {
            strengthBars[i].style.width = '33.33%';
            strengthBars[i].style.backgroundColor = colors[strength] || colors[3];
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonHtml = submitButton.innerHTML;
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            const response = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.errors ? data.errors[0].msg : 'Login failed');
            this.authToken = data.token;
            this.currentUser = data.user;
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('authToken', this.authToken);
            storage.setItem('user', JSON.stringify(this.currentUser));
            this.redirectToApp();
        } catch (error) {
            this.showNotification('error', error.message);
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHtml;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        if (password !== document.getElementById('confirmPassword').value) { this.showNotification('error', 'Passwords do not match'); return; }
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonHtml = submitButton.innerHTML;
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            const response = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName, lastName, email, password }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.errors ? data.errors[0].msg : 'Registration failed');
            this.showNotification('success', 'Account created successfully! Please log in.');
            this.showCard('login');
            document.getElementById('loginEmail').value = email;
        } catch (error) {
            this.showNotification('error', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHtml;
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonHtml = submitButton.innerHTML;
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            const response = await fetch(`${API_BASE}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
            const data = await response.json();
            if (!response.ok) throw new Error(data.errors ? data.errors[0].msg : 'Failed to send reset link');
            this.showNotification('success', data.msg);
            setTimeout(() => this.showCard('login'), 2000);
        } catch (error) {
            this.showNotification('error', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHtml;
        }
    }

    async verifyTokenAndRedirect() {
        try {
            const response = await fetch(`${API_BASE}/auth/user`, { headers: { 'x-auth-token': this.authToken } });
            if (response.ok) {
                this.currentUser = await response.json();
                this.redirectToApp();
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            this.logout();
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('user');
        this.authToken = null;
        this.currentUser = null;
        if (!document.querySelector('.auth-page')) {
            window.location.href = 'auth.html';
        }
    }

    redirectToApp() {
        window.location.href = 'dashboard.html';
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'reset-password' && urlParams.get('token')) {
            this.showNotification('info', 'Please create a new password. This feature would be on a separate, dedicated page in a production app.');
            // In a real app, you'd show a password reset form here.
            // For now, we just show the login form.
            this.showCard('login');
        }
    }

    showNotification(type, message) {
        // A more sophisticated notification system would be used in a real app.
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = AuthManager;
}
