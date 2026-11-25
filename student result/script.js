        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, character => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[character]);
        }

        function renderHomePage() {
            document.getElementById('public-app').innerHTML = `
                <main class="public-page">
                    <section class="home-content" aria-labelledby="home-title">
                        <div class="brand-mark"><img src="images/logo.jpg" alt="NIYD logo"></div>
                        <h1 class="home-title" id="home-title"> NIYD  Result management System</h1>
                        <p class="home-subtitle">National Inastitute of Youth Devlopment</p>
                        <nav class="home-actions" aria-label="Account options">
                            <a class="public-button" href="#/signup"><i class="fa-solid fa-user-plus"></i>Sign Up</a>
                            <a class="public-button secondary" href="#/login"><i class="fa-solid fa-right-to-bracket"></i>Login</a>
                        </nav>
                    </section>
                </main>
            `;
        }

        function renderAuthPage(mode) {
            const isSignup = mode === 'signup';
            const title = isSignup ? 'Create your account' : 'Welcome back';
            const description = isSignup
                ? 'Sign up and choose the portal that matches your role.'
                : 'Sign in with your account and select your role.';
            const nameField = isSignup ? `
                <div class="auth-field">
                    <label for="auth-name">Full name</label>
                    <input id="auth-name" name="name" type="text" autocomplete="name" required maxlength="80">
                </div>
            ` : '';

            document.getElementById('public-app').innerHTML = `
                <main class="public-page">
                    <section class="auth-card" aria-labelledby="auth-title">
                        <div class="brand-mark"><img src="images/logo.jpg" alt="NIYD logo"></div>
                        <h1 id="auth-title">${title}</h1>
                        <p class="auth-intro">${description}</p>
                        <form class="auth-form" onsubmit="handleAuthSubmit(event, '${mode}')">
                            ${nameField}
                            <div class="auth-field">
                                <label for="auth-email">Email address</label>
                                <input id="auth-email" name="email" type="email" autocomplete="email" required maxlength="254">
                            </div>
                            <div class="auth-field">
                                <label for="auth-password">Password</label>
                                <input id="auth-password" name="password" type="password"
                                    autocomplete="${isSignup ? 'new-password' : 'current-password'}" required minlength="6">
                            </div>
                            <div class="auth-field">
                                <label for="auth-role">I am a</label>
                                <select id="auth-role" name="role" required>
                                    <option value="admin">Admin</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>
                            <p class="auth-message" id="auth-message" role="alert" aria-live="polite"></p>
                            <button class="public-button" type="submit">${isSignup ? 'Create account' : 'Login'}<i class="fa-solid fa-arrow-right"></i></button>
                        </form>
                        <p class="auth-footer">
                            ${isSignup
                                ? `Already registered? <a href="#/login">Login</a>`
                                : `New to Result System? <a href="#/signup">Sign up</a>`}
                        </p>
                        <p class="demo-note">Demo mode: accounts are stored in this browser only. Production authentication requires a secure server.</p>
                        <a class="back-home" href="#/">← Back to home</a>
                    </section>
                </main>
            `;
        }

        function showAuthMessage(message) {
            const messageElement = document.getElementById('auth-message');
            if (messageElement) messageElement.textContent = message;
        }

        async function handleAuthSubmit(event, mode) {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const credentials = {
                name: String(formData.get('name') || '').trim(),
                email: String(formData.get('email') || '').trim().toLowerCase(),
                password: String(formData.get('password') || ''),
                role: String(formData.get('role') || '')
            };

            try {
                const user = mode === 'signup'
                    ? await window.authService.signUp(credentials)
                    : await window.authService.signIn(credentials);
                window.location.hash = `#/portal/${user.role}`;
            } catch (error) {
                console.error('Authentication failed:', error);
                showAuthMessage(error.message || 'Unable to complete authentication. Please try again.');
            }
        }

        function renderAuthenticatedPortal(role, session) {
            const internalRole = role === 'teacher' ? 'instructor' : role;
            document.getElementById('public-app').classList.add('hidden');
            document.getElementById('portal-app').classList.remove('hidden');
            appState.currentUser = session;
            changeRole(internalRole);
            document.getElementById('user-display-name').textContent = session.name;
            document.getElementById('user-avatar').alt = `${session.name} avatar`;
            const studentWelcome = document.getElementById('student-welcome');
            if (studentWelcome) studentWelcome.textContent = `Welcome back, ${session.name}`;
        }

        async function routePublicApp() {
            const route = window.location.hash.replace(/^#\/?/, '');
            const [page, role] = route.split('/');

            document.getElementById('portal-app').classList.add('hidden');
            document.getElementById('public-app').classList.remove('hidden');

            if (page === 'portal') {
                try {
                    const session = await window.authService.getCurrentUser();
                    if (!session) {
                        window.location.hash = '#/login';
                        return;
                    }
                    if (role !== session.role) {
                        window.location.hash = `#/portal/${session.role}`;
                        return;
                    }
                    renderAuthenticatedPortal(session.role, session);
                } catch (error) {
                    console.error('Unable to restore the saved session:', error);
                    window.location.hash = '#/login';
                }
            } else if (page === 'signup' || page === 'login') {
                renderAuthPage(page);
            } else {
                renderHomePage();
            }
        }

        async function logoutToHome() {
            try {
                await window.authService.signOut();
                window.location.hash = '#/';
                if (!window.location.hash || window.location.hash === '#/') routePublicApp();
            } catch (error) {
                console.error('Unable to clear the saved session:', error);
                showToast('Could not clear the saved session. Please try again.', 'error');
            }
        }

        // System Data Models & Sample Academic Data
        const appState = {
            currentRole: 'admin', // 'admin', 'instructor', 'student'
            currentView: 'admin-dashboard',
            currentUser: null,

            // Sample Data - NIYD Courses & Results
            courses: [
                {id: 'HDCA-101', name: 'Diploma in Computer Applications', dept: 'Information Technology', duration: '1 Year', batches: '2025-01, 2025-02'},
                {id: 'ITWD-201', name: 'Web Development & E-Commerce', dept: 'Software Engineering', duration: '6 Months', batches: '2025-A, 2025-B'},
                {id: 'MAD-301', name: 'Mobile Application Development', dept: 'Software Engineering', duration: '6 Months', batches: '2025-01'},
                {id: 'GDUI-401', name: 'UI/UX & Graphics Design', dept: 'Creative Arts', duration: '3 Months', batches: '2025-C'}
            ],

            instructors: [
                {id: 'INS-101', name: 'Engr. Tanvir Ahmed', email: 'tanvir@niyd.gov.bd', dept: 'Software Engineering', phone: '+880 1711-000000', coursesAssigned: 3},
                {id: 'INS-102', name: 'Nusrat Jahan', email: 'nusrat@niyd.gov.bd', dept: 'Creative Arts', phone: '+880 1819-111222', coursesAssigned: 2},
                {id: 'INS-103', name: 'Md. Kamrul Hasan', email: 'kamrul@niyd.gov.bd', dept: 'Information Technology', phone: '+880 1912-333444', coursesAssigned: 4}
            ],

            students: [
                {id: 'NIYD-2025-001', name: 'Rafiqul Islam', batch: '2025-01', course: 'HDCA-101', email: 'rafiq@gmail.com', status: 'Active', cgpa: 3.85},
                {id: 'NIYD-2025-002', name: 'Sabrina Sultana', batch: '2025-01', course: 'HDCA-101', email: 'sabrina@gmail.com', status: 'Active', cgpa: 3.92},
                {id: 'NIYD-2025-003', name: 'Arik Hasan', batch: '2025-01', course: 'ITWD-201', email: 'arik@gmail.com', status: 'Active', cgpa: 3.60},
                {id: 'NIYD-2025-004', name: 'Mehedi Hasan Joy', batch: '2025-02', course: 'MAD-301', email: 'joy@gmail.com', status: 'Active', cgpa: 3.75},
                {id: 'NIYD-2025-005', name: 'Fatima Zohra', batch: '2025-02', course: 'GDUI-401', email: 'fatima@gmail.com', status: 'Active', cgpa: 4.00}
            ],

            // Assessment Entry Sheet State
            marksData: [
                {id: 'NIYD-2025-001', name: 'Rafiqul Islam', quiz: 18, mid: 27, final: 42, total: 87, grade: 'A+', gpa: 4.00, status: 'Submitted'},
                {id: 'NIYD-2025-002', name: 'Sabrina Sultana', quiz: 19, mid: 28, final: 45, total: 92, grade: 'A+', gpa: 4.00, status: 'Submitted'},
                {id: 'NIYD-2025-003', name: 'Arik Hasan', quiz: 14, mid: 22, final: 36, total: 72, grade: 'A-', gpa: 3.50, status: 'Draft'},
                {id: 'NIYD-2025-004', name: 'Mehedi Hasan Joy', quiz: 16, mid: 24, final: 38, total: 78, grade: 'A', gpa: 3.75, status: 'Submitted'},
                {id: 'NIYD-2025-005', name: 'Fatima Zohra', quiz: 20, mid: 29, final: 46, total: 95, grade: 'A+', gpa: 4.00, status: 'Submitted'}
            ]
        };

        // Navigation Structure by Role
        const navStructures = {
            admin: [
                {id: 'admin-dashboard', icon: 'fa-gauge-high', label: 'Admin Dashboard'},
                {id: 'student-mgmt', icon: 'fa-user-graduate', label: 'Student Directory'},
                {id: 'instructor-mgmt', icon: 'fa-chalkboard-user', label: 'Instructors'},
                {id: 'course-mgmt', icon: 'fa-book-bookmark', label: 'Courses & Batches'},
                {id: 'grading-scale', icon: 'fa-sliders', label: 'Grading Rules & Weight'},
                {id: 'exam-schedule', icon: 'fa-calendar-days', label: 'Exam Timetables'},
                {id: 'marks-entry', icon: 'fa-file-pen', label: 'Marks Entry Hub'},
                {id: 'result-approval', icon: 'fa-clipboard-check', label: 'Result Approvals', badge: '2 Pending'},
                {id: 'analytics', icon: 'fa-chart-pie', label: 'Analytics & Reports'},
                {id: 'settings', icon: 'fa-gear', label: 'System Settings'}
            ],
            instructor: [
                {id: 'instructor-dashboard', icon: 'fa-gauge', label: 'Teacher Dashboard'},
                {id: 'marks-entry', icon: 'fa-table-cells', label: 'Marks Entry Sheet'},
                {id: 'exam-schedule', icon: 'fa-calendar-check', label: 'Assigned Exams'},
                {id: 'subject-reports', icon: 'fa-chart-line', label: 'Class Performance'},
                {id: 'profile', icon: 'fa-user', label: 'My Account'}
            ],
            student: [
                {id: 'student-dashboard', icon: 'fa-house-user', label: 'Student Portal'},
                {id: 'student-result', icon: 'fa-graduation-cap', label: 'My Academic Results'},
                {id: 'official-marksheet', icon: 'fa-file-pdf', label: 'Download Marksheet'},
                {id: 'exam-schedule', icon: 'fa-clock', label: 'Exam Schedule'},
                {id: 'profile', icon: 'fa-id-card', label: 'Student Profile'}
            ]
        };

        // Bangladeshi Standard Grading Scale Utility
        function calculateGradingBD(totalScore) {
            if (totalScore >= 80) return {grade: 'A+', gpa: 4.00, remark: 'Outstanding'};
            if (totalScore >= 75) return {grade: 'A', gpa: 3.75, remark: 'Excellent'};
            if (totalScore >= 70) return {grade: 'A-', gpa: 3.50, remark: 'Very Good'};
            if (totalScore >= 65) return {grade: 'B+', gpa: 3.25, remark: 'Good'};
            if (totalScore >= 60) return {grade: 'B', gpa: 3.00, remark: 'Satisfactory'};
            if (totalScore >= 55) return {grade: 'B-', gpa: 2.75, remark: 'Above Average'};
            if (totalScore >= 50) return {grade: 'C+', gpa: 2.50, remark: 'Average'};
            if (totalScore >= 45) return {grade: 'C', gpa: 2.25, remark: 'Below Average'};
            if (totalScore >= 40) return {grade: 'D', gpa: 2.00, remark: 'Pass'};
            return {grade: 'F', gpa: 0.00, remark: 'Fail'};
        }

        // Role Switching Function
        function changeRole(role) {
            appState.currentRole = role;

            // Update UI Header details
            const nameEl = document.getElementById('user-display-name');
            const roleEl = document.getElementById('user-display-role');
            const avatarEl = document.getElementById('user-avatar');

            if (role === 'admin') {
                nameEl.innerText = 'Engr. M. A. Rahman';
                roleEl.innerText = 'Super Administrator';
                avatarEl.src = 'https://placehold.co/100x100/173B67/FFFFFF?text=ADM';
                appState.currentView = 'admin-dashboard';
            } else if (role === 'instructor') {
                nameEl.innerText = 'Engr. Tanvir Ahmed';
                roleEl.innerText = 'Teacher';
                avatarEl.src = 'https://placehold.co/100x100/14B8A6/FFFFFF?text=INS';
                appState.currentView = 'instructor-dashboard';
            } else {
                nameEl.innerText = 'Rafiqul Islam';
                roleEl.innerText = 'Student (ID: NIYD-2025-001)';
                avatarEl.src = 'https://placehold.co/100x100/0F172A/FFFFFF?text=STU';
                appState.currentView = 'student-dashboard';
            }

            renderSidebar();
            switchView(appState.currentView);
            showToast(`Switched to ${role.toUpperCase()} View`);
        }

        // Render Sidebar Navigation
        function renderSidebar() {
            const navContainer = document.getElementById('dynamic-nav-links');
            const links = navStructures[appState.currentRole];

            navContainer.innerHTML = links.map(link => `
        <button onclick="switchView('${link.id}')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${appState.currentView === link.id ? 'bg-niyd-teal text-white font-semibold shadow' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}">
          <div class="flex items-center space-x-3">
            <i class="fa-solid ${link.icon} w-4 text-center ${appState.currentView === link.id ? 'text-white' : 'text-niyd-teal'}"></i>
            <span>${link.label}</span>
          </div>
          ${link.badge ? `<span class="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">${link.badge}</span>` : ''}
        </button>
      `).join('');
        }

        // Switch Screen/View Router
        function switchView(viewId) {
            appState.currentView = viewId;
            renderSidebar();
            const container = document.getElementById('main-content-container');

            // Screen Router
            switch (viewId) {
                case 'login':
                    container.innerHTML = renderLoginView();
                    break;
                case 'admin-dashboard':
                    container.innerHTML = renderAdminDashboard();
                    break;
                case 'student-mgmt':
                    container.innerHTML = renderStudentManagement();
                    break;
                case 'instructor-mgmt':
                    container.innerHTML = renderInstructorManagement();
                    break;
                case 'course-mgmt':
                    container.innerHTML = renderCourseManagement();
                    break;
                case 'grading-scale':
                    container.innerHTML = renderGradingScaleSettings();
                    break;
                case 'exam-schedule':
                    container.innerHTML = renderExamScheduling();
                    break;
                case 'marks-entry':
                    container.innerHTML = renderMarksEntrySheet();
                    break;
                case 'result-approval':
                    container.innerHTML = renderResultApprovalPage();
                    break;
                case 'analytics':
                    container.innerHTML = renderAnalyticsDashboard();
                    break;
                case 'instructor-dashboard':
                    container.innerHTML = renderInstructorDashboard();
                    break;
                case 'student-dashboard':
                    container.innerHTML = renderStudentDashboard();
                    break;
                case 'student-result':
                    container.innerHTML = renderStudentResultDetail();
                    break;
                case 'official-marksheet':
                    container.innerHTML = renderOfficialMarksheet();
                    break;
                case 'figma-specs':
                    container.innerHTML = renderFigmaSpecsView();
                    break;
                case 'profile':
                case 'settings':
                case 'notifications':
                    container.innerHTML = renderProfileSettingsView();
                    break;
                default:
                    container.innerHTML = renderAdminDashboard();
            }

            // Close mobile sidebar if open
            const sidebar = document.getElementById('sidebar');
            if (!sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.add('-translate-x-full');
            }
        }

        // Toggle Mobile Sidebar
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('-translate-x-full');
        }

        // Toggle Notifications Box
        function toggleNotifications() {
            const box = document.getElementById('notification-box');
            box.classList.toggle('hidden');
        }

        // Toast Alert Helper
        function showToast(message, type = 'success') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');

            const bgColor = type === 'success' ? 'bg-slate-900 border-niyd-teal' : 'bg-slate-900 border-rose-500';
            const icon = type === 'success' ? 'fa-circle-check text-niyd-teal' : 'fa-triangle-exclamation text-rose-500';

            toast.className = `pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-lg text-white text-xs font-medium border shadow-xl transition transform translate-y-2 ${bgColor}`;
            toast.innerHTML = `
        <i class="fa-solid ${icon} text-base"></i>
        <span>${message}</span>
      `;

            container.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }

        // ==========================================
        // VIEW RENDER FUNCTIONS
        // ==========================================

        // 1. ADMIN DASHBOARD VIEW
        function renderAdminDashboard() {
            return `
        <div class="space-y-6">
          <!-- Page Header -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 class="text-xl md:text-2xl font-bold text-niyd-textDark">Administrator Dashboard</h2>
              <p class="text-xs md:text-sm text-niyd-textMuted">Overview of NIYD Result Management, Examinations, and Academic Performance.</p>
            </div>
            <div class="flex space-x-2">
              <button onclick="switchView('exam-schedule')" class="bg-niyd-navy hover:bg-niyd-navyHover text-white text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center space-x-2 transition">
                <i class="fa-solid fa-plus"></i>
                <span>Schedule New Exam</span>
              </button>
              <button onclick="switchView('result-approval')" class="bg-niyd-teal hover:bg-niyd-tealHover text-white text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center space-x-2 transition shadow">
                <i class="fa-solid fa-check-double"></i>
                <span>Review Pending Results</span>
              </button>
            </div>
          </div>

          <!-- Overview Stat Cards Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="glass-card p-5 border-l-4 border-niyd-navy">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-xs font-semibold text-niyd-textMuted uppercase tracking-wider">Total Enrolled Students</p>
                  <h3 class="text-2xl font-extrabold text-niyd-textDark mt-1">1,248</h3>
                  <span class="text-[11px] text-emerald-600 font-semibold flex items-center mt-1">
                    <i class="fa-solid fa-arrow-trend-up mr-1"></i> +12% from last term
                  </span>
                </div>
                <div class="p-3 bg-slate-100 text-niyd-navy rounded-xl">
                  <i class="fa-solid fa-user-graduate text-xl"></i>
                </div>
              </div>
            </div>

            <div class="glass-card p-5 border-l-4 border-niyd-teal">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-xs font-semibold text-niyd-textMuted uppercase tracking-wider">Active Instructors</p>
                  <h3 class="text-2xl font-extrabold text-niyd-textDark mt-1">42</h3>
                  <span class="text-[11px] text-slate-500 font-medium mt-1 block">Across 8 Academic Departments</span>
                </div>
                <div class="p-3 bg-teal-50 text-niyd-teal rounded-xl">
                  <i class="fa-solid fa-chalkboard-user text-xl"></i>
                </div>
              </div>
            </div>

            <div class="glass-card p-5 border-l-4 border-amber-500">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-xs font-semibold text-niyd-textMuted uppercase tracking-wider">Upcoming Exams</p>
                  <h3 class="text-2xl font-extrabold text-niyd-textDark mt-1">14</h3>
                  <span class="text-[11px] text-amber-600 font-semibold mt-1 block">Fall Term 2026</span>
                </div>
                <div class="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <i class="fa-solid fa-calendar-week text-xl"></i>
                </div>
              </div>
            </div>

            <div class="glass-card p-5 border-l-4 border-emerald-500">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-xs font-semibold text-niyd-textMuted uppercase tracking-wider">Published Results</p>
                  <h3 class="text-2xl font-extrabold text-niyd-textDark mt-1">94.2%</h3>
                  <span class="text-[11px] text-emerald-600 font-semibold mt-1 block">2 Approvals Pending</span>
                </div>
                <div class="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <i class="fa-solid fa-square-check text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts & Quick Actions Row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Academic Performance Visual Chart (SVG Bar Chart) -->
            <div class="glass-card p-5 lg:col-span-2">
              <div class="flex justify-between items-center mb-4">
                <div>
                  <h3 class="text-sm font-bold text-niyd-textDark">Department Pass Rates (%)</h3>
                  <p class="text-xs text-niyd-textMuted">Average performance for current semester</p>
                </div>
                <select class="text-xs border border-slate-300 rounded-md px-2 py-1 focus:outline-none">
                  <option>Term 2025-2026</option>
                  <option>Term 2024-2025</option>
                </select>
              </div>

              <!-- SVG Visualizing Pass Rate -->
              <div class="w-full h-56 flex items-end justify-between px-4 pt-6 pb-2 bg-slate-50 rounded-lg border border-slate-100">
                <div class="flex flex-col items-center flex-1 h-full justify-end group">
                  <span class="text-[10px] font-bold text-slate-600 mb-1">92%</span>
                  <div class="w-10 bg-niyd-navy group-hover:bg-niyd-teal transition-all rounded-t-md" style="height: 85%;"></div>
                  <span class="text-[11px] text-slate-500 mt-2 font-medium">Comp. App</span>
                </div>
                <div class="flex flex-col items-center flex-1 h-full justify-end group">
                  <span class="text-[10px] font-bold text-slate-600 mb-1">88%</span>
                  <div class="w-10 bg-niyd-navy group-hover:bg-niyd-teal transition-all rounded-t-md" style="height: 78%;"></div>
                  <span class="text-[11px] text-slate-500 mt-2 font-medium">Web Dev</span>
                </div>
                <div class="flex flex-col items-center flex-1 h-full justify-end group">
                  <span class="text-[10px] font-bold text-slate-600 mb-1">95%</span>
                  <div class="w-10 bg-niyd-navy group-hover:bg-niyd-teal transition-all rounded-t-md" style="height: 92%;"></div>
                  <span class="text-[11px] text-slate-500 mt-2 font-medium">Mobile App</span>
                </div>
                <div class="flex flex-col items-center flex-1 h-full justify-end group">
                  <span class="text-[10px] font-bold text-slate-600 mb-1">84%</span>
                  <div class="w-10 bg-niyd-navy group-hover:bg-niyd-teal transition-all rounded-t-md" style="height: 72%;"></div>
                  <span class="text-[11px] text-slate-500 mt-2 font-medium">UI/UX Graphic</span>
                </div>
                <div class="flex flex-col items-center flex-1 h-full justify-end group">
                  <span class="text-[10px] font-bold text-slate-600 mb-1">90%</span>
                  <div class="w-10 bg-niyd-navy group-hover:bg-niyd-teal transition-all rounded-t-md" style="height: 82%;"></div>
                  <span class="text-[11px] text-slate-500 mt-2 font-medium">Networking</span>
                </div>
              </div>
            </div>

            <!-- Grade Distribution Doughnut Concept -->
            <div class="glass-card p-5">
              <h3 class="text-sm font-bold text-niyd-textDark mb-1">Overall Grade Breakdown</h3>
              <p class="text-xs text-niyd-textMuted mb-4">Distribution across all programs</p>

              <div class="flex justify-center items-center my-4">
                <!-- SVG Donut Chart -->
                <svg class="w-36 h-36" viewBox="0 0 36 36">
                  <path class="text-emerald-500" stroke-dasharray="45, 100" stroke-width="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-niyd-teal" stroke-dasharray="30, 100" stroke-dashoffset="-45" stroke-width="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-amber-400" stroke-dasharray="15, 100" stroke-dashoffset="-75" stroke-width="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="text-rose-500" stroke-dasharray="10, 100" stroke-dashoffset="-90" stroke-width="3.8" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>

              <div class="grid grid-cols-2 gap-2 text-xs pt-2">
                <div class="flex items-center space-x-2"><span class="w-3 h-3 rounded-full bg-emerald-500"></span><span class="text-slate-600">A+ / A (45%)</span></div>
                <div class="flex items-center space-x-2"><span class="w-3 h-3 rounded-full bg-niyd-teal"></span><span class="text-slate-600">A- / B+ (30%)</span></div>
                <div class="flex items-center space-x-2"><span class="w-3 h-3 rounded-full bg-amber-400"></span><span class="text-slate-600">B / C (15%)</span></div>
                <div class="flex items-center space-x-2"><span class="w-3 h-3 rounded-full bg-rose-500"></span><span class="text-slate-600">F / Retake (10%)</span></div>
              </div>
            </div>

          </div>

          <!-- Recent Result Submission Approvals List -->
          <div class="glass-card p-5">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-sm font-bold text-niyd-textDark">Recent Result Publication Approvals</h3>
              <button onclick="switchView('result-approval')" class="text-xs text-niyd-teal hover:underline font-semibold">View All Request Queue</button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th class="p-3">Course Title</th>
                    <th class="p-3">Batch Code</th>
                    <th class="p-3">Instructor</th>
                    <th class="p-3">Students</th>
                    <th class="p-3">Status</th>
                    <th class="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr>
                    <td class="p-3 font-semibold text-niyd-navy">Higher Diploma in Comp. App.</td>
                    <td class="p-3 text-slate-600">Batch 2025-01</td>
                    <td class="p-3 text-slate-600">Md. Kamrul Hasan</td>
                    <td class="p-3 text-slate-600">35 Students</td>
                    <td class="p-3"><span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Pending Review</span></td>
                    <td class="p-3 text-right">
                      <button onclick="switchView('result-approval')" class="bg-niyd-teal text-white px-2.5 py-1 rounded text-[11px] font-semibold hover:bg-niyd-tealHover">Review & Approve</button>
                    </td>
                  </tr>
                  <tr>
                    <td class="p-3 font-semibold text-niyd-navy">Web Dev & E-Commerce</td>
                    <td class="p-3 text-slate-600">Batch 2025-A</td>
                    <td class="p-3 text-slate-600">Engr. Tanvir Ahmed</td>
                    <td class="p-3 text-slate-600">28 Students</td>
                    <td class="p-3"><span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Published</span></td>
                    <td class="p-3 text-right">
                      <button onclick="switchView('marks-entry')" class="text-slate-500 hover:text-niyd-navy font-semibold">View Sheet</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      `;
        }

        // 2. MARKS ENTRY & SPREADSHEET ENGINE VIEW
        function renderMarksEntrySheet() {
            return `
        <div class="space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center space-x-2">
                <span class="bg-niyd-navy text-white text-[10px] font-bold px-2 py-0.5 rounded">SPREADSHEET ENGINE</span>
                <h2 class="text-xl font-bold text-niyd-textDark">Marks Entry & Grade Calculation</h2>
              </div>
              <p class="text-xs text-niyd-textMuted mt-1">Course: <strong>HDCA-101 (Computer Applications)</strong> | Batch: <strong>2025-01</strong></p>
            </div>
            
            <div class="flex items-center space-x-2">
              <button onclick="saveDraftMarks()" class="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition">
                <i class="fa-regular fa-floppy-disk"></i>
                <span>Save Draft</span>
              </button>
              <button onclick="submitResultsApproval()" class="bg-niyd-teal hover:bg-niyd-tealHover text-white text-xs px-3.5 py-2 rounded-lg font-semibold flex items-center space-x-1.5 transition shadow">
                <i class="fa-solid fa-paper-plane"></i>
                <span>Submit for Approval</span>
              </button>
            </div>
          </div>

          <!-- Filter / Weightage Bar -->
          <div class="glass-card p-4 flex flex-wrap items-center justify-between gap-4 bg-slate-50 border-slate-200">
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-600 mb-0.5">Select Subject Module</label>
                <select class="border border-slate-300 rounded-md px-2.5 py-1.5 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-niyd-teal">
                  <option>HDCA-101: Computer Fundamentals & OS</option>
                  <option>HDCA-102: Web Design & HTML5</option>
                  <option>HDCA-103: Database Management Systems</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-600 mb-0.5">Assessment Term</label>
                <select class="border border-slate-300 rounded-md px-2.5 py-1.5 bg-white font-medium focus:outline-none">
                  <option>Final Comprehensive Exam (2026)</option>
                  <option>Midterm Examination</option>
                </select>
              </div>
            </div>

            <div class="text-xs bg-slate-200/70 p-2.5 rounded-lg text-slate-700 flex items-center space-x-4 border border-slate-300/60">
              <span><strong>Weightages:</strong> Quiz (20%) | Mid (30%) | Final (50%)</span>
              <button onclick="switchView('grading-scale')" class="text-niyd-navy font-bold hover:underline"><i class="fa-solid fa-gear"></i> Rules</button>
            </div>
          </div>

          <!-- Interactive Spreadsheet Table -->
          <div class="glass-card overflow-hidden">
            <div class="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs">
              <span class="font-bold text-slate-700"><i class="fa-solid fa-table text-niyd-teal mr-1"></i> Student Grade Sheet (Auto-Calculating)</span>
              <span class="text-slate-500">Live Formula: Total = Quiz(20) + Mid(30) + Final(50)</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="bg-slate-200/80 text-slate-700 border-b border-slate-300 font-bold">
                    <th class="p-3 border-r border-slate-300 w-32">Student ID</th>
                    <th class="p-3 border-r border-slate-300">Student Name</th>
                    <th class="p-3 border-r border-slate-300 w-28 bg-blue-50/50">Quiz (Max 20)</th>
                    <th class="p-3 border-r border-slate-300 w-28 bg-blue-50/50">Midterm (Max 30)</th>
                    <th class="p-3 border-r border-slate-300 w-28 bg-blue-50/50">Final (Max 50)</th>
                    <th class="p-3 border-r border-slate-300 w-24 bg-slate-100">Total (100)</th>
                    <th class="p-3 border-r border-slate-300 w-20 text-center">Letter Grade</th>
                    <th class="p-3 border-r border-slate-300 w-20 text-center">GPA</th>
                    <th class="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200" id="marks-table-body">
                  ${appState.marksData.map((item, idx) => `
                    <tr class="hover:bg-slate-50 transition">
                      <td class="p-3 font-semibold text-niyd-navy border-r border-slate-200">${item.id}</td>
                      <td class="p-3 font-medium text-slate-800 border-r border-slate-200">${item.name}</td>
                      
                      <!-- Editable Quiz Input -->
                      <td class="p-2 border-r border-slate-200 bg-blue-50/20">
                        <input type="number" max="20" min="0" value="${item.quiz}" onchange="updateStudentScore(${idx}, 'quiz', this.value)" class="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-niyd-teal focus:outline-none text-right font-medium">
                      </td>
                      
                      <!-- Editable Midterm Input -->
                      <td class="p-2 border-r border-slate-200 bg-blue-50/20">
                        <input type="number" max="30" min="0" value="${item.mid}" onchange="updateStudentScore(${idx}, 'mid', this.value)" class="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-niyd-teal focus:outline-none text-right font-medium">
                      </td>
                      
                      <!-- Editable Final Input -->
                      <td class="p-2 border-r border-slate-200 bg-blue-50/20">
                        <input type="number" max="50" min="0" value="${item.final}" onchange="updateStudentScore(${idx}, 'final', this.value)" class="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-niyd-teal focus:outline-none text-right font-medium">
                      </td>

                      <!-- Auto Computed Total -->
                      <td class="p-3 border-r border-slate-200 font-bold text-slate-900 bg-slate-100 text-right">${item.total}</td>
                      
                      <!-- Auto Computed Grade Badge -->
                      <td class="p-3 border-r border-slate-200 text-center">
                        <span class="px-2 py-0.5 rounded font-bold text-[11px] ${item.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">${item.grade}</span>
                      </td>

                      <!-- GPA -->
                      <td class="p-3 border-r border-slate-200 font-bold text-center text-slate-700">${item.gpa.toFixed(2)}</td>

                      <td class="p-3 text-center">
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.status === 'Submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}">${item.status}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
              <span>Showing ${appState.marksData.length} Enrolled Students</span>
              <div class="flex space-x-2">
                <button onclick="showToast('Exported CSV Grade Sheet!')" class="text-niyd-navy font-semibold hover:underline"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
              </div>
            </div>
          </div>
        </div>
      `;
        }

        // Dynamic Spreadsheet Calculation Function
        function updateStudentScore(index, field, value) {
            let val = parseFloat(value) || 0;

            // Basic input validation
            if (field === 'quiz' && val > 20) {showToast('Quiz cannot exceed 20 marks', 'error'); val = 20;}
            if (field === 'mid' && val > 30) {showToast('Midterm cannot exceed 30 marks', 'error'); val = 30;}
            if (field === 'final' && val > 50) {showToast('Final exam cannot exceed 50 marks', 'error'); val = 50;}

            appState.marksData[index][field] = val;

            // Recalculate total, grade, GPA
            const item = appState.marksData[index];
            const newTotal = item.quiz + item.mid + item.final;
            const resultBD = calculateGradingBD(newTotal);

            item.total = newTotal;
            item.grade = resultBD.grade;
            item.gpa = resultBD.gpa;
            item.status = 'Draft';

            // Re-render
            switchView('marks-entry');
            showToast(`Updated marks for ${item.name}`);
        }

        function saveDraftMarks() {
            showToast('All grades saved as draft successfully!');
        }

        function submitResultsApproval() {
            appState.marksData.forEach(i => i.status = 'Submitted');
            showToast('Results submitted to Super Admin for final review & publication!');
            switchView('marks-entry');
        }

        // 3. STUDENT DASHBOARD VIEW
        function renderStudentDashboard() {
            return `
        <div class="space-y-6">
          <!-- Welcome Banner -->
          <div class="glass-card bg-gradient-to-r from-niyd-navy to-slate-800 text-white p-6 relative overflow-hidden">
            <div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span class="bg-niyd-teal text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">Student Portal</span>
                <h2 class="text-2xl font-extrabold mt-1" id="student-welcome">Welcome back, ${escapeHtml(appState.currentUser ? appState.currentUser.name : 'Rafiqul Islam')}</h2>
                <p class="text-xs text-slate-300 mt-1">ID: <strong>NIYD-2025-001</strong> | Higher Diploma in Computer Applications (Batch 2025-01)</p>
              </div>
              <button onclick="switchView('official-marksheet')" class="bg-niyd-teal hover:bg-niyd-tealHover text-white text-xs px-4 py-2.5 rounded-lg font-bold transition flex items-center space-x-2 shadow-lg">
                <i class="fa-solid fa-file-pdf"></i>
                <span>Download Official Marksheet</span>
              </button>
            </div>
          </div>

          <!-- Academic Overview Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="glass-card p-4 border-l-4 border-niyd-teal">
              <p class="text-xs font-semibold text-niyd-textMuted">Cumulative GPA (CGPA)</p>
              <h3 class="text-2xl font-extrabold text-niyd-textDark mt-1">3.85 <span class="text-xs font-normal text-slate-500">/ 4.00</span></h3>
              <span class="text-[11px] text-emerald-600 font-semibold mt-1 block">Grade: Excellent (A)</span>
            </div>

            <div class="glass-card p-4 border-l-4 border-niyd-navy">
              <p class="text-xs font-semibold text-niyd-textMuted">Completed Credits</p>
              <h3 class="text-2xl font-extrabold text-niyd-textDark mt-1">24 <span class="text-xs font-normal text-slate-500">/ 36 Credits</span></h3>
              <span class="text-[11px] text-slate-500 mt-1 block">Semester 2 in Progress</span>
            </div>

            <div class="glass-card p-4 border-l-4 border-emerald-500">
              <p class="text-xs font-semibold text-niyd-textMuted">Class Attendance</p>
              <h3 class="text-2xl font-extrabold text-niyd-textDark mt-1">94%</h3>
              <span class="text-[11px] text-emerald-600 font-semibold mt-1 block">Good Standing</span>
            </div>

            <div class="glass-card p-4 border-l-4 border-amber-500">
              <p class="text-xs font-semibold text-niyd-textMuted">Next Exam Date</p>
              <h3 class="text-lg font-bold text-niyd-textDark mt-1">12 Nov 2026</h3>
              <span class="text-[11px] text-amber-600 font-medium mt-1 block">Database Management</span>
            </div>
          </div>

          <!-- Recent Exam Subject Breakdown -->
          <div class="glass-card p-5">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-sm font-bold text-niyd-textDark">Published Course Marks (Term 1)</h3>
              <span class="text-xs text-niyd-teal font-semibold">Verified by Exam Controller</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <th class="p-3">Subject Code & Title</th>
                    <th class="p-3">Instructor</th>
                    <th class="p-3 text-center">Marks (100)</th>
                    <th class="p-3 text-center">Grade</th>
                    <th class="p-3 text-center">Grade Point</th>
                    <th class="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr>
                    <td class="p-3 font-semibold text-niyd-navy">HDCA-101: Computer Fundamentals</td>
                    <td class="p-3 text-slate-600">Md. Kamrul Hasan</td>
                    <td class="p-3 text-center font-bold text-slate-800">87</td>
                    <td class="p-3 text-center"><span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">A+</span></td>
                    <td class="p-3 text-center font-bold">4.00</td>
                    <td class="p-3 text-right text-emerald-600 font-semibold">Passed</td>
                  </tr>
                  <tr>
                    <td class="p-3 font-semibold text-niyd-navy">HDCA-102: Web Design & HTML5</td>
                    <td class="p-3 text-slate-600">Engr. Tanvir Ahmed</td>
                    <td class="p-3 text-center font-bold text-slate-800">78</td>
                    <td class="p-3 text-center"><span class="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">A</span></td>
                    <td class="p-3 text-center font-bold">3.75</td>
                    <td class="p-3 text-right text-emerald-600 font-semibold">Passed</td>
                  </tr>
                  <tr>
                    <td class="p-3 font-semibold text-niyd-navy">HDCA-103: Database Systems</td>
                    <td class="p-3 text-slate-600">Engr. Tanvir Ahmed</td>
                    <td class="p-3 text-center font-bold text-slate-800">82</td>
                    <td class="p-3 text-center"><span class="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">A+</span></td>
                    <td class="p-3 text-center font-bold">4.00</td>
                    <td class="p-3 text-right text-emerald-600 font-semibold">Passed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
        }

        // 4. OFFICIAL MARKSHEET / GRADE SHEET PREVIEW VIEW
        function renderOfficialMarksheet() {
            return `
        <div class="space-y-6 max-w-4xl mx-auto">
          <!-- Print Control Top Header -->
          <div class="no-print flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 class="text-sm font-bold text-niyd-navy">Official Academic Transcript Preview</h3>
              <p class="text-xs text-slate-500">Standard Bangladesh Technical Education & Youth Development Format</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="window.print()" class="bg-niyd-navy hover:bg-niyd-navyHover text-white text-xs px-4 py-2 rounded-lg font-bold transition flex items-center space-x-2">
                <i class="fa-solid fa-print"></i>
                <span>Print / Save PDF Marksheet</span>
              </button>
            </div>
          </div>

          <!-- Printable Marksheet Paper Card -->
          <div class="printable-marksheet bg-white p-8 border border-slate-300 rounded-xl shadow-lg text-niyd-textDark relative">
            
            <!-- Watermark Background -->
            <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <i class="fa-solid fa-graduation-cap text-[250px]"></i>
            </div>

            <!-- Marksheet Header -->
            <div class="border-b-2 border-niyd-navy pb-4 mb-6 text-center relative">
              <div class="flex items-center justify-between mb-2">
                <img src="images/logo.jpg" alt="NIYD logo" class="w-16 h-16 object-contain">
                <div>
                  <h1 class="text-xl md:text-2xl font-extrabold text-niyd-navy uppercase tracking-wide">National Institute of Youth Development</h1>
                  <p class="text-xs text-slate-600 font-medium">Ministry of Youth and Sports, People's Republic of Bangladesh</p>
                  <p class="text-[11px] text-slate-500">Savara, Dhaka, Bangladesh | www.niyd.gov.bd</p>
                </div>
                <div class="w-16 h-16 border border-slate-300 p-1 text-center flex flex-col justify-center items-center text-[9px] text-slate-400">
                  <i class="fa-solid fa-qrcode text-2xl text-slate-800"></i>
                  <span>VERIFY</span>
                </div>
              </div>

              <div class="inline-block bg-niyd-navy text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider mt-2">
                OFFICIAL ACADEMIC TRANSCRIPT & GRADE SHEET
              </div>
            </div>

            <!-- Student Bio Info Grid -->
            <div class="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <p><span class="text-slate-500 font-semibold">Student Name:</span> <strong>Rafiqul Islam</strong></p>
                <p class="mt-1"><span class="text-slate-500 font-semibold">Student Registration ID:</span> <strong>NIYD-2025-001</strong></p>
                <p class="mt-1"><span class="text-slate-500 font-semibold">Program of Study:</span> <strong>Higher Diploma in Computer Applications</strong></p>
              </div>
              <div>
                <p><span class="text-slate-500 font-semibold">Academic Session / Batch:</span> <strong>2025-2026 (Batch 01)</strong></p>
                <p class="mt-1"><span class="text-slate-500 font-semibold">Publication Date:</span> <strong>October 15, 2026</strong></p>
                <p class="mt-1"><span class="text-slate-500 font-semibold">Result Status:</span> <strong class="text-emerald-700">PASSED (FIRST CLASS WITH HONORS)</strong></p>
              </div>
            </div>

            <!-- Subject Wise Marks Table -->
            <table class="w-full text-left text-xs border border-slate-300 mb-6">
              <thead>
                <tr class="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <th class="p-2.5 border-r border-slate-300">Subject Code</th>
                  <th class="p-2.5 border-r border-slate-300">Course / Module Title</th>
                  <th class="p-2.5 border-r border-slate-300 text-center">Credit Hours</th>
                  <th class="p-2.5 border-r border-slate-300 text-center">Total Score (100)</th>
                  <th class="p-2.5 border-r border-slate-300 text-center">Letter Grade</th>
                  <th class="p-2.5 text-center">Grade Point</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr>
                  <td class="p-2.5 border-r border-slate-300 font-semibold">HDCA-101</td>
                  <td class="p-2.5 border-r border-slate-300">Computer Fundamentals & Operating Systems</td>
                  <td class="p-2.5 border-r border-slate-300 text-center">3.0</td>
                  <td class="p-2.5 border-r border-slate-300 text-center font-bold">87</td>
                  <td class="p-2.5 border-r border-slate-300 text-center font-bold text-emerald-700">A+</td>
                  <td class="p-2.5 text-center font-bold">4.00</td>
                </tr>
                <tr>
                  <td class="p-2.5 border-r border-slate-300 font-semibold">HDCA-102</td>
                  <td class="p-2.5 border-r border-slate-300">Web Development & HTML5 Standards</td>
                  <td class="p-2.5 border-r border-slate-300 text-center">3.0</td>
                  <td class="p-2.5 border-r border-slate-300 text-center font-bold">78</td>
                  <td class="p-2.5 border-r border-slate-300 text-center font-bold text-blue-700">A</td>
                  <td class="p-2.5 text-center font-bold">3.75</td>
                </tr>
                <tr>
                  <td class="p-2.5 border-r border-slate-300 font-semibold">HDCA-103</td>
                  <td class="p-2.5 border-r border-slate-300">Database Management Systems & SQL</td>
                  <td class="p-2.5 border-r border-slate-300 text-center">4.0</td>
                  <td class="p-2.5 border-r border-slate-300 text-center font-bold">82</td>
                  <td class="p-2.5 border-r border-slate-300 text-center font-bold text-emerald-700">A+</td>
                  <td class="p-2.5 text-center font-bold">4.00</td>
                </tr>
              </tbody>
            </table>

            <!-- Cumulative Result Summary Box -->
            <div class="flex justify-between items-center bg-slate-100 p-4 rounded-lg border border-slate-300 text-xs mb-12">
              <div>
                <p>Total Credits Earned: <strong>10.0 Credits</strong></p>
                <p class="mt-0.5">Grand Total Score: <strong>247 / 300</strong></p>
              </div>
              <div class="text-right">
                <span class="text-slate-500 font-semibold">Final Grade Point Average (CGPA):</span>
                <p class="text-2xl font-extrabold text-niyd-navy">3.85 / 4.00</p>
              </div>
            </div>

            <!-- Official Signatures Row -->
            <div class="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
              <div>
                <div class="border-b border-slate-400 mb-1 pb-6 text-slate-400 italic">Md. Kamrul Hasan</div>
                <p class="font-bold text-slate-800">Prepared By</p>
                <p class="text-[10px] text-slate-500">Academic Officer</p>
              </div>
              <div>
                <div class="border-b border-slate-400 mb-1 pb-6 text-slate-400 italic">Engr. Tanvir Ahmed</div>
                <p class="font-bold text-slate-800">Verified By</p>
                <p class="text-[10px] text-slate-500">Head of Department</p>
              </div>
              <div>
                <div class="border-b border-slate-400 mb-1 pb-6 text-slate-400 font-bold text-niyd-navy">Prof. M. A. Rahman</div>
                <p class="font-bold text-slate-800">Controller of Examinations</p>
                <p class="text-[10px] text-slate-500">NIYD Central Board</p>
              </div>
            </div>

          </div>
        </div>
      `;
        }

        // 5. FIGMA DESIGN SYSTEM & ARCHITECTURE VIEW
        function renderFigmaSpecsView() {
            return `
        <div class="space-y-6">
          <div class="glass-card p-6 bg-slate-900 text-white">
            <div class="flex items-center space-x-3 mb-2">
              <i class="fa-brands fa-figma text-niyd-teal text-3xl"></i>
              <div>
                <h2 class="text-xl font-bold">Figma Design System & Layer Architecture Specifications</h2>
                <p class="text-xs text-slate-400">National Institute of Youth Development UI/UX Design Guidelines</p>
              </div>
            </div>
          </div>

          <!-- Color Tokens & Design Specs Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Color Tokens Card -->
            <div class="glass-card p-5">
              <h3 class="text-sm font-bold text-niyd-textDark mb-3"><i class="fa-solid fa-palette text-niyd-teal mr-1"></i> Color Tokens & Styles</h3>
              <div class="space-y-2 text-xs">
                <div class="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded bg-[#173B67] border shadow-sm"></span>
                    <span class="font-bold text-slate-800">Primary Navy</span>
                  </div>
                  <code class="text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">#173B67</code>
                </div>

                <div class="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded bg-[#14B8A6] border shadow-sm"></span>
                    <span class="font-bold text-slate-800">Secondary Teal Accent</span>
                  </div>
                  <code class="text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">#14B8A6</code>
                </div>

                <div class="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded bg-[#F5F7FB] border shadow-sm"></span>
                    <span class="font-bold text-slate-800">Light Gray Canvas</span>
                  </div>
                  <code class="text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">#F5F7FB</code>
                </div>

                <div class="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded bg-[#FFFFFF] border shadow-sm"></span>
                    <span class="font-bold text-slate-800">Surface Card</span>
                  </div>
                  <code class="text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">#FFFFFF</code>
                </div>
              </div>
            </div>

            <!-- Typography & Grid Systems -->
            <div class="glass-card p-5">
              <h3 class="text-sm font-bold text-niyd-textDark mb-3"><i class="fa-solid fa-font text-niyd-teal mr-1"></i> Typography & Grid Tokens</h3>
              <ul class="text-xs space-y-2 text-slate-700">
                <li>• <strong>Font Family:</strong> Inter Sans-Serif (Variable)</li>
                <li>• <strong>Scale:</strong> Heading 1 (24px/32px), Heading 2 (18px/24px), Body (14px/20px), Micro (11px)</li>
                <li>• <strong>Spacing Base Grid:</strong> 8px Spatial System (8px, 16px, 24px, 32px, 48px)</li>
                <li>• <strong>Border Radius:</strong> Cards (12px), Buttons (8px), Badges (9999px)</li>
                <li>• <strong>Figma Viewport Default:</strong> 1440px Desktop Frame with Auto-Layout Sidebar</li>
              </ul>
            </div>

          </div>

          <!-- Figma Page Structure Roadmap -->
          <div class="glass-card p-5">
            <h3 class="text-sm font-bold text-niyd-textDark mb-3"><i class="fa-solid fa-layer-group text-niyd-teal mr-1"></i> Recommended Figma Page & Layer Architecture</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span class="font-bold text-niyd-navy block">01 - Design System</span>
                <span class="text-slate-500">Tokens, Components, Variants, Icons</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span class="font-bold text-niyd-navy block">02 - Authentication</span>
                <span class="text-slate-500">Login, Role Selector, Reset Password</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span class="font-bold text-niyd-navy block">03 - Admin Dashboard</span>
                <span class="text-slate-500">Overview, Reports, Approvals Queue</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span class="font-bold text-niyd-navy block">04 - Instructor Portal</span>
                <span class="text-slate-500">Spreadsheet Marks Entry, Submissions</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span class="font-bold text-niyd-navy block">05 - Student Portal</span>
                <span class="text-slate-500">GPA Dashboard, Marksheet Downloads</span>
              </div>
              <div class="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span class="font-bold text-niyd-navy block">06 - Prototypes & Flows</span>
                <span class="text-slate-500">Interactive Connections & Overlays</span>
              </div>
            </div>
          </div>
        </div>
      `;
        }

        // GENERAL PLACEHOLDER VIEWS (Student Mgmt, Grading Scale, Profile, etc.)
        function renderStudentManagement() {
            return `
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-xl font-bold text-niyd-textDark">Student Directory</h2>
              <p class="text-xs text-niyd-textMuted">Manage enrolled students across NIYD programs.</p>
            </div>
            <button onclick="showToast('Add Student Modal Opened')" class="bg-niyd-navy text-white text-xs px-3.5 py-2 rounded-lg font-bold hover:bg-niyd-navyHover"><i class="fa-solid fa-plus mr-1"></i> Register Student</button>
          </div>

          <div class="glass-card p-4">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead>
                  <tr class="bg-slate-100 text-slate-700">
                    <th class="p-3">Student ID</th>
                    <th class="p-3">Full Name</th>
                    <th class="p-3">Program</th>
                    <th class="p-3">Batch</th>
                    <th class="p-3">CGPA</th>
                    <th class="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${appState.students.map(s => `
                    <tr>
                      <td class="p-3 font-bold text-niyd-navy">${s.id}</td>
                      <td class="p-3 font-medium">${s.name}</td>
                      <td class="p-3 text-slate-600">${s.course}</td>
                      <td class="p-3 text-slate-600">${s.batch}</td>
                      <td class="p-3 font-bold">${s.cgpa.toFixed(2)}</td>
                      <td class="p-3 text-right">
                        <button onclick="switchView('student-result')" class="text-niyd-teal font-semibold hover:underline">View Result Details</button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
        }

        function renderInstructorManagement() {
            return `
        <div class="space-y-6">
          <h2 class="text-xl font-bold text-niyd-textDark">Instructor Management</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${appState.instructors.map(ins => `
              <div class="glass-card p-4 border-l-4 border-niyd-navy">
                <h3 class="font-bold text-sm text-niyd-navy">${ins.name}</h3>
                <p class="text-xs text-slate-500">${ins.dept}</p>
                <div class="mt-3 text-xs text-slate-600 space-y-1">
                  <p><i class="fa-solid fa-envelope mr-1 text-niyd-teal"></i> ${ins.email}</p>
                  <p><i class="fa-solid fa-book mr-1 text-niyd-teal"></i> ${ins.coursesAssigned} Assigned Courses</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
        }

        function renderCourseManagement() {
            return `
        <div class="space-y-6">
          <h2 class="text-xl font-bold text-niyd-textDark">Courses & Batches Management</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${appState.courses.map(c => `
              <div class="glass-card p-5">
                <span class="bg-niyd-teal/10 text-niyd-teal text-[10px] font-bold px-2 py-0.5 rounded">${c.id}</span>
                <h3 class="font-bold text-base text-niyd-navy mt-1">${c.name}</h3>
                <p class="text-xs text-slate-500 mt-0.5">${c.dept} (${c.duration})</p>
                <div class="mt-3 pt-3 border-t text-xs flex justify-between items-center">
                  <span class="text-slate-600">Active Batches: <strong>${c.batches}</strong></span>
                  <button onclick="switchView('marks-entry')" class="text-niyd-navy font-bold hover:underline">Manage Marks</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
        }

        function renderGradingScaleSettings() {
            return `
        <div class="space-y-6">
          <h2 class="text-xl font-bold text-niyd-textDark">Grading Rules & Weightage Engine</h2>
          <div class="glass-card p-5">
            <h3 class="text-sm font-bold text-slate-800 mb-3">Standard Bangladeshi Technical Grading Policy</h3>
            <div class="overflow-x-auto text-xs">
              <table class="w-full text-left border">
                <tr class="bg-slate-100 font-bold">
                  <th class="p-2 border">Marks Range (%)</th>
                  <th class="p-2 border">Letter Grade</th>
                  <th class="p-2 border">Grade Point (GPA)</th>
                  <th class="p-2 border">Remarks</th>
                </tr>
                <tr><td class="p-2 border">80% and Above</td><td class="p-2 border font-bold text-emerald-600">A+</td><td class="p-2 border">4.00</td><td class="p-2 border">Outstanding</td></tr>
                <tr><td class="p-2 border">75% to 79%</td><td class="p-2 border font-bold text-blue-600">A</td><td class="p-2 border">3.75</td><td class="p-2 border">Excellent</td></tr>
                <tr><td class="p-2 border">70% to 74%</td><td class="p-2 border font-bold text-blue-500">A-</td><td class="p-2 border">3.50</td><td class="p-2 border">Very Good</td></tr>
                <tr><td class="p-2 border">65% to 69%</td><td class="p-2 border font-bold">B+</td><td class="p-2 border">3.25</td><td class="p-2 border">Good</td></tr>
                <tr><td class="p-2 border">Below 40%</td><td class="p-2 border font-bold text-rose-600">F</td><td class="p-2 border">0.00</td><td class="p-2 border">Fail</td></tr>
              </table>
            </div>
          </div>
        </div>
      `;
        }

        function renderResultApprovalPage() {
            return `
        <div class="space-y-6">
          <h2 class="text-xl font-bold text-niyd-textDark">Result Publication Approvals Queue</h2>
          <div class="glass-card p-5 border-l-4 border-amber-500">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-bold text-sm text-niyd-navy">Higher Diploma in Computer Applications (HDCA-101)</h3>
                <p class="text-xs text-slate-500">Submitted by: Md. Kamrul Hasan | Batch 2025-01 (35 Students)</p>
              </div>
              <button onclick="showToast('Results Published Officially!'); switchView('admin-dashboard');" class="bg-emerald-600 text-white text-xs px-4 py-2 rounded font-bold hover:bg-emerald-700">Approve & Publish</button>
            </div>
          </div>
        </div>
      `;
        }

        function renderAnalyticsDashboard() {
            return renderAdminDashboard();
        }

        function renderInstructorDashboard() {
            const teacherName = appState.currentUser ? escapeHtml(appState.currentUser.name) : 'Teacher';
            return `
        <div class="space-y-6">
          <div class="glass-card bg-gradient-to-r from-niyd-navy to-slate-800 text-white p-6">
            <span class="bg-niyd-teal text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">Teacher Portal</span>
            <h2 class="text-2xl font-extrabold mt-2">Welcome, ${teacherName}</h2>
            <p class="text-sm text-slate-300 mt-1">Manage your assigned classes, enter marks, and review upcoming exams.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="switchView('marks-entry')" class="glass-card p-5 text-left hover:border-niyd-teal transition">
              <i class="fa-solid fa-file-pen text-niyd-teal text-xl"></i>
              <h3 class="font-bold text-niyd-navy mt-3">Marks Entry</h3>
              <p class="text-xs text-slate-500 mt-1">Enter and submit student assessment results.</p>
            </button>
            <button onclick="switchView('exam-schedule')" class="glass-card p-5 text-left hover:border-niyd-teal transition">
              <i class="fa-solid fa-calendar-days text-niyd-teal text-xl"></i>
              <h3 class="font-bold text-niyd-navy mt-3">Assigned Exams</h3>
              <p class="text-xs text-slate-500 mt-1">Review scheduled exams and class information.</p>
            </button>
          </div>
        </div>
      `;
        }

        function renderStudentResultDetail() {
            return renderStudentDashboard();
        }

        function renderProfileSettingsView() {
            return `
        <div class="glass-card p-6 max-w-2xl mx-auto space-y-4 text-xs">
          <h2 class="text-lg font-bold text-niyd-navy">Account & Institution Profile</h2>
          <div class="space-y-3">
            <div>
              <label class="block font-semibold mb-1">User Display Name</label>
              <input type="text" value="Engr. M. A. Rahman" class="w-full border p-2 rounded">
            </div>
            <div>
              <label class="block font-semibold mb-1">Email Address</label>
              <input type="email" value="admin@niyd.gov.bd" class="w-full border p-2 rounded">
            </div>
            <button onclick="showToast('Profile Settings Updated')" class="bg-niyd-navy text-white px-4 py-2 rounded font-bold">Save Settings</button>
          </div>
        </div>
      `;
        }

        function renderLoginView() {
            return `
        <div class="min-h-[80vh] flex items-center justify-center">
          <div class="glass-card p-8 w-full max-w-md space-y-6 text-center">
            <img src="images/logo.jpg" alt="NIYD logo" class="w-16 h-16 object-contain mx-auto">
            <h2 class="text-xl font-bold text-niyd-navy">Sign In to NIYD Result Portal</h2>
            <div class="space-y-3 text-left">
              <div>
                <label class="block text-xs font-semibold text-slate-600 mb-1">User Role</label>
                <select onchange="changeRole(this.value)" class="w-full border text-xs p-2.5 rounded-lg focus:outline-none">
                  <option value="admin">Administrator</option>
                  <option value="instructor">Instructor / Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <button onclick="switchView('admin-dashboard')" class="w-full bg-niyd-navy text-white text-xs font-bold py-3 rounded-lg hover:bg-niyd-navyHover transition">Access Portal</button>
            </div>
          </div>
        </div>
      `;
        }

        // INITIALIZATION ON LOAD
        window.addEventListener('hashchange', routePublicApp);
        window.onload = routePublicApp;