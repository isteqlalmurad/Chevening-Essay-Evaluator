// app.js - Complete Essay Evaluator Script
document.addEventListener('DOMContentLoaded', function() {
  
    // State
    let selectedEssayType = '';
    let originalClickHandlers = new Map();

    // DOM elements
    const chatArea = document.getElementById('chatArea');
    const userInput = document.getElementById('userInput');
    const submitButton = document.getElementById('submitBtn');

 

    // Initialize subscription modal
    const initializeModal = () => {
        const stripeScript = document.createElement('script');
        stripeScript.src = 'https://js.stripe.com/v3/buy-button.js';
        stripeScript.async = true;
        document.head.appendChild(stripeScript);

        const modal = document.createElement('div');
        modal.className = 'subscription-modal';
        modal.innerHTML = `
            <div class="subscription-modal-content">
                <h2 style="margin-bottom: 1rem;">Premium Feature</h2>
                <p id="modal-message"></p>
                <div class="modal-buttons">
                    <button id="modal-action-btn" class="submit-btn" style="padding: 0.5rem 1rem;"></button>
                    <button id="modal-close-btn" class="submit-btn" style="padding: 0.5rem 1rem; background: #666;">Close</button>
                </div>
                <div id="stripe-button-container" style="margin-top: 1rem;"></div>
            </div>
        `;
        document.body.appendChild(modal);

        // Set up modal close handlers
        document.getElementById('modal-close-btn').onclick = () => {
            modal.style.display = 'none';
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };

        return modal;
    };

    const modal = initializeModal();

    // Utility Functions
    const createLoadingAnimation = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-animation';
        const dotsDiv = document.createElement('div');
        dotsDiv.className = 'dots';
        for(let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dotsDiv.appendChild(dot);
        }
        loadingDiv.appendChild(dotsDiv);
        return loadingDiv;
    };

    const addMessage = (text, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);
        if(sender === 'bot' && text.includes('Strong Points')) {
            messageDiv.innerHTML = parseFeedback(text);
        } else {
            messageDiv.textContent = text;
        }
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    };

    const parseFeedback = (text) => {
        text = text.replace(/\*\*\*\*/g, '**')
             .replace(/\*\*\s+/g, '**')
             .replace(/\s+\*\*/g, '**');
        
        const sections = text.split(/\d\.\s*\*\*/).filter(Boolean);
        let html = '';
        
        const scoreMatch = text.match(/Overall score.*?(\d+\.?\d*)/i);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;

        const sectionIcons = {
            'Strong Points': '💪',
            'Weak Points': '⚠️',
            'Feedback for Improvement': '📝'
        };

        sections.forEach(section => {
            const titleMatch = section.match(/([^:]*?):/);
            if(titleMatch) {
                const title = titleMatch[1].replace(/\*\*/g, '').trim();
                const icon = sectionIcons[title] || '';
                const content = section.replace(titleMatch[0], '').trim();
                const points = content.split('\n').filter(point => point.trim());

                html += `
                    <div class="feedback-section">
                        <div class="feedback-header">${icon} ${title}</div>
                        <ul class="feedback-list">
                            ${points.map(point => `<li>${point.replace(/^-\s*/, '')}</li>`).join('')}
                        </ul>
                    </div>`;
            }
        });

        if(score !== null) {
            const displayScore = Number.isInteger(score) ? score : score.toFixed(1);
            html += `
                <div class="feedback-score">
                    Overall Score: ${displayScore}/10
                </div>`;
        }

        return html;
    };

    // API Functions
    const validateEssayType = async (essay, type) => {
        const response = await fetch('https://kingmurad001.pythonanywhere.com/validate_essay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                essay: essay,
                type: type
            })
        });
    
        if (!response.ok) throw new Error('Validation failed');
        const data = await response.json();
        return data.isValid;
    };
    
    const getAIFeedback = async (essay, type) => {
        const response = await fetch('https://kingmurad001.pythonanywhere.com/get_essay_feedback', {
            method: 'POST',
     
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                essay: essay,
                type: type
            })
        });
    
        if (!response.ok) throw new Error('Failed to get AI feedback');
        const data = await response.json();
        return data.feedback;
    };
    // Subscription Functions
    async function checkSubscription() {
        const userEmail = localStorage.getItem('userEmail');
        const authToken = localStorage.getItem('authToken');

        if (!userEmail || !authToken) {
            return false;
        }

        try {
            const response = await fetch('https://kingmurad001.pythonanywhere.com/get_user_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ email: userEmail })
            });

            const data = await response.json();
            return data.user?.has_active_subscription || false;

        } catch (error) {
            console.error('Error checking subscription:', error);
            return false;
        }
    }

