/**
 * Olem's Digital Garden - Consolidated JavaScript
 * Handles everything from navigation to reading progress to article features
 */

document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // GLOBAL VARIABLES
    // ======================
    const sidenav = document.getElementById('sidenav');
    const sidenavToggle = document.getElementById('sidenavToggle');
    const readingProgress = document.querySelector('.reading-progress');
    const progressFill = document.querySelector('.reading-progress-fill');
    const articleSections = document.querySelectorAll('.article-section');
    const isArticlePage = articleSections.length > 0;

    // ======================
    // MOBILE NAVIGATION
    // ======================
    if (sidenavToggle && sidenav) {
        sidenavToggle.addEventListener('click', () => {
            sidenav.classList.toggle('active');
            const icon = sidenavToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
        
        // Close sidenav when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!sidenav.contains(e.target) && 
                    !sidenavToggle.contains(e.target) && 
                    sidenav.classList.contains('active')) {
                    sidenav.classList.remove('active');
                    const icon = sidenavToggle.querySelector('i');
                    if (icon) {
                        icon.classList.add('fa-bars');
                        icon.classList.remove('fa-times');
                    }
                }
            }
        });
    }

    // ======================
    // ACTIVE LINK HIGHLIGHTING
    // ======================
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) && href !== '../index.html') {
            link.classList.add('active');
        }
    });

    // ======================
    // READING PROGRESS (ALL PAGES)
    // ======================
    if (progressFill) {
        let maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        let currentSection = 0;
        const totalSections = articleSections.length;

        function updateProgress() {
            const scrollPosition = window.scrollY;
            const progress = (scrollPosition / maxScroll) * 100;
            
            // Update main progress bar
            progressFill.style.width = `${progress}%`;
            
            // Show/hide progress bar
            if (scrollPosition > 100) {
                readingProgress.style.display = 'block';
            } else {
                readingProgress.style.display = 'none';
            }
            
            // Update section progress for article pages
            if (isArticlePage && totalSections > 0) {
                articleSections.forEach((section, index) => {
                    const sectionTop = section.offsetTop - 100;
                    const sectionBottom = sectionTop + section.offsetHeight;
                    
                    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                        currentSection = index + 1;
                    }
                });
                
                // Color progress bar based on completion
                if (currentSection === totalSections) {
                    progressFill.style.background = 'var(--accent)';
                } else {
                    progressFill.style.background = 'linear-gradient(90deg, var(--accent), #00ffaa)';
                }
            }
            
            maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        }

        // Initial update
        updateProgress();
        
        // Update on scroll
        window.addEventListener('scroll', updateProgress);
        
        // Update on resize
        window.addEventListener('resize', updateProgress);
    }

    // ======================
    // ARTICLE-SPECIFIC FEATURES
    // ======================
    if (isArticlePage) {
        // Track reading progress in localStorage
        trackReadingProgress();
        
        // Add section navigation for long articles
        addSectionNavigation();
        
        // Enhance blockquotes with copy functionality
        enhanceBlockquotes();
        
        // Add keyboard shortcuts
        addKeyboardShortcuts();
    }

    // ======================
    // SERIES PROGRESS TRACKING
    // ======================
    if (isArticlePage) {
        const articleId = window.location.pathname.split('/').pop().replace('.html', '');
        const articleNumber = articleId.match(/\d+/)?.[0];
        
        if (articleNumber) {
            updateSeriesProgress(articleNumber);
        }
    }

    // ======================
    // NOTIFICATION SYSTEM
    // ======================
    setupNotificationStyles();

    // ======================
    // PRINT STYLES
    // ======================
    setupPrintStyles();

    // ======================
    // RESPONSIVE BEHAVIOR
    // ======================
    setupResponsiveBehavior();
});

// ======================
// ARTICLE PROGRESS TRACKING
// ======================

