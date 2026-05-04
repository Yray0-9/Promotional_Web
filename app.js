(function () {
    'use strict';

    // Change this single value to tune animation character globally.
    var MOTION_FEEL = 'bold'; // subtle | balanced | bold

    var MOTION_PRESETS = {
        subtle: {
            introReadyDelay: 35,
            staggerStep: 0.07,
            staggerMaxIndex: 4,
            revealThreshold: 0.08,
            revealRootMargin: '0px 0px -14% 0px'
        },
        balanced: {
            introReadyDelay: 55,
            staggerStep: 0.1,
            staggerMaxIndex: 5,
            revealThreshold: 0.06,
            revealRootMargin: '0px 0px -10% 0px'
        },
        bold: {
            introReadyDelay: 75,
            staggerStep: 0.12,
            staggerMaxIndex: 6,
            revealThreshold: 0.04,
            revealRootMargin: '0px 0px -8% 0px'
        }
    };

    function getMotionConfig() {
        return MOTION_PRESETS[MOTION_FEEL] || MOTION_PRESETS.balanced;
    }

    function applyMotionFeel(config) {
        document.body.setAttribute('data-motion-feel', MOTION_FEEL);
        document.documentElement.style.setProperty('--motion-stagger-step', config.staggerStep + 's');
    }

    function showToast(message, duration) {
        duration = duration || 2600;
        var toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('show');
        window.clearTimeout(window._cocosToastTimer);
        window._cocosToastTimer = window.setTimeout(function () {
            toast.classList.remove('show');
        }, duration);
    }

    function initScrollProgress() {
        var indicator = document.getElementById('scrollIndicator');
        if (!indicator) return;

        function update() {
            var scrollTop = window.scrollY || document.documentElement.scrollTop;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            indicator.style.width = scrollPercent + '%';
        }

        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    function initNavToggle() {
        var navToggle = document.getElementById('navToggle');
        var mainNav = document.getElementById('mainNav');
        if (!navToggle || !mainNav) return;

        navToggle.addEventListener('click', function () {
            var isOpen = mainNav.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.body.classList.toggle('nav-open', isOpen);
        });

        document.addEventListener('keyup', function (e) {
            if ((e.key === 'Escape' || e.keyCode === 27) && mainNav.classList.contains('open')) {
                mainNav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('nav-open');
            }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 768 && mainNav.classList.contains('open')) {
                mainNav.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('nav-open');
            }
        });
    }

    function initSmoothScroll() {
        var mainNav = document.getElementById('mainNav');
        var navToggle = document.getElementById('navToggle');

        function easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function smoothScrollToY(targetY, duration, callback) {
            var startY = window.pageYOffset;
            var distance = targetY - startY;
            var startTime = performance.now();

            function step(now) {
                var elapsed = now - startTime;
                var progress = Math.min(elapsed / duration, 1);
                var eased = easeInOutCubic(progress);
                window.scrollTo(0, Math.round(startY + distance * eased));
                if (progress < 1) {
                    requestAnimationFrame(step);
                } else if (typeof callback === 'function') {
                    callback();
                }
            }

            requestAnimationFrame(step);
        }

        document.querySelectorAll('a[href^="#"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (!href || href === '#') return;

                var target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();

                function doScroll() {
                    var header = document.querySelector('header');
                    var headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
                    var rect = target.getBoundingClientRect();
                    var targetY = window.pageYOffset + rect.top - headerHeight - 12;

                    smoothScrollToY(targetY, 700, function () {
                        try {
                            target.setAttribute('tabindex', '-1');
                            target.focus({ preventScroll: true });
                        } catch (_err) {}

                        if (target.hasAttribute('id')) {
                            target.style.animation = 'scrollHighlight .6s ease-out';
                            setTimeout(function () {
                                target.style.animation = '';
                            }, 650);
                        }
                    });
                }

                if (mainNav && mainNav.classList.contains('open')) {
                    mainNav.classList.remove('open');
                    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
                    document.body.classList.remove('nav-open');
                    setTimeout(doScroll, 60);
                } else {
                    doScroll();
                }
            });
        });
    }

    function initNewsletter() {
        var newsletterForm = document.querySelector('.newsletter-form');
        if (!newsletterForm) return;

        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = (this.email && this.email.value || '').trim();
            var note = this.querySelector('.form-note');
            var btn = this.querySelector('button[type="submit"]');

            if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                if (note) note.textContent = 'Please enter a valid email address.';
                return;
            }

            var original = btn ? btn.textContent : 'Subscribe';
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Subscribing...';
            }

            setTimeout(function () {
                if (btn) btn.textContent = 'Subscribed';
                if (note) note.textContent = 'Thanks! Check your inbox for a welcome message.';
                showToast('Subscribed - check your inbox!');
                newsletterForm.reset();

                setTimeout(function () {
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = original;
                    }
                    if (note) note.textContent = '';
                }, 2500);
            }, 900);
        });
    }

    function initPageIntro(config) {
        var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            document.body.classList.add('page-ready');
            return;
        }
        requestAnimationFrame(function () {
            setTimeout(function () {
                document.body.classList.add('page-ready');
            }, config.introReadyDelay);
        });
    }

    function initRevealOnScroll(config) {
        var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var groups = [
            { selector: '.problem-content > *', mode: 'rise' },
            { selector: '.solution-content > *', mode: 'rise' },
            { selector: '.products-grid .product-card', mode: 'scale' },
            { selector: '.benefits-grid .benefit-card', mode: 'scale' },
            { selector: '.testimonials-grid .testimonial-card', mode: 'rise' },
            { selector: '.sustainability-content .sustainability-item', mode: 'rise' },
            { selector: '.impact-counters .counter', mode: 'scale' },
            { selector: '.footer .footer-section', mode: 'rise' },
            { selector: '.cta-section .container', mode: 'rise' },
            { selector: '.section-title', mode: 'rise' }
        ];

        var seen = [];
        groups.forEach(function (group) {
            var nodes = document.querySelectorAll(group.selector);
            nodes.forEach(function (el, i) {
                if (seen.indexOf(el) !== -1) return;
                seen.push(el);
                if (!el.classList.contains('reveal')) el.classList.add('reveal');
                if (group.mode === 'scale') el.classList.add('reveal-scale');
                var stagger = Math.min(i, config.staggerMaxIndex) * config.staggerStep;
                el.style.setProperty('--delay', stagger + 's');
            });
        });

        if (prefersReduced) {
            seen.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var observer = null;
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: config.revealThreshold, rootMargin: config.revealRootMargin });
        }

        function revealIfVisible() {
            seen.forEach(function (el) {
                if (el.classList.contains('is-visible')) return;
                var rect = el.getBoundingClientRect();
                var inView = rect.top <= (window.innerHeight * 0.9) && rect.bottom >= 24;
                if (inView) el.classList.add('is-visible');
            });
        }

        seen.forEach(function (el) {
            if (observer) observer.observe(el);
        });

        setTimeout(revealIfVisible, 100);
        window.addEventListener('scroll', revealIfVisible, { passive: true });
        window.addEventListener('resize', revealIfVisible);
    }

    function initCounters() {
        var items = document.querySelectorAll('.counter');
        if (!items.length) return;

        function runCount(el) {
            var target = parseInt(el.getAttribute('data-target') || '0', 10);
            var display = el.querySelector('.count');
            var duration = 1400;
            var startTime = null;

            function step(ts) {
                if (!startTime) startTime = ts;
                var progress = Math.min((ts - startTime) / duration, 1);
                var value = Math.floor(progress * target);
                if (display) display.textContent = value.toLocaleString();
                if (progress < 1) requestAnimationFrame(step);
            }

            requestAnimationFrame(step);
        }

        if ('IntersectionObserver' in window) {
            var obs = new IntersectionObserver(function (entries, observer) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        runCount(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });
            items.forEach(function (it) { obs.observe(it); });
        } else {
            items.forEach(function (it) { runCount(it); });
        }
    }

    function initQuickView() {
        var modal = document.getElementById('quickViewModal');
        if (!modal) return;

        var lastFocus = null;
        function open(data) {
            lastFocus = document.activeElement;
            modal.setAttribute('aria-hidden', 'false');
            modal.classList.add('open');
            modal.querySelector('.modal-title').textContent = data.name || '';
            modal.querySelector('.modal-price').textContent = data.price || '';
            modal.querySelector('.modal-desc').textContent = data.desc || '';

            var add = modal.querySelector('.modal-actions .add-btn');
            if (add) {
                add.dataset.name = data.name || '';
                add.dataset.price = data.price || '';
            }

            var closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) closeBtn.focus();
        }

        function close() {
            modal.setAttribute('aria-hidden', 'true');
            modal.classList.remove('open');
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }

        document.addEventListener('click', function (e) {
            var viewBtn = e.target.closest('.view-btn');
            if (viewBtn) {
                e.preventDefault();
                open({
                    name: viewBtn.dataset.name,
                    price: viewBtn.dataset.price,
                    desc: viewBtn.dataset.desc
                });
                return;
            }

            var addBtn = e.target.closest('.add-btn');
            if (addBtn && !e.target.closest('.modal-panel')) {
                var name = addBtn.dataset.name || addBtn.getAttribute('data-name') || 'item';
                showToast('Added ' + name + ' to cart');
                return;
            }

            if (e.target.closest('[data-close]') || e.target === modal) {
                close();
            }
        });

        modal.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') close();
            if (e.key !== 'Tab') return;

            var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            focusable = Array.prototype.filter.call(focusable, function (el) {
                return el.offsetParent !== null && !el.disabled;
            });
            if (!focusable.length) return;

            var first = focusable[0];
            var last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });

        var modalActions = modal.querySelector('.modal-actions');
        if (modalActions) {
            modalActions.addEventListener('click', function (e) {
                var addBtn = e.target.closest('.add-btn');
                if (!addBtn) return;
                showToast('Added ' + (addBtn.dataset.name || 'item') + ' to cart');
                close();
            });
        }
    }

    function initInteractiveMotion() {
        var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        var finePointer = window.matchMedia('(pointer:fine)').matches;

        if (finePointer) {
            var hero = document.querySelector('.hero');
            var heroVisual = document.querySelector('.hero-right');

            if (hero && heroVisual) {
                hero.addEventListener('mousemove', function (e) {
                    var rect = hero.getBoundingClientRect();
                    var x = (e.clientX - rect.left) / rect.width;
                    var y = (e.clientY - rect.top) / rect.height;
                    var rotateY = (x - 0.5) * 8;
                    var rotateX = (0.5 - y) * 6;
                    heroVisual.style.transform = 'perspective(900px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateY(-2px)';
                });

                hero.addEventListener('mouseleave', function () {
                    heroVisual.style.transform = '';
                });
            }

            document.querySelectorAll('.product-card').forEach(function (card) {
                card.addEventListener('mousemove', function (e) {
                    var rect = card.getBoundingClientRect();
                    var px = (e.clientX - rect.left) / rect.width;
                    var py = (e.clientY - rect.top) / rect.height;
                    var tiltY = (px - 0.5) * 6;
                    var tiltX = (0.5 - py) * 5;
                    card.style.transform = 'perspective(860px) rotateX(' + tiltX.toFixed(2) + 'deg) rotateY(' + tiltY.toFixed(2) + 'deg) translateY(-6px)';
                });

                card.addEventListener('mouseleave', function () {
                    card.style.transform = '';
                });
            });
        }

        document.addEventListener('click', function (e) {
            var trigger = e.target.closest('.btn-primary, .btn-outline, .cta-button');
            if (!trigger) return;

            var rect = trigger.getBoundingClientRect();
            var ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            trigger.appendChild(ripple);
            setTimeout(function () { ripple.remove(); }, 700);
        });
    }

    function initSmartHeaderAndScrollspy() {
        var header = document.querySelector('header');
        var navLinks = Array.prototype.slice.call(document.querySelectorAll('nav a[href^="#"]'));
        var sections = navLinks
            .map(function (link) { return document.querySelector(link.getAttribute('href')); })
            .filter(Boolean);

        if (!header || !navLinks.length || !sections.length) return;

        function refreshState() {
            var y = window.scrollY || document.documentElement.scrollTop;
            header.classList.toggle('scrolled', y > 18);

            var headerHeight = Math.ceil(header.getBoundingClientRect().height);
            var probe = y + headerHeight + 80;
            var activeId = '';

            sections.forEach(function (section) {
                var top = section.offsetTop;
                var bottom = top + section.offsetHeight;
                if (probe >= top && probe < bottom) activeId = section.id;
            });

            navLinks.forEach(function (link) {
                var href = link.getAttribute('href');
                var isActive = href === '#' + activeId;
                link.classList.toggle('is-active', isActive);
                if (isActive) {
                    link.setAttribute('aria-current', 'page');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        }

        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                refreshState();
                ticking = false;
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        refreshState();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var motionConfig = getMotionConfig();
        applyMotionFeel(motionConfig);
        initPageIntro(motionConfig);
        initScrollProgress();
        initNavToggle();
        initSmoothScroll();
        initNewsletter();
        initRevealOnScroll(motionConfig);
        initCounters();
        initQuickView();
        initInteractiveMotion();
        initSmartHeaderAndScrollspy();
    });

    window.showToast = showToast;
})();