// In the showModal function, modify the redirect URLs:
function showModal(isLoggedIn) {
    const modalMessage = document.getElementById('modal-message');
    const actionBtn = document.getElementById('modal-action-btn');
    const stripeContainer = document.getElementById('stripe-button-container');
    
    // Get current page URL for redirect
    const returnUrl = encodeURIComponent(window.location.href);

    if (!isLoggedIn) {
        modalMessage.textContent = "Register to get access to extra features and more intelligent AI model, for greater accuracy in essay evaluation";
        actionBtn.textContent = "Register/Login";
        actionBtn.onclick = () => window.location.href = `../login-essays.html`;
        stripeContainer.style.display = 'none';
    } else {
        modalMessage.textContent = "Subscribe to unlock premium features";
        actionBtn.style.display = 'none';
        stripeContainer.innerHTML = '';
        const stripeButton = document.createElement('stripe-buy-button');
        stripeButton.setAttribute('buy-button-id', 'buy_btn_1QQURlE4KMDw3iLIRXlBbywY');
        stripeButton.setAttribute('publishable-key', 'pk_live_51QQTtrE4KMDw3iLI4lW8AzaFw6B09feV75SFiS5Pu9B9SkjdUIWiL5Pg7V5fRdC5d9hsdxYQgikfkxlv1P9r4G3e00AFNzhuyy');
        stripeButton.setAttribute('customer-email', localStorage.getItem('userEmail'));
        // Add success URL for Stripe
        stripeButton.setAttribute('success-url', returnUrl);
        stripeContainer.appendChild(stripeButton);
    }

    modal.style.display = 'flex';
}

 // Modified updateEssayAccess function
async function updateEssayAccess() {
    const hasSubscription = await checkSubscription();
    const isLoggedIn = !!localStorage.getItem('authToken');
    
    const leadershipEssay = document.querySelector('[data-type="leadership"]');
    const networkingEssay = document.querySelector('[data-type="networking"]');

    if (!hasSubscription) {
        leadershipEssay.classList.add('locked');
        networkingEssay.classList.add('locked');

        [leadershipEssay, networkingEssay].forEach(essay => {
            // Remove the original click handler completely
            const originalHandler = originalClickHandlers.get(essay);
            essay.removeEventListener('click', originalHandler);
            
            // Replace with lock handler
            essay.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                showModal(isLoggedIn);
            };
        });
    } else {
        leadershipEssay.classList.remove('locked');
        networkingEssay.classList.remove('locked');

        [leadershipEssay, networkingEssay].forEach(essay => {
            // Remove any existing onclick handler
            essay.onclick = null;
            
            // Re-add the original handler
            const originalHandler = originalClickHandlers.get(essay);
            essay.addEventListener('click', originalHandler);
        });
    }
}

    // Event Handlers