function trackReadingProgress() {
    const articleId = window.location.pathname.split('/').pop().replace('.html', '');
    const articleSections = document.querySelectorAll('.article-section');
    const sectionsRead = new Set();
    
    if (articleSections.length === 0) return;
    
    // Mark sections as read when they come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id || entry.target.dataset.section;
                if (sectionId) {
                    sectionsRead.add(sectionId);
                    
                    // Update localStorage
                    const progress = {
                        article: articleId,
                        sections: Array.from(sectionsRead),
                        timestamp: new Date().toISOString()
                    };
                    localStorage.setItem(`reading-${articleId}`, JSON.stringify(progress));
                }
            }
        });
    }, { threshold: 0.5 });
    
    // Observe all sections
    articleSections.forEach((section, index) => {
        if (!section.id) {
            section.id = `section-${index + 1}`;
        }
        section.dataset.section = `section-${index + 1}`;
        observer.observe(section);
    });
    
    // Load previous progress
    const savedProgress = localStorage.getItem(`reading-${articleId}`);
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        progress.sections.forEach(sectionId => {
            sectionsRead.add(sectionId);
        });
    }
}

// ======================
// SERIES PROGRESS UPDATES
// ======================

function updateSeriesProgress(articleNumber) {
    // Get visited parts from localStorage
    const visitedParts = JSON.parse(localStorage.getItem('will-to-stupidity-visited') || '[]');
    
    // Add current part if not already there
    if (!visitedParts.includes(parseInt(articleNumber))) {
        visitedParts.push(parseInt(articleNumber));
        localStorage.setItem('will-to-stupidity-visited', JSON.stringify(visitedParts));
        
        // Show achievement notification
        if (visitedParts.length === 1) {
            showNotification('🎉 You started the Will to Stupidity series!');
        } else if (visitedParts.length === 5) {
            showNotification('🏆 Congratulations! You completed the entire series!');
        } else {
            showNotification(`📚 Progress: ${visitedParts.length} of 5 parts completed`);
        }
    }
}

// ======================
// NOTIFICATION SYSTEM
// ======================