// Event Handlers for essay selection
document.querySelectorAll('.essay-type').forEach(button => {
    const originalHandler = function(e) {
        // If essay is locked, don't proceed with the original handler
        if (button.classList.contains('locked')) {
            e.preventDefault();
            return;
        }
        selectedEssayType = button.dataset.type;
        document.querySelectorAll('.essay-type').forEach(btn => 
            btn.style.border = 'none'
        );
        button.style.border = '2px solid var(--accent-blue)';
        addMessage(`I'll help you evaluate your ${selectedEssayType} essay. Please paste your essay in the text area below.`, 'bot');
    };

    // Store the original handler for later use
    originalClickHandlers.set(button, originalHandler);
    button.addEventListener('click', originalHandler);
});

    submitButton.addEventListener('click', async function() {
        const selectedEssay = document.querySelector(`[data-type="${selectedEssayType}"]`);
        
        if (selectedEssay?.classList.contains('locked')) {
            const isLoggedIn = !!localStorage.getItem('authToken');
            showModal(isLoggedIn);
            return;
        }

        if(!selectedEssayType) {
            addMessage('Please select an essay type first.', 'bot');
            return;
        }

        const essayText = userInput.value.trim();
        if(!essayText) {
            addMessage('Please enter your essay text.', 'bot');
            return;
        }

        submitButton.disabled = true;
        
        try {
            const loadingAnim = createLoadingAnimation();
            chatArea.appendChild(loadingAnim);

            const isValid = await validateEssayType(essayText, selectedEssayType);
            
            chatArea.removeChild(loadingAnim);

            if(!isValid) {
                addMessage(`This appears to be a different type of essay than "${selectedEssayType}". Please check your selection or essay content.`, 'bot');
                submitButton.disabled = false;
                userInput.value = '';
                return;
            }

            addMessage(essayText, 'user');
            userInput.value = '';
            
            const feedbackLoadingAnim = createLoadingAnimation();
            chatArea.appendChild(feedbackLoadingAnim);

            const feedback = await getAIFeedback(essayText, selectedEssayType);
            
            chatArea.removeChild(feedbackLoadingAnim);
            addMessage(feedback, 'bot');

            const scoreMatch = feedback.match(/Overall score.*?(\d+\.?\d*)/i);
            const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

            const consentGiven = document.getElementById('dataConsent').checked;
            if(consentGiven && score >= 6) {
                try {
                    const formattedScore = Number.isInteger(score) ? score : score.toFixed(1);
                    await emailjs.send(
                        'service_4caaf5f',
                        'template_5dhjfx4',
                        {
                            to_email: 'murad@leximos.com',
                            subject: `New ${selectedEssayType} Essay Submission (Score: ${formattedScore}/10)`,
                            message: `A new ${selectedEssayType} essay has been submitted for evaluation.
                            \nScore: ${formattedScore}/10
                            \nEssay Content:\n${essayText}`
                        }
                    );
                    console.log('Notification successfully');
                } catch(error) {
                    console.error('Failed to send notification:', error);
                }
            }
        } catch(error) {
            addMessage('Sorry, there was an error evaluating your essay. Please try again.', 'bot');
            console.error('Error:', error);
        } finally {
            submitButton.disabled = false;
            userInput.value = '';
            userInput.focus();
        }
    });

    // Initialize subscription check and periodic updates
    updateEssayAccess();
    setInterval(updateEssayAccess, 30000);

    // Listen for Stripe checkout completion
    window.addEventListener('message', async (event) => {
        if (event.data === 'checkout.completed') {
            await updateEssayAccess();
        }
    });

    // Optional: Add auto-save functionality for essay drafts
    let autoSaveInterval;
    userInput.addEventListener('input', () => {
        clearTimeout(autoSaveInterval);
        autoSaveInterval = setTimeout(() => {
            if (userInput.value.trim()) {
                localStorage.setItem('essayDraft', userInput.value);
                localStorage.setItem('essayType', selectedEssayType);
            }
        }, 2000);
    });

    // Restore draft if exists
    const savedDraft = localStorage.getItem('essayDraft');
    const savedType = localStorage.getItem('essayType');
    if (savedDraft && savedType) {
        const essayButton = document.querySelector(`[data-type="${savedType}"]`);
        if (essayButton && !essayButton.classList.contains('locked')) {
            userInput.value = savedDraft;
            essayButton.click();
        }
    }

    // Add profile access if not already present
    if (!document.querySelector('.profile-access')) {
        const profileLink = document.createElement('a');
        profileLink.href = '../profile-page.html';
        profileLink.className = 'profile-button';
        profileLink.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            My Profile
        `;
        document.querySelector('.header').appendChild(profileLink);
    }

    // Error handling for network issues
    window.addEventListener('online', async () => {
        addMessage('Connection restored. You can continue working.', 'bot');
        await updateEssayAccess();
    });

    window.addEventListener('offline', () => {
        addMessage('You are currently offline. Some features may not be available.', 'bot');
    });

    // Clean up function for page unload
    window.addEventListener('beforeunload', () => {
        clearInterval(autoSaveInterval);
    });
});