function showNotification(message) {
    // Check if notifications are enabled
    if (localStorage.getItem('notifications-disabled') === 'true') return;
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-content">
            <p>${message}</p>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent);
        color: var(--bg-primary);
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: var(--font-main);
        font-size: 0.9rem;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function setupNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .notification-close {
            background: none;
            border: none;
            color: inherit;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: 1rem;
            padding: 0;
            line-height: 1;
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .notification-content p {
            margin: 0;
            flex: 1;
        }
    `;
    document.head.appendChild(style);
}

// ======================
// BLOCKQUOTE ENHANCEMENTS
// ======================

function enhanceBlockquotes() {
    const blockquotes = document.querySelectorAll('.blockquote');
    
    blockquotes.forEach((quote, index) => {
        // Add click to copy functionality
        quote.style.cursor = 'pointer';
        quote.title = 'Click to copy quote';
        
        quote.addEventListener('click', function() {
            const text = this.querySelector('p')?.textContent || this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const originalHTML = this.innerHTML;
                this.innerHTML = '<p>✓ Quote copied to clipboard!</p>';
                this.style.background = 'rgba(0, 255, 255, 0.1)';
                this.style.borderLeftColor = 'var(--accent)';
                
                setTimeout(() => {
                    this.innerHTML = originalHTML;
                    this.style.background = '';
                    this.style.borderLeftColor = '';
                }, 2000);
            });
        });
    });
}

// ======================
// KEYBOARD SHORTCUTS
// ======================

function addKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Space to toggle reading mode (when not in input)
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
            document.body.classList.toggle('reading-mode');
            
            // Show brief notification
            if (document.body.classList.contains('reading-mode')) {
                showNotification('📖 Reading mode enabled');
            }
        }
        
        // N for next article
        if (e.key === 'n' || e.key === 'N') {
            const nextBtn = document.querySelector('.nav-link.primary');
            if (nextBtn) {
                e.preventDefault();
                nextBtn.click();
            }
        }
        
        // P for previous article
        if (e.key === 'p' || e.key === 'P') {
            const prevBtn = document.querySelector('.nav-link:not(.primary)');
            if (prevBtn && !prevBtn.classList.contains('primary')) {
                e.preventDefault();
                prevBtn.click();
            }
        }
        
        // Esc to exit reading mode
        if (e.key === 'Escape' && document.body.classList.contains('reading-mode')) {
            document.body.classList.remove('reading-mode');
        }
    });
    
    // Add reading mode styles
    const style = document.createElement('style');
    style.textContent = `
        .reading-mode {
            background: #0a0a0a !important;
        }
        .reading-mode .sidenav,
        .reading-mode .sidenav-toggle,
        .reading-mode .section-nav,
        .reading-mode .simple-footer {
            display: none !important;
        }
        .reading-mode .main-content {
            margin-left: 0 !important;
            padding: 2rem !important;
            max-width: 800px !important;
            margin: 0 auto !important;
        }
        .reading-mode .hero-section {
            margin-top: 2rem;
        }
    `;
    document.head.appendChild(style);
}

// ======================
// PRINT STYLES
// ======================

function setupPrintStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            .sidenav, .sidenav-toggle, .scanlines, .glow-effect,
            .reading-progress, .section-nav, .notification,
            .simple-footer, .navigation {
                display: none !important;
            }
            
            .main-content {
                margin-left: 0 !important;
                padding: 0 !important;
                width: 100% !important;
            }
            
            body {
                background: white !important;
                color: black !important;
                font-family: 'Georgia', 'Times New Roman', serif !important;
                font-size: 12pt !important;
            }
            
            .hero-content h1 {
                color: black !important;
                font-size: 24pt !important;
                margin-bottom: 1rem !important;
            }
            
            .hero-subtitle {
                color: #666 !important;
                font-size: 14pt !important;
            }
            
            .content-section h3,
            .article-section h3 {
                color: black !important;
                border-bottom: 2px solid #ccc !important;
                page-break-after: avoid !important;
            }
            
            .simple-box,
            .note,
            .characteristic,
            .application,
            .insight {
                background: #f9f9f9 !important;
                border: 1px solid #ddd !important;
                border-left: 3px solid #666 !important;
                color: #444 !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
            }
            
            .simple-box h3,
            .simple-box h4,
            .note h4 {
                color: #333 !important;
            }
            
            a {
                color: #0066cc !important;
                text-decoration: underline !important;
            }
            
            .distinction-table {
                border: 1px solid #ccc !important;
            }
            
            .distinction-table th {
                background: #f0f0f0 !important;
                color: black !important;
                border: 1px solid #ccc !important;
            }
            
            .distinction-table td {
                border: 1px solid #ccc !important;
                color: #333 !important;
            }
            
            .quote-author {
                color: #666 !important;
                text-align: right !important;
            }
            
            /* Ensure good page breaks */
            .article-section {
                page-break-inside: avoid !important;
                margin-bottom: 2rem !important;
            }
            
            .simple-divider {
                background: #ccc !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// ======================
// RESPONSIVE BEHAVIOR
// ======================

function setupResponsiveBehavior() {
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Close mobile nav on resize to desktop
            if (window.innerWidth > 1024) {
                const sidenav = document.getElementById('sidenav');
                const sidenavToggle = document.getElementById('sidenavToggle');
                
                if (sidenav && sidenav.classList.contains('active')) {
                    sidenav.classList.remove('active');
                    if (sidenavToggle) {
                        const icon = sidenavToggle.querySelector('i');
                        if (icon) {
                            icon.classList.add('fa-bars');
                            icon.classList.remove('fa-times');
                        }
                    }
                }
            }
        }, 250);
    });
}

// ======================
// UTILITY FUNCTIONS
// ======================

function getWordCount() {
    const articleContent = document.querySelector('.content-section') || document.querySelector('article');
    if (!articleContent) return 0;
    
    const text = articleContent.textContent || '';
    return text.trim().split(/\s+/).length;
}

function getReadingTime() {
    const wordCount = getWordCount();
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
}

// ======================
// EXPORT FOR MODULE USAGE
// ======================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        getWordCount, 
        getReadingTime,
        trackReadingProgress,
        updateSeriesProgress
    };
}