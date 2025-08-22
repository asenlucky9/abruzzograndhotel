// Admin Panel JavaScript
let currentBookingId = null;
let bookings = [];
let messages = [];
let customers = [];
let guestRegistry = [];

// Firebase Configuration (same as main site)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase with fallback
let db;
try {
    if (firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.log('Firebase not available, using local storage fallback');
    // Local storage fallback
    db = {
        collection: (collectionName) => ({
            add: async (data) => {
                const id = Date.now().toString();
                const item = { id, ...data, timestamp: new Date().toISOString() };
                const existing = JSON.parse(localStorage.getItem(collectionName) || '[]');
                existing.push(item);
                localStorage.setItem(collectionName, JSON.stringify(existing));
                return { id };
            },
            get: async () => {
                const data = JSON.parse(localStorage.getItem(collectionName) || '[]');
                return {
                    docs: data.map(item => ({
                        id: item.id,
                        data: () => item
                    }))
                };
            },
            doc: (docId) => ({
                set: async (data) => {
                    const existing = JSON.parse(localStorage.getItem(collectionName) || '[]');
                    const index = existing.findIndex(item => item.id === docId);
                    if (index !== -1) {
                        existing[index] = { ...existing[index], ...data };
                    } else {
                        existing.push({ id: docId, ...data, timestamp: new Date().toISOString() });
                    }
                    localStorage.setItem(collectionName, JSON.stringify(existing));
                },
                update: async (data) => {
                    const existing = JSON.parse(localStorage.getItem(collectionName) || '[]');
                    const index = existing.findIndex(item => item.id === docId);
                    if (index !== -1) {
                        existing[index] = { ...existing[index], ...data };
                        localStorage.setItem(collectionName, JSON.stringify(existing));
                    }
                },
                delete: async () => {
                    const existing = JSON.parse(localStorage.getItem(collectionName) || '[]');
                    const filtered = existing.filter(item => item.id !== docId);
                    localStorage.setItem(collectionName, JSON.stringify(filtered));
                }
            }),
            where: (field, operator, value) => ({
                get: async () => {
                    const data = JSON.parse(localStorage.getItem(collectionName) || '[]');
                    const filtered = data.filter(item => {
                        switch (operator) {
                            case '==': return item[field] === value;
                            case '!=': return item[field] !== value;
                            default: return true;
                        }
                    });
                    return {
                        docs: filtered.map(item => ({
                            id: item.id,
                            data: () => item
                        }))
                    };
                }
            })
        })
    };
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initialized');
    
    // Test Bootstrap availability
    if (typeof bootstrap !== 'undefined') {
        console.log('Bootstrap is available');
    } else {
        console.warn('Bootstrap not available');
    }
    
    // Initialize the admin panel
    initializeAdminPanel();
});

function initializeAdminPanel() {
    console.log('Initializing admin panel...');
    
    try {
        // Setup event listeners
        setupEventListeners();
        setupModalEventListeners();
        
        // Load initial data
        loadDashboardData();
        
        // Show dashboard by default
        showDashboard();
        
        console.log('Admin panel initialized successfully');
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showNotification('Error initializing admin panel', 'danger');
    }
}

// Helper Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Data source change
    const dataSourceSelect = document.getElementById('data-source');
    if (dataSourceSelect) {
        dataSourceSelect.addEventListener('change', function() {
            const dataSource = this.value;
            localStorage.setItem('admin-data-source', dataSource);
            loadDashboardData();
        });
    }

    // Filter event listeners
    const statusFilter = document.getElementById('status-filter');
    const roomFilter = document.getElementById('room-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (roomFilter) roomFilter.addEventListener('change', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);
    
    console.log('Event listeners setup complete');
}

// Setup modal event listeners
function setupModalEventListeners() {
    // Clear add room form when modal is hidden
    const addRoomModal = document.getElementById('addRoomModal');
    if (addRoomModal) {
        addRoomModal.addEventListener('hidden.bs.modal', function() {
            document.getElementById('new-room-number').value = '';
            document.getElementById('new-room-type').value = '';
            document.getElementById('new-room-floor').value = '';
            document.getElementById('new-room-capacity').value = '2';
            document.getElementById('new-room-features').value = '';
        });
    }
}

// Navigation functions
function showDashboard() {
    hideAllSections();
    document.getElementById('dashboard-section').style.display = 'block';
    updateActiveNav('dashboard');
    loadDashboardData();
}

function showBookings() {
    hideAllSections();
    document.getElementById('bookings-section').style.display = 'block';
    updateActiveNav('bookings');
    loadBookings();
}

function showRooms() {
    console.log('showRooms() called');
    hideAllSections();
    document.getElementById('rooms-section').style.display = 'block';
    updateActiveNav('rooms');
    console.log('Loading room stats...');
    loadRoomStats();
}

function showCustomers() {
    hideAllSections();
    document.getElementById('customers-section').style.display = 'block';
    updateActiveNav('customers');
    loadCustomers();
}

function showMessages() {
    hideAllSections();
    document.getElementById('messages-section').style.display = 'block';
    updateActiveNav('messages');
    loadMessages();
}

function showSettings() {
    hideAllSections();
    document.getElementById('settings-section').style.display = 'block';
    updateActiveNav('settings');
}

function showContentManagement() {
    hideAllSections();
    document.getElementById('content-management-section').style.display = 'block';
    updateActiveNav('content');
    loadContentData();
}

function showGuestRegistry() {
    console.log('showGuestRegistry() called');
    hideAllSections();
    document.getElementById('guest-registry-section').style.display = 'block';
    updateActiveNav('registry');
    loadGuestRegistry();
}

function hideAllSections() {
    const sections = ['dashboard-section', 'bookings-section', 'rooms-section', 'customers-section', 'messages-section', 'settings-section', 'content-management-section', 'guest-registry-section'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.style.display = 'none';
        }
    });
}

function updateActiveNav(section) {
    // Remove active class from all nav links
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current section
    const navLinks = {
        'dashboard': document.querySelector('.sidebar .nav-link[onclick="showDashboard()"]'),
        'bookings': document.querySelector('.sidebar .nav-link[onclick="showBookings()"]'),
        'rooms': document.querySelector('.sidebar .nav-link[onclick="showRooms()"]'),
        'customers': document.querySelector('.sidebar .nav-link[onclick="showCustomers()"]'),
        'messages': document.querySelector('.sidebar .nav-link[onclick="showMessages()"]'),
        'settings': document.querySelector('.sidebar .nav-link[onclick="showSettings()"]'),
        'content': document.querySelector('.sidebar .nav-link[onclick="showContentManagement()"]'),
        'registry': document.querySelector('.sidebar .nav-link[onclick="showGuestRegistry()"]')
    };
    
    if (navLinks[section]) {
        navLinks[section].classList.add('active');
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        await Promise.all([
            loadBookings(),
            loadMessages(),
            loadCustomers()
        ]);
        
        updateDashboardStats();
        loadRecentBookings();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'danger');
    }
}

function updateDashboardStats() {
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
    const newMessages = messages.filter(m => !m.read).length;
    
    // Calculate available rooms
    const bookedRooms = bookings.filter(b => 
        b.status === 'confirmed' && 
        new Date(b.checkOut) > new Date()
    ).length;
    const availableRooms = 9 - bookedRooms;
    
    const totalBookingsElement = document.getElementById('total-bookings');
    const activeBookingsElement = document.getElementById('active-bookings');
    const availableRoomsElement = document.getElementById('available-rooms');
    const newMessagesElement = document.getElementById('new-messages');
    
    if (totalBookingsElement) totalBookingsElement.textContent = totalBookings;
    if (activeBookingsElement) activeBookingsElement.textContent = activeBookings;
    if (availableRoomsElement) availableRoomsElement.textContent = availableRooms;
    if (newMessagesElement) newMessagesElement.textContent = newMessages;
}

function loadRecentBookings() {
    const recentBookings = bookings
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    const tbody = document.getElementById('recent-bookings-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (recentBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No recent bookings</td></tr>';
        return;
    }
    
    recentBookings.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.guestName || 'N/A'}</td>
            <td>${booking.roomType || 'N/A'}</td>
            <td>${formatDate(booking.checkIn)}</td>
            <td>${formatDate(booking.checkOut)}</td>
            <td><span class="badge bg-${getStatusBadgeClass(booking.status)}">${booking.status || 'pending'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewBookingDetails('${booking.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Bookings functions
async function loadBookings() {
    console.log('Loading bookings...');
    try {
        const snapshot = await db.collection('bookings').get();
        bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // If no Firebase data, try localStorage
        if (bookings.length === 0) {
            bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            console.log('Loaded bookings from localStorage:', bookings.length);
        } else {
            console.log('Loaded bookings from Firebase:', bookings.length);
        }
        
        displayBookings();
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        console.log('Fallback: loaded bookings from localStorage:', bookings.length);
        displayBookings();
    }
}

function displayBookings(filteredBookings = null) {
    console.log('Displaying bookings...');
    const tbody = document.getElementById('bookings-body');
    if (!tbody) {
        console.error('Bookings table body not found');
        return;
    }
    
    const data = filteredBookings || bookings;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No bookings found</td></tr>';
        return;
    }
    
    data.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.id || 'N/A'}</td>
            <td>${booking.guestName || 'N/A'}</td>
            <td>${booking.email || 'N/A'}</td>
            <td>${booking.phone || 'N/A'}</td>
            <td>${booking.roomType || 'N/A'}</td>
            <td>${formatDate(booking.checkIn)}</td>
            <td>${formatDate(booking.checkOut)}</td>
            <td>${booking.numberOfGuests || booking.guests || 'N/A'}</td>
            <td>${formatCurrency(booking.totalPrice || 0)}</td>
            <td><span class="badge bg-${getStatusBadgeClass(booking.status)}">${booking.status || 'pending'}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-sm btn-info" onclick="viewBookingDetails('${booking.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="confirmBooking('${booking.id}')" title="Confirm" ${booking.status === 'confirmed' ? 'disabled' : ''}>
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cancelBooking('${booking.id}')" title="Cancel" ${booking.status === 'cancelled' ? 'disabled' : ''}>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Bookings displayed successfully');
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'confirmed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

function applyFilters() {
    console.log('Applying filters...');
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const roomFilter = document.getElementById('room-filter')?.value || '';
    const dateFilter = document.getElementById('date-filter')?.value || '';
    
    console.log('Filters:', { statusFilter, roomFilter, dateFilter });
    
    let filtered = bookings;
    
    if (statusFilter) {
        filtered = filtered.filter(b => b.status === statusFilter);
        console.log('After status filter:', filtered.length);
    }
    
    if (roomFilter) {
        filtered = filtered.filter(b => b.roomType === roomFilter);
        console.log('After room filter:', filtered.length);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(b => 
            b.checkIn === dateFilter || b.checkOut === dateFilter
        );
        console.log('After date filter:', filtered.length);
    }
    
    displayBookings(filtered);
    console.log('Filters applied successfully');
}

function viewBookingDetails(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    currentBookingId = bookingId;
    
    const content = document.getElementById('booking-details-content');
    if (content) {
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Guest Information</h6>
                    <p><strong>Name:</strong> ${booking.guestName}</p>
                    <p><strong>Email:</strong> ${booking.email}</p>
                    <p><strong>Phone:</strong> ${booking.phone}</p>
                    <p><strong>Number of Guests:</strong> ${booking.numberOfGuests || booking.guests}</p>
                </div>
                <div class="col-md-6">
                    <h6>Booking Information</h6>
                    <p><strong>Room Type:</strong> ${booking.roomType}</p>
                    <p><strong>Check-in:</strong> ${formatDate(booking.checkIn)}</p>
                    <p><strong>Check-out:</strong> ${formatDate(booking.checkOut)}</p>
                    <p><strong>Duration:</strong> ${booking.duration} nights</p>
                    <p><strong>Total Price:</strong> ${formatCurrency(booking.totalPrice)}</p>
                    <p><strong>Status:</strong> <span class="badge bg-${getStatusBadgeClass(booking.status)}">${booking.status}</span></p>
                </div>
            </div>
            ${booking.specialRequests ? `
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Special Requests</h6>
                    <p>${booking.specialRequests}</p>
                </div>
            </div>
            ` : ''}
            <div class="row mt-3">
                <div class="col-12">
                    <h6>Booking Details</h6>
                    <p><strong>Booking ID:</strong> ${booking.id}</p>
                    <p><strong>Created:</strong> ${formatDate(booking.timestamp)}</p>
                </div>
            </div>
        `;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();
}

async function confirmBooking(bookingId) {
    try {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        booking.status = 'confirmed';
        booking.confirmedAt = new Date().toISOString();
        
        // Update in database
        await db.collection('bookings').doc(bookingId).update({
            status: 'confirmed',
            confirmedAt: booking.confirmedAt
        });
        
        showNotification('Booking confirmed successfully', 'success');
        loadDashboardData();
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailsModal'));
        if (modal) modal.hide();
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        showNotification('Error confirming booking', 'danger');
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        booking.status = 'cancelled';
        booking.cancelledAt = new Date().toISOString();
        
        // Update in database
        await db.collection('bookings').doc(bookingId).update({
            status: 'cancelled',
            cancelledAt: booking.cancelledAt
        });
        
        showNotification('Booking cancelled successfully', 'success');
        loadDashboardData();
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailsModal'));
        if (modal) modal.hide();
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('Error cancelling booking', 'danger');
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        await Promise.all([
            loadBookings(),
            loadMessages(),
            loadCustomers()
        ]);
        
        updateDashboardStats();
        loadRecentBookings();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'danger');
    }
}

function updateDashboardStats() {
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => b.status === 'confirmed').length;
    const newMessages = messages.filter(m => !m.read).length;
    
    // Calculate available rooms
    const bookedRooms = bookings.filter(b => 
        b.status === 'confirmed' && 
        new Date(b.checkOut) > new Date()
    ).length;
    const availableRooms = 9 - bookedRooms;
    
    document.getElementById('total-bookings').textContent = totalBookings;
    document.getElementById('active-bookings').textContent = activeBookings;
    document.getElementById('available-rooms').textContent = availableRooms;
    document.getElementById('new-messages').textContent = newMessages;
}

function loadRecentBookings() {
    const recentBookings = bookings
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
    
    const tbody = document.getElementById('recent-bookings-body');
    tbody.innerHTML = '';
    
    if (recentBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No recent bookings</td></tr>';
        return;
    }
    
    recentBookings.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.guestName}</td>
            <td>${booking.roomType}</td>
            <td>${formatDate(booking.checkIn)}</td>
            <td>${formatDate(booking.checkOut)}</td>
            <td><span class="badge badge-${booking.status}">${booking.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewBookingDetails('${booking.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Bookings functions
async function loadBookings() {
    console.log('Loading bookings...');
    try {
        const snapshot = await db.collection('bookings').get();
        bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // If no Firebase data, try localStorage
        if (bookings.length === 0) {
            bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            console.log('Loaded bookings from localStorage:', bookings.length);
        } else {
            console.log('Loaded bookings from Firebase:', bookings.length);
        }
        
        displayBookings();
    } catch (error) {
        console.error('Error loading bookings:', error);
        bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        console.log('Fallback: loaded bookings from localStorage:', bookings.length);
        displayBookings();
    }
}

function displayBookings(filteredBookings = null) {
    console.log('Displaying bookings...');
    const tbody = document.getElementById('bookings-body');
    if (!tbody) {
        console.error('Bookings table body not found');
        return;
    }
    
    const data = filteredBookings || bookings;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No bookings found</td></tr>';
        return;
    }
    
    data.forEach(booking => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${booking.id || 'N/A'}</td>
            <td>${booking.guestName || 'N/A'}</td>
            <td>${booking.email || 'N/A'}</td>
            <td>${booking.phone || 'N/A'}</td>
            <td>${booking.roomType || 'N/A'}</td>
            <td>${formatDate(booking.checkIn)}</td>
            <td>${formatDate(booking.checkOut)}</td>
            <td>${booking.numberOfGuests || booking.guests || 'N/A'}</td>
            <td>${formatCurrency(booking.totalPrice || 0)}</td>
            <td><span class="badge bg-${getStatusBadgeClass(booking.status)}">${booking.status || 'pending'}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-sm btn-info" onclick="viewBookingDetails('${booking.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="confirmBooking('${booking.id}')" title="Confirm" ${booking.status === 'confirmed' ? 'disabled' : ''}>
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="cancelBooking('${booking.id}')" title="Cancel" ${booking.status === 'cancelled' ? 'disabled' : ''}>
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Bookings displayed successfully');
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'confirmed': return 'success';
        case 'pending': return 'warning';
        case 'cancelled': return 'danger';
        default: return 'secondary';
    }
}

function applyFilters() {
    console.log('Applying filters...');
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const roomFilter = document.getElementById('room-filter')?.value || '';
    const dateFilter = document.getElementById('date-filter')?.value || '';
    
    console.log('Filters:', { statusFilter, roomFilter, dateFilter });
    
    let filtered = bookings;
    
    if (statusFilter) {
        filtered = filtered.filter(b => b.status === statusFilter);
        console.log('After status filter:', filtered.length);
    }
    
    if (roomFilter) {
        filtered = filtered.filter(b => b.roomType === roomFilter);
        console.log('After room filter:', filtered.length);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(b => 
            b.checkIn === dateFilter || b.checkOut === dateFilter
        );
        console.log('After date filter:', filtered.length);
    }
    
    displayBookings(filtered);
    console.log('Filters applied successfully');
}

function viewBookingDetails(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    currentBookingId = bookingId;
    
    const content = document.getElementById('booking-details-content');
    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>Guest Information</h6>
                <p><strong>Name:</strong> ${booking.guestName}</p>
                <p><strong>Email:</strong> ${booking.email}</p>
                <p><strong>Phone:</strong> ${booking.phone}</p>
                <p><strong>Number of Guests:</strong> ${booking.numberOfGuests}</p>
            </div>
            <div class="col-md-6">
                <h6>Booking Information</h6>
                <p><strong>Room Type:</strong> ${booking.roomType}</p>
                <p><strong>Check-in:</strong> ${formatDate(booking.checkIn)}</p>
                <p><strong>Check-out:</strong> ${formatDate(booking.checkOut)}</p>
                <p><strong>Duration:</strong> ${booking.duration} nights</p>
                <p><strong>Total Price:</strong> $${booking.totalPrice}</p>
                <p><strong>Status:</strong> <span class="badge badge-${booking.status}">${booking.status}</span></p>
            </div>
        </div>
        ${booking.specialRequests ? `
        <div class="row mt-3">
            <div class="col-12">
                <h6>Special Requests</h6>
                <p>${booking.specialRequests}</p>
            </div>
        </div>
        ` : ''}
        <div class="row mt-3">
            <div class="col-12">
                <h6>Booking Details</h6>
                <p><strong>Booking ID:</strong> ${booking.id}</p>
                <p><strong>Created:</strong> ${formatDate(booking.timestamp)}</p>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();
}

async function confirmBooking(bookingId) {
    try {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        booking.status = 'confirmed';
        booking.confirmedAt = new Date().toISOString();
        
        // Update in database
        await db.collection('bookings').doc(bookingId).update({
            status: 'confirmed',
            confirmedAt: booking.confirmedAt
        });
        
        showNotification('Booking confirmed successfully', 'success');
        loadDashboardData();
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailsModal'));
        if (modal) modal.hide();
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        showNotification('Error confirming booking', 'danger');
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) return;
        
        booking.status = 'cancelled';
        booking.cancelledAt = new Date().toISOString();
        
        // Update in database
        await db.collection('bookings').doc(bookingId).update({
            status: 'cancelled',
            cancelledAt: booking.cancelledAt
        });
        
        showNotification('Booking cancelled successfully', 'success');
        loadDashboardData();
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('bookingDetailsModal'));
        if (modal) modal.hide();
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification('Error cancelling booking', 'danger');
    }
}

// Room management functions
let rooms = [];
let roomTypes = {
    'Standard': { count: 4, price: 150, description: 'Comfortable and cozy rooms with modern amenities', features: 'Queen Bed, Private Bathroom, Free WiFi, TV, Air Conditioning', status: 'active' },
    'Deluxe': { count: 3, price: 250, description: 'Spacious rooms with premium amenities and stunning views', features: 'King Bed, Private Balcony, Premium Bathroom, Free WiFi, Smart TV, Air Conditioning, Mini Bar', status: 'active' },
    'Executive': { count: 2, price: 350, description: 'Ultimate luxury with exclusive amenities and personalized service', features: 'King Bed, Private Terrace, Luxury Bathroom, Free WiFi, Smart TV, Air Conditioning, Mini Bar, Room Service, Concierge', status: 'active' }
};

async function loadRoomStats() {
    console.log('loadRoomStats() called');
    try {
        // Load rooms from localStorage or Firebase
        console.log('Attempting to load rooms from Firebase...');
        const snapshot = await db.collection('rooms').get();
        rooms = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        console.log('Loaded from Firebase:', rooms.length, 'rooms');
        
        // If no Firebase data, try localStorage
        if (rooms.length === 0) {
            console.log('No Firebase data, loading from localStorage...');
            rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
            console.log('Loaded from localStorage:', rooms.length, 'rooms');
        }
        
        // If no rooms data, initialize with default rooms
        if (rooms.length === 0) {
            console.log('No rooms found, initializing defaults...');
            initializeDefaultRooms();
            console.log('Initialized default rooms:', rooms.length, 'rooms');
        }
        
        // Load room types from localStorage
        const savedRoomTypes = JSON.parse(localStorage.getItem('room-types') || '{}');
        if (Object.keys(savedRoomTypes).length > 0) {
            roomTypes = { ...roomTypes, ...savedRoomTypes };
            console.log('Loaded room types from localStorage');
        }
        
        console.log('Current rooms array:', rooms);
        console.log('Current room types:', roomTypes);
        
        updateRoomStatistics();
        displayIndividualRooms();
        updateRoomTypeDisplays();
        
    } catch (error) {
        console.error('Error loading room stats:', error);
        console.log('Falling back to localStorage...');
        rooms = JSON.parse(localStorage.getItem('rooms') || '[]');
        if (rooms.length === 0) {
            console.log('No localStorage data, initializing defaults...');
            initializeDefaultRooms();
        }
        console.log('Final rooms array:', rooms);
        updateRoomStatistics();
        displayIndividualRooms();
        updateRoomTypeDisplays();
    }
}

function initializeDefaultRooms() {
    rooms = [];
    let roomNumber = 101;
    
    // Create Standard rooms
    for (let i = 0; i < roomTypes.Standard.count; i++) {
        rooms.push({
            id: `room-${roomNumber}`,
            roomNumber: roomNumber.toString(),
            type: 'Standard',
            status: 'available',
            floor: 1,
            capacity: 2,
            features: 'Queen Bed, Private Bathroom, Free WiFi, TV, Air Conditioning',
            maintenanceNotes: '',
            lastCleaned: new Date().toISOString().split('T')[0],
            currentGuest: null,
            checkInDate: null,
            checkOutDate: null,
            timestamp: new Date().toISOString()
        });
        roomNumber++;
    }
    
    // Create Deluxe rooms
    for (let i = 0; i < roomTypes.Deluxe.count; i++) {
        rooms.push({
            id: `room-${roomNumber}`,
            roomNumber: roomNumber.toString(),
            type: 'Deluxe',
            status: 'available',
            floor: 2,
            capacity: 3,
            features: 'King Bed, Private Balcony, Premium Bathroom, Free WiFi, Smart TV, Air Conditioning, Mini Bar',
            maintenanceNotes: '',
            lastCleaned: new Date().toISOString().split('T')[0],
            currentGuest: null,
            checkInDate: null,
            checkOutDate: null,
            timestamp: new Date().toISOString()
        });
        roomNumber++;
    }
    
    // Create Executive rooms
    for (let i = 0; i < roomTypes.Executive.count; i++) {
        rooms.push({
            id: `room-${roomNumber}`,
            roomNumber: roomNumber.toString(),
            type: 'Executive',
            status: 'available',
            floor: 3,
            capacity: 4,
            features: 'King Bed, Private Terrace, Luxury Bathroom, Free WiFi, Smart TV, Air Conditioning, Mini Bar, Room Service, Concierge',
            maintenanceNotes: '',
            lastCleaned: new Date().toISOString().split('T')[0],
            currentGuest: null,
            checkInDate: null,
            checkOutDate: null,
            timestamp: new Date().toISOString()
        });
        roomNumber++;
    }
    
    localStorage.setItem('rooms', JSON.stringify(rooms));
}

function updateRoomStatistics() {
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
    
    document.getElementById('total-rooms-count').textContent = totalRooms;
    document.getElementById('available-rooms-count').textContent = availableRooms;
    document.getElementById('occupied-rooms-count').textContent = occupiedRooms;
    document.getElementById('maintenance-rooms-count').textContent = maintenanceRooms;
    
    // Update room type statistics
    Object.keys(roomTypes).forEach(type => {
        const typeRooms = rooms.filter(r => r.type === type);
        const total = typeRooms.length;
        const available = typeRooms.filter(r => r.status === 'available').length;
        
        document.getElementById(`${type.toLowerCase()}-total`).textContent = total;
        document.getElementById(`${type.toLowerCase()}-available`).textContent = available;
        document.getElementById(`${type.toLowerCase()}-price-display`).textContent = roomTypes[type].price;
    });
}

function updateRoomTypeDisplays() {
    Object.keys(roomTypes).forEach(type => {
        const statusElement = document.querySelector(`#${type.toLowerCase()}-total`).closest('.card').querySelector('.badge');
        if (statusElement) {
            const status = roomTypes[type].status;
            statusElement.className = `badge bg-${status === 'active' ? 'success' : status === 'maintenance' ? 'warning' : 'secondary'}`;
            statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        }
    });
}

function displayIndividualRooms() {
    console.log('displayIndividualRooms() called with', rooms.length, 'rooms');
    const tbody = document.getElementById('individual-rooms-body');
    if (!tbody) {
        console.error('individual-rooms-body element not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (rooms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No rooms found</td></tr>';
        return;
    }
    
    rooms.forEach(room => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${room.roomNumber}</strong></td>
            <td>${room.type}</td>
            <td><span class="badge bg-${getRoomStatusBadgeClass(room.status)}">${room.status}</span></td>
            <td>${room.currentGuest || 'N/A'}</td>
            <td>${room.checkInDate ? formatDate(room.checkInDate) : 'N/A'}</td>
            <td>${room.checkOutDate ? formatDate(room.checkOutDate) : 'N/A'}</td>
            <td>${room.lastCleaned ? formatDate(room.lastCleaned) : 'N/A'}</td>
            <td>${room.maintenanceNotes ? room.maintenanceNotes.substring(0, 30) + '...' : 'None'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-primary" onclick="editRoom('${room.id}')" title="Edit Room">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-success" onclick="markRoomCleaned('${room.id}')" title="Mark as Cleaned">
                        <i class="fas fa-broom"></i>
                    </button>
                    <button class="btn btn-warning" onclick="toggleMaintenance('${room.id}')" title="Toggle Maintenance">
                        <i class="fas fa-tools"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    console.log('Displayed', rooms.length, 'rooms in the table');
}

function getRoomStatusBadgeClass(status) {
    switch(status) {
        case 'available': return 'success';
        case 'occupied': return 'warning';
        case 'maintenance': return 'danger';
        case 'cleaning': return 'info';
        case 'reserved': return 'primary';
        default: return 'secondary';
    }
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Customer functions
async function loadCustomers() {
    try {
        // Extract unique customers from bookings
        const customerMap = new Map();
        
        bookings.forEach(booking => {
            const key = booking.email;
            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    name: booking.guestName,
                    email: booking.email,
                    phone: booking.phone,
                    totalBookings: 0,
                    lastVisit: null,
                    firstVisit: null
                });
            }
            
            const customer = customerMap.get(key);
            customer.totalBookings++;
            
            const bookingDate = new Date(booking.checkIn);
            if (!customer.firstVisit || bookingDate < new Date(customer.firstVisit)) {
                customer.firstVisit = booking.checkIn;
            }
            if (!customer.lastVisit || bookingDate > new Date(customer.lastVisit)) {
                customer.lastVisit = booking.checkIn;
            }
        });
        
        customers = Array.from(customerMap.values());
        console.log('Customers loaded:', customers.length);
    } catch (error) {
        console.error('Error loading customers:', error);
        customers = [];
    }
}

function displayCustomers() {
    const tbody = document.getElementById('customers-body');
    tbody.innerHTML = '';
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No customers found</td></tr>';
        return;
    }
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.totalBookings}</td>
            <td>${customer.lastVisit ? formatDate(customer.lastVisit) : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewCustomerDetails('${customer.email}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Message functions
async function loadMessages() {
    console.log('Loading messages...');
    try {
        const snapshot = await db.collection('messages').get();
        messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // If no Firebase data, try localStorage
        if (messages.length === 0) {
            messages = JSON.parse(localStorage.getItem('messages') || '[]');
            console.log('Loaded messages from localStorage:', messages.length);
        } else {
            console.log('Loaded messages from Firebase:', messages.length);
        }
        
        displayMessages();
    } catch (error) {
        console.error('Error loading messages:', error);
        messages = JSON.parse(localStorage.getItem('messages') || '[]');
        console.log('Fallback: loaded messages from localStorage:', messages.length);
        displayMessages();
    }
}

function displayMessages() {
    const tbody = document.getElementById('messages-body');
    tbody.innerHTML = '';
    
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
        return;
    }
    
    messages.forEach(message => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${message.name}</td>
            <td>${message.email}</td>
            <td>${message.subject}</td>
            <td>${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}</td>
            <td>${formatDate(message.timestamp)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewMessage('${message.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="markAsRead('${message.id}')" ${message.read ? 'disabled' : ''}>
                    <i class="fas fa-check"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function refreshDashboard() {
    loadDashboardData();
    showNotification('Dashboard refreshed', 'success');
}

function exportBookings() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Guest Name,Email,Phone,Room Type,Check-in,Check-out,Guests,Total Price,Status\n"
        + bookings.map(b => 
            `${b.id},"${b.guestName}","${b.email}","${b.phone}","${b.roomType}","${b.checkIn}","${b.checkOut}",${b.numberOfGuests},${b.totalPrice},${b.status}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bookings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Bookings exported successfully', 'success');
}

function clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) return;
    
    try {
        localStorage.clear();
        bookings = [];
        messages = [];
        customers = [];
        
        loadDashboardData();
        showNotification('All data cleared successfully', 'success');
    } catch (error) {
        console.error('Error clearing data:', error);
        showNotification('Error clearing data', 'danger');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'index.html';
    }
}

// Content Management Functions
function loadContentData() {
    console.log('Loading content data...');
    
    try {
        // Load saved content from localStorage or use defaults
        const content = JSON.parse(localStorage.getItem('hotel-content') || '{}');
        console.log('Loaded content from localStorage:', content);
        
        // Helper function to safely set element value
        const setElementValue = (elementId, value, defaultValue) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.value = value || defaultValue;
                console.log(`Set ${elementId} to:`, value || defaultValue);
            } else {
                console.error(`Element not found: ${elementId}`);
            }
        };
        
        // Hotel Information
        setElementValue('hotel-name', content.hotelName, 'Abruzzo Grand Hotel');
        setElementValue('hotel-rating', content.hotelRating, '3-Star Luxury');
        setElementValue('hotel-tagline', content.hotelTagline, 'Experience luxury and comfort in the heart of Abruzzo');
        setElementValue('contact-email', content.contactEmail, 'info@abruzzograndhotel.com');
        setElementValue('contact-phone', content.contactPhone, '+39 123 456 7890');
        setElementValue('hotel-address', content.hotelAddress, 'Via Roma 123, 65000 Abruzzo, Italy');
        
        // Room Information
        setElementValue('standard-price', content.standardPrice, 150);
        setElementValue('standard-description', content.standardDescription, 'Comfortable and cozy rooms with modern amenities, perfect for a relaxing stay.');
        setElementValue('standard-features', content.standardFeatures, 'Queen Bed, Private Bathroom, Free WiFi, TV, Air Conditioning');
        
        setElementValue('deluxe-price', content.deluxePrice, 250);
        setElementValue('deluxe-description', content.deluxeDescription, 'Spacious rooms with premium amenities and stunning views, offering the perfect blend of luxury and comfort.');
        setElementValue('deluxe-features', content.deluxeFeatures, 'King Bed, Private Balcony, Premium Bathroom, Free WiFi, Smart TV, Air Conditioning, Mini Bar');
        
        setElementValue('executive-price', content.executivePrice, 350);
        setElementValue('executive-description', content.executiveDescription, 'Ultimate luxury with exclusive amenities, private terrace, and personalized service for the discerning traveler.');
        setElementValue('executive-features', content.executiveFeatures, 'King Bed, Private Terrace, Luxury Bathroom, Free WiFi, Smart TV, Air Conditioning, Mini Bar, Room Service, Concierge');
        
        // About Section
        setElementValue('about-title', content.aboutTitle, 'Welcome to Abruzzo Grand Hotel');
        setElementValue('about-description', content.aboutDescription, 'Nestled in the heart of beautiful Abruzzo, our hotel offers a perfect blend of traditional Italian hospitality and modern luxury. With 9 elegantly appointed rooms, world-class amenities, and breathtaking views, we provide an unforgettable experience for every guest. Whether you\'re here for business or leisure, our dedicated staff ensures your stay is nothing short of exceptional.');
        
        setElementValue('feature1-title', content.feature1Title, 'Luxury Accommodations');
        setElementValue('feature1-description', content.feature1Description, 'Elegantly designed rooms with premium amenities and stunning views.');
        setElementValue('feature2-title', content.feature2Title, 'Prime Location');
        setElementValue('feature2-description', content.feature2Description, 'Centrally located with easy access to attractions and amenities.');
        setElementValue('feature3-title', content.feature3Title, 'Exceptional Service');
        setElementValue('feature3-description', content.feature3Description, 'Dedicated staff committed to providing personalized attention.');
        
        // Services Section
        setElementValue('service1-title', content.service1Title, 'Free WiFi');
        setElementValue('service1-description', content.service1Description, 'High-speed internet access throughout the hotel for your convenience.');
        setElementValue('service2-title', content.service2Title, 'Room Service');
        setElementValue('service2-description', content.service2Description, '24/7 room service with delicious local and international cuisine.');
        setElementValue('service3-title', content.service3Title, 'Concierge');
        setElementValue('service3-description', content.service3Description, 'Professional concierge services to assist with reservations and local recommendations.');
        setElementValue('service4-title', content.service4Title, 'Parking');
        setElementValue('service4-description', content.service4Description, 'Complimentary parking available for all guests.');
        
        // WhatsApp Settings
        setElementValue('whatsapp-number', content.whatsappNumber, '+39 123 456 7890');
        setElementValue('whatsapp-message', content.whatsappMessage, 'Hello! I\'m interested in booking a room at Abruzzo Grand Hotel. Could you please provide more information?');
        setElementValue('whatsapp-enabled', content.whatsappEnabled, 'true');
        setElementValue('whatsapp-position', content.whatsappPosition, 'bottom-right');
        
        console.log('Content data loaded successfully');
        
    } catch (error) {
        console.error('Error loading content data:', error);
        showNotification('Error loading content data', 'danger');
    }
}

function saveAllContent() {
    console.log('Saving all content...');
    
    try {
        // Helper function to safely get element value
        const getElementValue = (elementId, defaultValue = '') => {
            const element = document.getElementById(elementId);
            if (element) {
                return element.value || defaultValue;
            } else {
                console.error(`Element not found: ${elementId}`);
                return defaultValue;
            }
        };
        
        // Helper function to safely get number value
        const getNumberValue = (elementId, defaultValue = 0) => {
            const element = document.getElementById(elementId);
            if (element) {
                const value = parseInt(element.value);
                return isNaN(value) ? defaultValue : value;
            } else {
                console.error(`Element not found: ${elementId}`);
                return defaultValue;
            }
        };
        
        // Collect all form data
        const content = {
            // Hotel Information
            hotelName: getElementValue('hotel-name', 'Abruzzo Grand Hotel'),
            hotelRating: getElementValue('hotel-rating', '3-Star Luxury'),
            hotelTagline: getElementValue('hotel-tagline', 'Experience luxury and comfort in the heart of Abruzzo'),
            contactEmail: getElementValue('contact-email', 'info@abruzzograndhotel.com'),
            contactPhone: getElementValue('contact-phone', '+39 123 456 7890'),
            hotelAddress: getElementValue('hotel-address', 'Via Roma 123, 65000 Abruzzo, Italy'),
            
            // Room Information
            standardPrice: getNumberValue('standard-price', 150),
            standardDescription: getElementValue('standard-description', 'Comfortable and cozy rooms with modern amenities, perfect for a relaxing stay.'),
            standardFeatures: getElementValue('standard-features', 'Queen Bed, Private Bathroom, Free WiFi, TV, Air Conditioning'),
            
            deluxePrice: getNumberValue('deluxe-price', 250),
            deluxeDescription: getElementValue('deluxe-description', 'Spacious rooms with premium amenities and stunning views, offering the perfect blend of luxury and comfort.'),
            deluxeFeatures: getElementValue('deluxe-features', 'King Bed, Private Balcony, Premium Bathroom, Free WiFi, Smart TV, Air Conditioning, Mini Bar'),
            
            executivePrice: getNumberValue('executive-price', 350),
            executiveDescription: getElementValue('executive-description', 'Ultimate luxury with exclusive amenities, private terrace, and personalized service for the discerning traveler.'),
            executiveFeatures: getElementValue('executive-features', 'King Bed, Private Terrace, Luxury Bathroom, Free WiFi, Smart TV, Air Conditioning, Mini Bar, Room Service, Concierge'),
            
            // About Section
            aboutTitle: getElementValue('about-title', 'Welcome to Abruzzo Grand Hotel'),
            aboutDescription: getElementValue('about-description', 'Nestled in the heart of beautiful Abruzzo, our hotel offers a perfect blend of traditional Italian hospitality and modern luxury. With 9 elegantly appointed rooms, world-class amenities, and breathtaking views, we provide an unforgettable experience for every guest. Whether you\'re here for business or leisure, our dedicated staff ensures your stay is nothing short of exceptional.'),
            feature1Title: getElementValue('feature1-title', 'Luxury Accommodations'),
            feature1Description: getElementValue('feature1-description', 'Elegantly designed rooms with premium amenities and stunning views.'),
            feature2Title: getElementValue('feature2-title', 'Prime Location'),
            feature2Description: getElementValue('feature2-description', 'Centrally located with easy access to attractions and amenities.'),
            feature3Title: getElementValue('feature3-title', 'Exceptional Service'),
            feature3Description: getElementValue('feature3-description', 'Dedicated staff committed to providing personalized attention.'),
            
            // Services Section
            service1Title: getElementValue('service1-title', 'Free WiFi'),
            service1Description: getElementValue('service1-description', 'High-speed internet access throughout the hotel for your convenience.'),
            service2Title: getElementValue('service2-title', 'Room Service'),
            service2Description: getElementValue('service2-description', '24/7 room service with delicious local and international cuisine.'),
            service3Title: getElementValue('service3-title', 'Concierge'),
            service3Description: getElementValue('service3-description', 'Professional concierge services to assist with reservations and local recommendations.'),
            service4Title: getElementValue('service4-title', 'Parking'),
            service4Description: getElementValue('service4-description', 'Complimentary parking available for all guests.'),
            
            // WhatsApp Settings
            whatsappNumber: getElementValue('whatsapp-number', '+39 123 456 7890'),
            whatsappMessage: getElementValue('whatsapp-message', 'Hello! I\'m interested in booking a room at Abruzzo Grand Hotel. Could you please provide more information?'),
            whatsappEnabled: getElementValue('whatsapp-enabled', 'true'),
            whatsappPosition: getElementValue('whatsapp-position', 'bottom-right'),
            
            // Timestamp
            lastUpdated: new Date().toISOString()
        };
        
        console.log('Content to save:', content);
        
        // Validate required fields
        const requiredFields = ['hotelName', 'hotelRating', 'contactEmail', 'contactPhone'];
        const missingFields = requiredFields.filter(field => !content[field]);
        
        if (missingFields.length > 0) {
            showNotification(`Please fill in required fields: ${missingFields.join(', ')}`, 'warning');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('hotel-content', JSON.stringify(content));
        console.log('Content saved to localStorage');
        
        // Update room prices in the main script
        updateRoomPrices(content);
        
        // Update hotel information in the main script
        updateHotelInfo(content);
        
        // Update room types with new prices
        if (roomTypes.Standard) roomTypes.Standard.price = content.standardPrice;
        if (roomTypes.Deluxe) roomTypes.Deluxe.price = content.deluxePrice;
        if (roomTypes.Executive) roomTypes.Executive.price = content.executivePrice;
        localStorage.setItem('room-types', JSON.stringify(roomTypes));
        
        // Update room management displays
        updateRoomTypeDisplays();
        
        showNotification('Content saved successfully! Changes will be reflected on the website.', 'success');
        
        // Show preview link
        setTimeout(() => {
            if (confirm('Content saved! Would you like to view the updated website?')) {
                window.open('index.html', '_blank');
            }
        }, 1000);
        
        // Save to Firebase if available
        if (db && db.collection) {
            db.collection('content').doc('hotel').set(content)
                .then(() => console.log('Content saved to Firebase'))
                .catch(error => console.error('Error saving to Firebase:', error));
        }
        
        console.log('Content saved successfully');
        
    } catch (error) {
        console.error('Error saving content:', error);
        showNotification('Error saving content. Please try again.', 'danger');
    }
}

function updateRoomPrices(content) {
    // Update room prices in the main script
    const roomPrices = {
        'Standard': content.standardPrice,
        'Deluxe': content.deluxePrice,
        'Executive': content.executivePrice
    };
    
    localStorage.setItem('room-prices', JSON.stringify(roomPrices));
}

function updateHotelInfo(content) {
    // Update hotel information in the main script
    const hotelInfo = {
        name: content.hotelName,
        rating: content.hotelRating,
        tagline: content.hotelTagline,
        email: content.contactEmail,
        phone: content.contactPhone,
        address: content.hotelAddress
    };
    
    localStorage.setItem('hotel-info', JSON.stringify(hotelInfo));
}

// Guest Registry Functions
async function loadGuestRegistry() {
    try {
        // Load guest registry from localStorage or Firebase
        const snapshot = await db.collection('guest-registry').get();
        guestRegistry = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // If no Firebase data, try localStorage
        if (guestRegistry.length === 0) {
            guestRegistry = JSON.parse(localStorage.getItem('guest-registry') || '[]');
        }
        
        console.log('Guest registry loaded:', guestRegistry.length);
        displayCurrentGuests();
        displayGuestRegistry();
        populateCheckInSelect();
        populateCheckOutSelect();
        
    } catch (error) {
        console.error('Error loading guest registry:', error);
        guestRegistry = JSON.parse(localStorage.getItem('guest-registry') || '[]');
        displayCurrentGuests();
        displayGuestRegistry();
        populateCheckInSelect();
        populateCheckOutSelect();
    }
}

function displayCurrentGuests() {
    const tbody = document.getElementById('current-guests-body');
    tbody.innerHTML = '';
    
    const currentGuests = guestRegistry.filter(g => g.status === 'checked-in');
    
    if (currentGuests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No guests currently checked in</td></tr>';
        return;
    }
    
    currentGuests.forEach(guest => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="badge bg-primary">${guest.roomNumber || 'N/A'}</span></td>
            <td>${guest.guestName}</td>
            <td>${guest.email}</td>
            <td>${guest.phone}</td>
            <td>${formatDate(guest.actualCheckInDate)}</td>
            <td>${guest.actualCheckInTime || 'N/A'}</td>
            <td>${formatDate(guest.checkOut)}</td>
            <td>${guest.duration} nights</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="initiateCheckOut('${guest.id}')">
                    <i class="fas fa-sign-out-alt"></i> Check Out
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayGuestRegistry(filteredRegistry = null) {
    const tbody = document.getElementById('guest-registry-body');
    const data = filteredRegistry || guestRegistry;
    
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No guest records found</td></tr>';
        return;
    }
    
    data.forEach(guest => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${guest.bookingId}</td>
            <td>${guest.guestName}</td>
            <td>${guest.roomType}</td>
            <td>${formatDate(guest.actualCheckInDate)}</td>
            <td>${guest.actualCheckInTime || 'N/A'}</td>
            <td>${formatDate(guest.actualCheckOutDate)}</td>
            <td>${guest.actualCheckOutTime || 'N/A'}</td>
            <td>${guest.duration} nights</td>
            <td><span class="badge badge-${getStatusBadgeClass(guest.status)}">${guest.status}</span></td>
            <td>$${guest.totalPaid || guest.totalPrice}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-info" onclick="viewGuestDetails('${guest.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${guest.status === 'checked-in' ? 
                        `<button class="btn btn-warning" onclick="initiateCheckOut('${guest.id}')" title="Check Out">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>` : ''
                    }
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusBadgeClass(status) {
    switch(status) {
        case 'checked-in': return 'success';
        case 'checked-out': return 'secondary';
        case 'no-show': return 'danger';
        default: return 'warning';
    }
}

function populateCheckInSelect() {
    const select = document.getElementById('checkin-booking-select');
    select.innerHTML = '<option value="">Select a confirmed booking...</option>';
    
    // Get confirmed bookings that haven't been checked in yet
    const availableBookings = bookings.filter(b => 
        b.status === 'confirmed' && 
        !guestRegistry.some(g => g.bookingId === b.id)
    );
    
    availableBookings.forEach(booking => {
        const option = document.createElement('option');
        option.value = booking.id;
        option.textContent = `${booking.guestName} - ${booking.roomType} (${formatDate(booking.checkIn)})`;
        select.appendChild(option);
    });
}

function populateCheckOutSelect() {
    const select = document.getElementById('checkout-guest-select');
    select.innerHTML = '<option value="">Select a checked-in guest...</option>';
    
    const checkedInGuests = guestRegistry.filter(g => g.status === 'checked-in');
    
    checkedInGuests.forEach(guest => {
        const option = document.createElement('option');
        option.value = guest.id;
        option.textContent = `${guest.guestName} - Room ${guest.roomNumber || 'N/A'}`;
        select.appendChild(option);
    });
}

function manualCheckIn() {
    populateCheckInSelect();
    // Set default date and time
    const now = new Date();
    document.getElementById('checkin-date').value = now.toISOString().split('T')[0];
    document.getElementById('checkin-time').value = now.toTimeString().slice(0, 5);
    
    const modal = new bootstrap.Modal(document.getElementById('manualCheckInModal'));
    modal.show();
}

function manualCheckOut() {
    populateCheckOutSelect();
    // Set default date and time
    const now = new Date();
    document.getElementById('checkout-date').value = now.toISOString().split('T')[0];
    document.getElementById('checkout-time').value = now.toTimeString().slice(0, 5);
    
    const modal = new bootstrap.Modal(document.getElementById('manualCheckOutModal'));
    modal.show();
}

async function processCheckIn() {
    try {
        const bookingId = document.getElementById('checkin-booking-select').value;
        const roomNumber = document.getElementById('checkin-room-number').value;
        const checkInDate = document.getElementById('checkin-date').value;
        const checkInTime = document.getElementById('checkin-time').value;
        const notes = document.getElementById('checkin-notes').value;
        
        if (!bookingId || !roomNumber || !checkInDate || !checkInTime) {
            showNotification('Please fill in all required fields', 'danger');
            return;
        }
        
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) {
            showNotification('Booking not found', 'danger');
            return;
        }
        
        const guestRecord = {
            id: Date.now().toString(),
            bookingId: booking.id,
            guestName: booking.guestName,
            email: booking.email,
            phone: booking.phone,
            roomType: booking.roomType,
            roomNumber: roomNumber,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            actualCheckInDate: checkInDate,
            actualCheckInTime: checkInTime,
            actualCheckOutDate: null,
            actualCheckOutTime: null,
            duration: booking.duration,
            totalPrice: booking.totalPrice,
            totalPaid: booking.totalPrice,
            status: 'checked-in',
            checkInNotes: notes,
            checkOutNotes: null,
            roomCondition: null,
            additionalCharges: 0,
            timestamp: new Date().toISOString()
        };
        
        // Add to registry
        guestRegistry.push(guestRecord);
        
        // Save to storage
        localStorage.setItem('guest-registry', JSON.stringify(guestRegistry));
        
        // Save to Firebase if available
        if (db && db.collection) {
            await db.collection('guest-registry').doc(guestRecord.id).set(guestRecord);
        }
        
        // Update booking status
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = 'checked-in';
        }
        
        showNotification(`${booking.guestName} successfully checked in to room ${roomNumber}`, 'success');
        
        // Close modal and refresh displays
        const modal = bootstrap.Modal.getInstance(document.getElementById('manualCheckInModal'));
        modal.hide();
        
        loadGuestRegistry();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error processing check-in:', error);
        showNotification('Error processing check-in', 'danger');
    }
}

async function processCheckOut() {
    try {
        const guestId = document.getElementById('checkout-guest-select').value;
        const checkOutDate = document.getElementById('checkout-date').value;
        const checkOutTime = document.getElementById('checkout-time').value;
        const roomCondition = document.getElementById('room-condition').value;
        const additionalCharges = parseFloat(document.getElementById('additional-charges').value) || 0;
        const notes = document.getElementById('checkout-notes').value;
        
        if (!guestId || !checkOutDate || !checkOutTime) {
            showNotification('Please fill in all required fields', 'danger');
            return;
        }
        
        const guestIndex = guestRegistry.findIndex(g => g.id === guestId);
        if (guestIndex === -1) {
            showNotification('Guest not found', 'danger');
            return;
        }
        
        // Update guest record
        guestRegistry[guestIndex].actualCheckOutDate = checkOutDate;
        guestRegistry[guestIndex].actualCheckOutTime = checkOutTime;
        guestRegistry[guestIndex].status = 'checked-out';
        guestRegistry[guestIndex].roomCondition = roomCondition;
        guestRegistry[guestIndex].additionalCharges = additionalCharges;
        guestRegistry[guestIndex].checkOutNotes = notes;
        guestRegistry[guestIndex].totalPaid = (guestRegistry[guestIndex].totalPrice || 0) + additionalCharges;
        
        // Save to storage
        localStorage.setItem('guest-registry', JSON.stringify(guestRegistry));
        
        // Save to Firebase if available
        if (db && db.collection) {
            await db.collection('guest-registry').doc(guestId).update({
                actualCheckOutDate: checkOutDate,
                actualCheckOutTime: checkOutTime,
                status: 'checked-out',
                roomCondition: roomCondition,
                additionalCharges: additionalCharges,
                checkOutNotes: notes,
                totalPaid: guestRegistry[guestIndex].totalPaid
            });
        }
        
        // Update booking status
        const booking = bookings.find(b => b.id === guestRegistry[guestIndex].bookingId);
        if (booking) {
            booking.status = 'completed';
        }
        
        showNotification(`${guestRegistry[guestIndex].guestName} successfully checked out`, 'success');
        
        // Close modal and refresh displays
        const modal = bootstrap.Modal.getInstance(document.getElementById('manualCheckOutModal'));
        modal.hide();
        
        loadGuestRegistry();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error processing check-out:', error);
        showNotification('Error processing check-out', 'danger');
    }
}

function initiateCheckOut(guestId) {
    // Pre-select the guest in the checkout modal
    document.getElementById('checkout-guest-select').value = guestId;
    
    // Set default date and time
    const now = new Date();
    document.getElementById('checkout-date').value = now.toISOString().split('T')[0];
    document.getElementById('checkout-time').value = now.toTimeString().slice(0, 5);
    
    const modal = new bootstrap.Modal(document.getElementById('manualCheckOutModal'));
    modal.show();
}

function applyRegistryFilters() {
    const statusFilter = document.getElementById('registry-status-filter').value;
    const dateFilter = document.getElementById('registry-date-filter').value;
    const searchFilter = document.getElementById('registry-search').value.toLowerCase();
    
    let filtered = guestRegistry;
    
    if (statusFilter) {
        filtered = filtered.filter(g => g.status === statusFilter);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(g => 
            g.actualCheckInDate === dateFilter || 
            g.actualCheckOutDate === dateFilter
        );
    }
    
    if (searchFilter) {
        filtered = filtered.filter(g => 
            g.guestName.toLowerCase().includes(searchFilter) ||
            g.email.toLowerCase().includes(searchFilter)
        );
    }
    
    displayGuestRegistry(filtered);
}

function clearRegistryFilters() {
    document.getElementById('registry-status-filter').value = '';
    document.getElementById('registry-date-filter').value = '';
    document.getElementById('registry-search').value = '';
    displayGuestRegistry();
}

function exportGuestRegistry() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Booking ID,Guest Name,Room Type,Room Number,Check-in Date,Check-in Time,Check-out Date,Check-out Time,Duration,Status,Total Paid,Room Condition,Additional Charges,Check-in Notes,Check-out Notes\n"
        + guestRegistry.map(g => 
            `${g.bookingId},"${g.guestName}","${g.roomType}","${g.roomNumber || 'N/A'}","${g.actualCheckInDate || 'N/A'}","${g.actualCheckInTime || 'N/A'}","${g.actualCheckOutDate || 'N/A'}","${g.actualCheckOutTime || 'N/A'}",${g.duration},${g.status},${g.totalPaid || g.totalPrice},"${g.roomCondition || 'N/A'}",${g.additionalCharges || 0},"${g.checkInNotes || ''}","${g.checkOutNotes || ''}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "guest-registry.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Guest registry exported successfully', 'success');
}

// Room Management Functions
function addRoom() {
    console.log('addRoom() called');
    
    // Check if modal exists
    const modalElement = document.getElementById('addRoomModal');
    if (!modalElement) {
        console.error('Add Room Modal not found');
        showNotification('Add Room Modal not found', 'danger');
        return;
    }
    
    // Clear form fields
    const roomNumberInput = document.getElementById('new-room-number');
    const roomTypeSelect = document.getElementById('new-room-type');
    const roomFloorInput = document.getElementById('new-room-floor');
    const roomCapacityInput = document.getElementById('new-room-capacity');
    const roomFeaturesInput = document.getElementById('new-room-features');
    
    if (roomNumberInput) roomNumberInput.value = '';
    if (roomTypeSelect) roomTypeSelect.value = '';
    if (roomFloorInput) roomFloorInput.value = '';
    if (roomCapacityInput) roomCapacityInput.value = '2';
    if (roomFeaturesInput) roomFeaturesInput.value = '';
    
    console.log('Opening add room modal');
    
    // Try Bootstrap modal first
    try {
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('Modal opened with Bootstrap');
        } else {
            throw new Error('Bootstrap not available');
        }
    } catch (error) {
        console.error('Bootstrap modal failed:', error);
        // Fallback: show modal manually
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'modal-backdrop';
        document.body.appendChild(backdrop);
        
        console.log('Modal opened with fallback method');
    }
}

async function processAddRoom() {
    try {
        const roomNumber = document.getElementById('new-room-number').value;
        const roomType = document.getElementById('new-room-type').value;
        const floor = document.getElementById('new-room-floor').value;
        const capacity = document.getElementById('new-room-capacity').value;
        const features = document.getElementById('new-room-features').value;
        
        if (!roomNumber || !roomType || !floor || !capacity) {
            showNotification('Please fill in all required fields', 'danger');
            return;
        }
        
        // Check if room number already exists
        if (rooms.some(r => r.roomNumber === roomNumber)) {
            showNotification('Room number already exists', 'danger');
            return;
        }
        
        const newRoom = {
            id: `room-${roomNumber}`,
            roomNumber: roomNumber,
            type: roomType,
            status: 'available',
            floor: parseInt(floor),
            capacity: parseInt(capacity),
            features: features,
            maintenanceNotes: '',
            lastCleaned: new Date().toISOString().split('T')[0],
            currentGuest: null,
            checkInDate: null,
            checkOutDate: null,
            timestamp: new Date().toISOString()
        };
        
        rooms.push(newRoom);
        
        // Save to storage
        localStorage.setItem('rooms', JSON.stringify(rooms));
        
        // Save to Firebase if available
        if (db && db.collection) {
            await db.collection('rooms').doc(newRoom.id).set(newRoom);
        }
        
        showNotification(`Room ${roomNumber} added successfully`, 'success');
        
        // Close modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('addRoomModal'));
        if (modal) {
            modal.hide();
        }
        
        // Clear form
        document.getElementById('new-room-number').value = '';
        document.getElementById('new-room-type').value = '';
        document.getElementById('new-room-floor').value = '';
        document.getElementById('new-room-capacity').value = '2';
        document.getElementById('new-room-features').value = '';
        
        loadRoomStats();
        
    } catch (error) {
        console.error('Error adding room:', error);
        showNotification('Error adding room', 'danger');
    }
}

function editRoomType(type) {
    console.log('editRoomType() called with type:', type);
    
    // Check if room type exists
    if (!roomTypes[type]) {
        console.error('Room type not found:', type);
        showNotification(`Room type ${type} not found`, 'danger');
        return;
    }
    
    const roomType = roomTypes[type];
    console.log('Room type data:', roomType);
    
    // Check if modal exists
    const modalElement = document.getElementById('editRoomTypeModal');
    if (!modalElement) {
        console.error('Edit Room Type Modal not found');
        showNotification('Edit Room Type Modal not found', 'danger');
        return;
    }
    
    // Populate form fields
    const nameInput = document.getElementById('edit-room-type-name');
    const countInput = document.getElementById('edit-room-type-count');
    const priceInput = document.getElementById('edit-room-type-price');
    const descriptionInput = document.getElementById('edit-room-type-description');
    const featuresInput = document.getElementById('edit-room-type-features');
    const statusSelect = document.getElementById('edit-room-type-status');
    
    console.log('Form elements found:', {
        nameInput: !!nameInput,
        countInput: !!countInput,
        priceInput: !!priceInput,
        descriptionInput: !!descriptionInput,
        featuresInput: !!featuresInput,
        statusSelect: !!statusSelect
    });
    
    if (nameInput) nameInput.value = type;
    if (countInput) countInput.value = roomType.count;
    if (priceInput) priceInput.value = roomType.price;
    if (descriptionInput) descriptionInput.value = roomType.description;
    if (featuresInput) featuresInput.value = roomType.features;
    if (statusSelect) statusSelect.value = roomType.status;
    
    console.log('Form populated with values:', {
        name: type,
        count: roomType.count,
        price: roomType.price,
        description: roomType.description,
        features: roomType.features,
        status: roomType.status
    });
    
    console.log('Opening edit room type modal');
    
    // Try Bootstrap modal first
    try {
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('Edit room type modal opened with Bootstrap');
        } else {
            throw new Error('Bootstrap not available');
        }
    } catch (error) {
        console.error('Bootstrap modal failed:', error);
        // Fallback: show modal manually
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'modal-backdrop';
        document.body.appendChild(backdrop);
        
        console.log('Edit room type modal opened with fallback method');
    }
}

async function processEditRoomType() {
    try {
        console.log('processEditRoomType() called');
        
        const type = document.getElementById('edit-room-type-name').value;
        const count = parseInt(document.getElementById('edit-room-type-count').value);
        const price = parseFloat(document.getElementById('edit-room-type-price').value);
        const description = document.getElementById('edit-room-type-description').value;
        const features = document.getElementById('edit-room-type-features').value;
        const status = document.getElementById('edit-room-type-status').value;
        
        console.log('Form values:', { type, count, price, description, features, status });
        
        if (!type || !count || !price || !description) {
            showNotification('Please fill in all required fields', 'danger');
            return;
        }
        
        const oldCount = roomTypes[type] ? roomTypes[type].count : 0;
        console.log('Old count:', oldCount, 'New count:', count);
        
        // Update room type
        roomTypes[type] = {
            count: count,
            price: price,
            description: description,
            features: features,
            status: status
        };
        
        // If count changed, update individual rooms
        if (count !== oldCount) {
            console.log('Room count changed, updating individual rooms...');
            updateIndividualRoomsForType(type, oldCount, count);
        }
        
        // Save to storage
        localStorage.setItem('room-types', JSON.stringify(roomTypes));
        
        // Update content management prices
        updateContentManagementPrices();
        
        showNotification(`${type} room type updated successfully`, 'success');
        
        // Close modal and refresh
        try {
            const modal = bootstrap.Modal.getInstance(document.getElementById('editRoomTypeModal'));
            if (modal) {
                modal.hide();
            }
        } catch (error) {
            console.log('Modal close error:', error);
            // Manual close fallback
            const modalElement = document.getElementById('editRoomTypeModal');
            if (modalElement) {
                modalElement.style.display = 'none';
                modalElement.classList.remove('show');
                document.body.classList.remove('modal-open');
                const backdrop = document.getElementById('modal-backdrop');
                if (backdrop) backdrop.remove();
            }
        }
        
        // Refresh the room management display
        loadRoomStats();
        
    } catch (error) {
        console.error('Error updating room type:', error);
        showNotification('Error updating room type', 'danger');
    }
}

function updateIndividualRoomsForType(type, oldCount, newCount) {
    console.log(`Updating rooms for ${type}: ${oldCount} -> ${newCount}`);
    
    // Remove existing rooms of this type
    rooms = rooms.filter(room => room.type !== type);
    
    // Add new rooms based on the new count
    let roomNumber = 101;
    
    // Find the next available room number
    if (rooms.length > 0) {
        const maxRoomNumber = Math.max(...rooms.map(room => parseInt(room.roomNumber)));
        roomNumber = maxRoomNumber + 1;
    }
    
    // Create new rooms
    for (let i = 0; i < newCount; i++) {
        const roomFeatures = roomTypes[type].features;
        const floor = type === 'Standard' ? 1 : type === 'Deluxe' ? 2 : 3;
        const capacity = type === 'Standard' ? 2 : type === 'Deluxe' ? 3 : 4;
        
        rooms.push({
            id: `room-${roomNumber}`,
            roomNumber: roomNumber.toString(),
            type: type,
            status: 'available',
            floor: floor,
            capacity: capacity,
            features: roomFeatures,
            maintenanceNotes: '',
            lastCleaned: new Date().toISOString().split('T')[0],
            currentGuest: null,
            checkInDate: null,
            checkOutDate: null,
            timestamp: new Date().toISOString()
        });
        roomNumber++;
    }
    
    // Save updated rooms
    localStorage.setItem('rooms', JSON.stringify(rooms));
    console.log(`Updated rooms for ${type}: ${newCount} rooms created`);
}

function editRoom(roomId) {
    console.log('editRoom() called with roomId:', roomId);
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) {
        console.error('Room not found:', roomId);
        showNotification('Room not found', 'danger');
        return;
    }
    
    // Check if modal exists
    const modalElement = document.getElementById('editRoomModal');
    if (!modalElement) {
        console.error('Edit Room Modal not found');
        showNotification('Edit Room Modal not found', 'danger');
        return;
    }
    
    // Populate form fields
    const roomNumberInput = document.getElementById('edit-room-number');
    const roomTypeSelect = document.getElementById('edit-room-type');
    const roomStatusSelect = document.getElementById('edit-room-status');
    const roomFloorInput = document.getElementById('edit-room-floor');
    const roomCapacityInput = document.getElementById('edit-room-capacity');
    const roomFeaturesInput = document.getElementById('edit-room-features');
    const maintenanceNotesInput = document.getElementById('edit-room-maintenance-notes');
    const lastCleanedInput = document.getElementById('edit-room-last-cleaned');
    const formElement = document.getElementById('edit-room-form');
    
    if (roomNumberInput) roomNumberInput.value = room.roomNumber;
    if (roomTypeSelect) roomTypeSelect.value = room.type;
    if (roomStatusSelect) roomStatusSelect.value = room.status;
    if (roomFloorInput) roomFloorInput.value = room.floor;
    if (roomCapacityInput) roomCapacityInput.value = room.capacity;
    if (roomFeaturesInput) roomFeaturesInput.value = room.features || '';
    if (maintenanceNotesInput) maintenanceNotesInput.value = room.maintenanceNotes || '';
    if (lastCleanedInput) lastCleanedInput.value = room.lastCleaned || '';
    
    // Store room ID for processing
    if (formElement) {
        formElement.setAttribute('data-room-id', roomId);
    }
    
    console.log('Opening edit room modal');
    
    // Try Bootstrap modal first
    try {
        if (typeof bootstrap !== 'undefined') {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('Edit room modal opened with Bootstrap');
        } else {
            throw new Error('Bootstrap not available');
        }
    } catch (error) {
        console.error('Bootstrap modal failed:', error);
        // Fallback: show modal manually
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        modalElement.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        backdrop.id = 'modal-backdrop';
        document.body.appendChild(backdrop);
        
        console.log('Edit room modal opened with fallback method');
    }
}

async function processEditRoom() {
    try {
        const roomId = document.getElementById('edit-room-form').getAttribute('data-room-id');
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        
        if (roomIndex === -1) {
            showNotification('Room not found', 'danger');
            return;
        }
        
        const room = rooms[roomIndex];
        
        // Update room data
        room.type = document.getElementById('edit-room-type').value;
        room.status = document.getElementById('edit-room-status').value;
        room.floor = parseInt(document.getElementById('edit-room-floor').value);
        room.capacity = parseInt(document.getElementById('edit-room-capacity').value);
        room.features = document.getElementById('edit-room-features').value;
        room.maintenanceNotes = document.getElementById('edit-room-maintenance-notes').value;
        room.lastCleaned = document.getElementById('edit-room-last-cleaned').value;
        
        // Save to storage
        localStorage.setItem('rooms', JSON.stringify(rooms));
        
        // Save to Firebase if available
        if (db && db.collection) {
            await db.collection('rooms').doc(roomId).update({
                type: room.type,
                status: room.status,
                floor: room.floor,
                capacity: room.capacity,
                features: room.features,
                maintenanceNotes: room.maintenanceNotes,
                lastCleaned: room.lastCleaned
            });
        }
        
        showNotification(`Room ${room.roomNumber} updated successfully`, 'success');
        
        // Close modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('editRoomModal'));
        if (modal) {
            modal.hide();
        }
        
        loadRoomStats();
        
    } catch (error) {
        console.error('Error updating room:', error);
        showNotification('Error updating room', 'danger');
    }
}

async function deleteRoom() {
    const roomId = document.getElementById('edit-room-form').getAttribute('data-room-id');
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) {
        showNotification('Room not found', 'danger');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete Room ${room.roomNumber}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        // Remove room from array
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        rooms.splice(roomIndex, 1);
        
        // Save to storage
        localStorage.setItem('rooms', JSON.stringify(rooms));
        
        // Delete from Firebase if available
        if (db && db.collection) {
            await db.collection('rooms').doc(roomId).delete();
        }
        
        showNotification(`Room ${room.roomNumber} deleted successfully`, 'success');
        
        // Close modal and refresh
        const modal = bootstrap.Modal.getInstance(document.getElementById('editRoomModal'));
        if (modal) {
            modal.hide();
        }
        
        loadRoomStats();
        
    } catch (error) {
        console.error('Error deleting room:', error);
        showNotification('Error deleting room', 'danger');
    }
}

function markRoomCleaned(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    room.lastCleaned = new Date().toISOString().split('T')[0];
    room.status = 'available';
    
    localStorage.setItem('rooms', JSON.stringify(rooms));
    
    if (db && db.collection) {
        db.collection('rooms').doc(roomId).update({
            lastCleaned: room.lastCleaned,
            status: room.status
        });
    }
    
    showNotification(`Room ${room.roomNumber} marked as cleaned`, 'success');
    loadRoomStats();
}

function toggleMaintenance(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    if (room.status === 'maintenance') {
        room.status = 'available';
        showNotification(`Room ${room.roomNumber} maintenance completed`, 'success');
    } else {
        room.status = 'maintenance';
        showNotification(`Room ${room.roomNumber} put under maintenance`, 'warning');
    }
    
    localStorage.setItem('rooms', JSON.stringify(rooms));
    
    if (db && db.collection) {
        db.collection('rooms').doc(roomId).update({
            status: room.status
        });
    }
    
    loadRoomStats();
}

function saveRoomChanges() {
    localStorage.setItem('rooms', JSON.stringify(rooms));
    localStorage.setItem('room-types', JSON.stringify(roomTypes));
    
    if (db && db.collection) {
        // Save rooms to Firebase
        rooms.forEach(room => {
            db.collection('rooms').doc(room.id).set(room);
        });
        
        // Save room types to Firebase
        db.collection('room-types').doc('config').set(roomTypes);
    }
    
    showNotification('All room changes saved successfully', 'success');
}

function exportRoomData() {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Room Number,Type,Status,Floor,Capacity,Features,Last Cleaned,Maintenance Notes,Current Guest,Check-in Date,Check-out Date\n"
        + rooms.map(r => 
            `${r.roomNumber},"${r.type}","${r.status}",${r.floor},${r.capacity},"${r.features}","${r.lastCleaned || 'N/A'}","${r.maintenanceNotes || ''}","${r.currentGuest || 'N/A'}","${r.checkInDate || 'N/A'}","${r.checkOutDate || 'N/A'}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "room-data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Room data exported successfully', 'success');
}

function updateContentManagementPrices() {
    // Update prices in content management
    if (roomTypes.Standard) {
        document.getElementById('standard-price').value = roomTypes.Standard.price;
    }
    if (roomTypes.Deluxe) {
        document.getElementById('deluxe-price').value = roomTypes.Deluxe.price;
    }
    if (roomTypes.Executive) {
        document.getElementById('executive-price').value = roomTypes.Executive.price;
    }
}

function viewGuestDetails(guestId) {
    const guest = guestRegistry.find(g => g.id === guestId);
    if (!guest) return;
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <h6>Guest Information</h6>
                <p><strong>Name:</strong> ${guest.guestName}</p>
                <p><strong>Email:</strong> ${guest.email}</p>
                <p><strong>Phone:</strong> ${guest.phone}</p>
                <p><strong>Room:</strong> ${guest.roomNumber || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <h6>Stay Information</h6>
                <p><strong>Room Type:</strong> ${guest.roomType}</p>
                <p><strong>Duration:</strong> ${guest.duration} nights</p>
                <p><strong>Status:</strong> <span class="badge badge-${getStatusBadgeClass(guest.status)}">${guest.status}</span></p>
                <p><strong>Total Paid:</strong> $${guest.totalPaid || guest.totalPrice}</p>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-md-6">
                <h6>Check-in Details</h6>
                <p><strong>Date:</strong> ${formatDate(guest.actualCheckInDate)}</p>
                <p><strong>Time:</strong> ${guest.actualCheckInTime || 'N/A'}</p>
                <p><strong>Notes:</strong> ${guest.checkInNotes || 'None'}</p>
            </div>
            <div class="col-md-6">
                <h6>Check-out Details</h6>
                <p><strong>Date:</strong> ${formatDate(guest.actualCheckOutDate)}</p>
                <p><strong>Time:</strong> ${guest.actualCheckOutTime || 'N/A'}</p>
                <p><strong>Room Condition:</strong> ${guest.roomCondition || 'N/A'}</p>
                <p><strong>Additional Charges:</strong> $${guest.additionalCharges || 0}</p>
                <p><strong>Notes:</strong> ${guest.checkOutNotes || 'None'}</p>
            </div>
        </div>
    `;
    
    document.getElementById('booking-details-content').innerHTML = content;
    document.querySelector('#bookingDetailsModal .modal-title').textContent = 'Guest Details';
    
    // Hide booking action buttons
    document.querySelector('#bookingDetailsModal .modal-footer').style.display = 'none';
    
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();
}

// Guest Registry Functions
async function loadGuestRegistry() {
    console.log('Loading guest registry...');
    try {
        // Load guest registry from localStorage or Firebase
        const snapshot = await db.collection('guest-registry').get();
        guestRegistry = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // If no Firebase data, try localStorage
        if (guestRegistry.length === 0) {
            guestRegistry = JSON.parse(localStorage.getItem('guest-registry') || '[]');
            console.log('Loaded guest registry from localStorage:', guestRegistry.length);
        } else {
            console.log('Loaded guest registry from Firebase:', guestRegistry.length);
        }
        
        console.log('Guest registry loaded:', guestRegistry.length);
        displayCurrentGuests();
        displayGuestRegistry();
        populateCheckInSelect();
        populateCheckOutSelect();
        
    } catch (error) {
        console.error('Error loading guest registry:', error);
        guestRegistry = JSON.parse(localStorage.getItem('guest-registry') || '[]');
        console.log('Fallback: loaded guest registry from localStorage:', guestRegistry.length);
        displayCurrentGuests();
        displayGuestRegistry();
        populateCheckInSelect();
        populateCheckOutSelect();
    }
}

function displayCurrentGuests() {
    console.log('Displaying current guests...');
    const tbody = document.getElementById('current-guests-body');
    if (!tbody) {
        console.error('Current guests table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    const currentGuests = guestRegistry.filter(g => g.status === 'checked-in');
    
    if (currentGuests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No guests currently checked in</td></tr>';
        return;
    }
    
    currentGuests.forEach(guest => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="badge bg-primary">${guest.roomNumber || 'N/A'}</span></td>
            <td>${guest.guestName}</td>
            <td>${guest.email}</td>
            <td>${guest.phone}</td>
            <td>${formatDate(guest.actualCheckInDate)}</td>
            <td>${guest.actualCheckInTime || 'N/A'}</td>
            <td>${formatDate(guest.checkOut)}</td>
            <td>${guest.duration} nights</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="initiateCheckOut('${guest.id}')">
                    <i class="fas fa-sign-out-alt"></i> Check Out
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Current guests displayed successfully');
}

function displayGuestRegistry(filteredRegistry = null) {
    console.log('Displaying guest registry...');
    const tbody = document.getElementById('guest-registry-body');
    if (!tbody) {
        console.error('Guest registry table body not found');
        return;
    }
    
    const data = filteredRegistry || guestRegistry;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No guest records found</td></tr>';
        return;
    }
    
    data.forEach(guest => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${guest.bookingId}</td>
            <td>${guest.guestName}</td>
            <td>${guest.roomType}</td>
            <td>${formatDate(guest.actualCheckInDate)}</td>
            <td>${guest.actualCheckInTime || 'N/A'}</td>
            <td>${formatDate(guest.actualCheckOutDate)}</td>
            <td>${guest.actualCheckOutTime || 'N/A'}</td>
            <td>${guest.duration} nights</td>
            <td><span class="badge bg-${getGuestStatusBadgeClass(guest.status)}">${guest.status}</span></td>
            <td>${formatCurrency(guest.totalPaid || guest.totalPrice)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-info" onclick="viewGuestDetails('${guest.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${guest.status === 'checked-in' ? 
                        `<button class="btn btn-warning" onclick="initiateCheckOut('${guest.id}')" title="Check Out">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>` : ''
                    }
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Guest registry displayed successfully');
}

function getGuestStatusBadgeClass(status) {
    switch(status) {
        case 'checked-in': return 'success';
        case 'checked-out': return 'secondary';
        case 'no-show': return 'danger';
        default: return 'warning';
    }
}

function populateCheckInSelect() {
    console.log('Populating check-in select...');
    const select = document.getElementById('checkin-booking-select');
    if (!select) {
        console.error('Check-in booking select not found');
        return;
    }
    
    select.innerHTML = '<option value="">Select a confirmed booking...</option>';
    
    // Get confirmed bookings that haven't been checked in yet
    const availableBookings = bookings.filter(b => 
        b.status === 'confirmed' && 
        !guestRegistry.some(g => g.bookingId === b.id)
    );
    
    availableBookings.forEach(booking => {
        const option = document.createElement('option');
        option.value = booking.id;
        option.textContent = `${booking.guestName} - ${booking.roomType} (${formatDate(booking.checkIn)})`;
        select.appendChild(option);
    });
    
    console.log('Check-in select populated with', availableBookings.length, 'bookings');
}

function populateCheckOutSelect() {
    console.log('Populating check-out select...');
    const select = document.getElementById('checkout-guest-select');
    if (!select) {
        console.error('Check-out guest select not found');
        return;
    }
    
    select.innerHTML = '<option value="">Select a checked-in guest...</option>';
    
    const checkedInGuests = guestRegistry.filter(g => g.status === 'checked-in');
    
    checkedInGuests.forEach(guest => {
        const option = document.createElement('option');
        option.value = guest.id;
        option.textContent = `${guest.guestName} - Room ${guest.roomNumber || 'N/A'}`;
        select.appendChild(option);
    });
    
    console.log('Check-out select populated with', checkedInGuests.length, 'guests');
}

function manualCheckIn() {
    console.log('Opening manual check-in modal...');
    populateCheckInSelect();
    // Set default date and time
    const now = new Date();
    const checkinDateInput = document.getElementById('checkin-date');
    const checkinTimeInput = document.getElementById('checkin-time');
    
    if (checkinDateInput) checkinDateInput.value = now.toISOString().split('T')[0];
    if (checkinTimeInput) checkinTimeInput.value = now.toTimeString().slice(0, 5);
    
    const modal = new bootstrap.Modal(document.getElementById('manualCheckInModal'));
    modal.show();
}

function manualCheckOut() {
    console.log('Opening manual check-out modal...');
    populateCheckOutSelect();
    // Set default date and time
    const now = new Date();
    const checkoutDateInput = document.getElementById('checkout-date');
    const checkoutTimeInput = document.getElementById('checkout-time');
    
    if (checkoutDateInput) checkoutDateInput.value = now.toISOString().split('T')[0];
    if (checkoutTimeInput) checkoutTimeInput.value = now.toTimeString().slice(0, 5);
    
    const modal = new bootstrap.Modal(document.getElementById('manualCheckOutModal'));
    modal.show();
}

async function processCheckIn() {
    console.log('Processing check-in...');
    try {
        const bookingId = document.getElementById('checkin-booking-select').value;
        const roomNumber = document.getElementById('checkin-room-number').value;
        const checkInDate = document.getElementById('checkin-date').value;
        const checkInTime = document.getElementById('checkin-time').value;
        const notes = document.getElementById('checkin-notes').value;
        
        if (!bookingId || !roomNumber || !checkInDate || !checkInTime) {
            showNotification('Please fill in all required fields', 'danger');
            return;
        }
        
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) {
            showNotification('Booking not found', 'danger');
            return;
        }
        
        const guestRecord = {
            id: Date.now().toString(),
            bookingId: booking.id,
            guestName: booking.guestName,
            email: booking.email,
            phone: booking.phone,
            roomType: booking.roomType,
            roomNumber: roomNumber,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            actualCheckInDate: checkInDate,
            actualCheckInTime: checkInTime,
            actualCheckOutDate: null,
            actualCheckOutTime: null,
            duration: booking.duration,
            totalPrice: booking.totalPrice,
            totalPaid: booking.totalPrice,
            status: 'checked-in',
            checkInNotes: notes,
            checkOutNotes: null,
            roomCondition: null,
            additionalCharges: 0,
            timestamp: new Date().toISOString()
        };
        
        // Add to registry
        guestRegistry.push(guestRecord);
        
        // Save to storage
        localStorage.setItem('guest-registry', JSON.stringify(guestRegistry));
        
        // Save to Firebase if available
        if (db && db.collection) {
            await db.collection('guest-registry').doc(guestRecord.id).set(guestRecord);
        }
        
        // Update booking status
        const bookingIndex = bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex !== -1) {
            bookings[bookingIndex].status = 'checked-in';
        }
        
        showNotification(`${booking.guestName} successfully checked in to room ${roomNumber}`, 'success');
        
        // Close modal and refresh displays
        const modal = bootstrap.Modal.getInstance(document.getElementById('manualCheckInModal'));
        if (modal) modal.hide();
        
        loadGuestRegistry();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error processing check-in:', error);
        showNotification('Error processing check-in', 'danger');
    }
}

async function processCheckOut() {
    console.log('Processing check-out...');
    try {
        const guestId = document.getElementById('checkout-guest-select').value;
        const checkOutDate = document.getElementById('checkout-date').value;
        const checkOutTime = document.getElementById('checkout-time').value;
        const roomCondition = document.getElementById('room-condition').value;
        const additionalCharges = parseFloat(document.getElementById('additional-charges').value) || 0;
        const notes = document.getElementById('checkout-notes').value;
        
        if (!guestId || !checkOutDate || !checkOutTime) {
            showNotification('Please fill in all required fields', 'danger');
            return;
        }
        
        const guestIndex = guestRegistry.findIndex(g => g.id === guestId);
        if (guestIndex === -1) {
            showNotification('Guest not found', 'danger');
            return;
        }
        
        // Update guest record
        guestRegistry[guestIndex].actualCheckOutDate = checkOutDate;
        guestRegistry[guestIndex].actualCheckOutTime = checkOutTime;
        guestRegistry[guestIndex].status = 'checked-out';
        guestRegistry[guestIndex].roomCondition = roomCondition;
        guestRegistry[guestIndex].additionalCharges = additionalCharges;
        guestRegistry[guestIndex].checkOutNotes = notes;
        guestRegistry[guestIndex].totalPaid = (guestRegistry[guestIndex].totalPrice || 0) + additionalCharges;
        
        // Save to storage
        localStorage.setItem('guest-registry', JSON.stringify(guestRegistry));
        
        // Save to Firebase if available
        if (db && db.collection) {
            await db.collection('guest-registry').doc(guestId).update({
                actualCheckOutDate: checkOutDate,
                actualCheckOutTime: checkOutTime,
                status: 'checked-out',
                roomCondition: roomCondition,
                additionalCharges: additionalCharges,
                checkOutNotes: notes,
                totalPaid: guestRegistry[guestIndex].totalPaid
            });
        }
        
        // Update booking status
        const booking = bookings.find(b => b.id === guestRegistry[guestIndex].bookingId);
        if (booking) {
            booking.status = 'completed';
        }
        
        showNotification(`${guestRegistry[guestIndex].guestName} successfully checked out`, 'success');
        
        // Close modal and refresh displays
        const modal = bootstrap.Modal.getInstance(document.getElementById('manualCheckOutModal'));
        if (modal) modal.hide();
        
        loadGuestRegistry();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error processing check-out:', error);
        showNotification('Error processing check-out', 'danger');
    }
}

function initiateCheckOut(guestId) {
    console.log('Initiating check-out for guest:', guestId);
    // Pre-select the guest in the checkout modal
    const checkoutSelect = document.getElementById('checkout-guest-select');
    if (checkoutSelect) checkoutSelect.value = guestId;
    
    // Set default date and time
    const now = new Date();
    const checkoutDateInput = document.getElementById('checkout-date');
    const checkoutTimeInput = document.getElementById('checkout-time');
    
    if (checkoutDateInput) checkoutDateInput.value = now.toISOString().split('T')[0];
    if (checkoutTimeInput) checkoutTimeInput.value = now.toTimeString().slice(0, 5);
    
    const modal = new bootstrap.Modal(document.getElementById('manualCheckOutModal'));
    modal.show();
}

function applyRegistryFilters() {
    console.log('Applying registry filters...');
    const statusFilter = document.getElementById('registry-status-filter')?.value || '';
    const dateFilter = document.getElementById('registry-date-filter')?.value || '';
    const searchFilter = document.getElementById('registry-search')?.value.toLowerCase() || '';
    
    let filtered = guestRegistry;
    
    if (statusFilter) {
        filtered = filtered.filter(g => g.status === statusFilter);
    }
    
    if (dateFilter) {
        filtered = filtered.filter(g => 
            g.actualCheckInDate === dateFilter || 
            g.actualCheckOutDate === dateFilter
        );
    }
    
    if (searchFilter) {
        filtered = filtered.filter(g => 
            g.guestName.toLowerCase().includes(searchFilter) ||
            g.email.toLowerCase().includes(searchFilter)
        );
    }
    
    displayGuestRegistry(filtered);
    console.log('Registry filters applied successfully');
}

function clearRegistryFilters() {
    console.log('Clearing registry filters...');
    const statusFilter = document.getElementById('registry-status-filter');
    const dateFilter = document.getElementById('registry-date-filter');
    const searchFilter = document.getElementById('registry-search');
    
    if (statusFilter) statusFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    if (searchFilter) searchFilter.value = '';
    
    displayGuestRegistry();
    console.log('Registry filters cleared');
}

function exportGuestRegistry() {
    console.log('Exporting guest registry...');
    try {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Booking ID,Guest Name,Room Type,Room Number,Check-in Date,Check-in Time,Check-out Date,Check-out Time,Duration,Status,Total Paid,Room Condition,Additional Charges,Check-in Notes,Check-out Notes\n"
            + guestRegistry.map(g => 
                `${g.bookingId},"${g.guestName}","${g.roomType}","${g.roomNumber || 'N/A'}","${g.actualCheckInDate || 'N/A'}","${g.actualCheckInTime || 'N/A'}","${g.actualCheckOutDate || 'N/A'}","${g.actualCheckOutTime || 'N/A'}",${g.duration},${g.status},${g.totalPaid || g.totalPrice},"${g.roomCondition || 'N/A'}",${g.additionalCharges || 0},"${g.checkInNotes || ''}","${g.checkOutNotes || ''}"`
            ).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `guest-registry_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Guest registry exported successfully', 'success');
        console.log('Guest registry exported successfully');
    } catch (error) {
        console.error('Error exporting guest registry:', error);
        showNotification('Error exporting guest registry', 'danger');
    }
}

function viewGuestDetails(guestId) {
    console.log('Viewing guest details for:', guestId);
    const guest = guestRegistry.find(g => g.id === guestId);
    if (!guest) {
        showNotification('Guest not found', 'danger');
        return;
    }
    
    const content = `
        <div class="row">
            <div class="col-md-6">
                <h6>Guest Information</h6>
                <p><strong>Name:</strong> ${guest.guestName}</p>
                <p><strong>Email:</strong> ${guest.email}</p>
                <p><strong>Phone:</strong> ${guest.phone}</p>
                <p><strong>Room:</strong> ${guest.roomNumber || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <h6>Stay Information</h6>
                <p><strong>Room Type:</strong> ${guest.roomType}</p>
                <p><strong>Duration:</strong> ${guest.duration} nights</p>
                <p><strong>Status:</strong> <span class="badge bg-${getGuestStatusBadgeClass(guest.status)}">${guest.status}</span></p>
                <p><strong>Total Paid:</strong> ${formatCurrency(guest.totalPaid || guest.totalPrice)}</p>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-md-6">
                <h6>Check-in Details</h6>
                <p><strong>Date:</strong> ${formatDate(guest.actualCheckInDate)}</p>
                <p><strong>Time:</strong> ${guest.actualCheckInTime || 'N/A'}</p>
                <p><strong>Notes:</strong> ${guest.checkInNotes || 'None'}</p>
            </div>
            <div class="col-md-6">
                <h6>Check-out Details</h6>
                <p><strong>Date:</strong> ${formatDate(guest.actualCheckOutDate)}</p>
                <p><strong>Time:</strong> ${guest.actualCheckOutTime || 'N/A'}</p>
                <p><strong>Room Condition:</strong> ${guest.roomCondition || 'N/A'}</p>
                <p><strong>Additional Charges:</strong> ${formatCurrency(guest.additionalCharges || 0)}</p>
                <p><strong>Notes:</strong> ${guest.checkOutNotes || 'None'}</p>
            </div>
        </div>
    `;
    
    const detailsContent = document.getElementById('booking-details-content');
    const modalTitle = document.querySelector('#bookingDetailsModal .modal-title');
    const modalFooter = document.querySelector('#bookingDetailsModal .modal-footer');
    
    if (detailsContent) detailsContent.innerHTML = content;
    if (modalTitle) modalTitle.textContent = 'Guest Details';
    if (modalFooter) modalFooter.style.display = 'none';
    
    const modal = new bootstrap.Modal(document.getElementById('bookingDetailsModal'));
    modal.show();
}

// Customer functions
async function loadCustomers() {
    console.log('Loading customers...');
    try {
        // Extract unique customers from bookings
        const customerMap = new Map();
        
        bookings.forEach(booking => {
            const key = booking.email;
            if (!customerMap.has(key)) {
                customerMap.set(key, {
                    name: booking.guestName,
                    email: booking.email,
                    phone: booking.phone,
                    totalBookings: 0,
                    lastVisit: null,
                    firstVisit: null
                });
            }
            
            const customer = customerMap.get(key);
            customer.totalBookings++;
            
            const bookingDate = new Date(booking.checkIn);
            if (!customer.firstVisit || bookingDate < new Date(customer.firstVisit)) {
                customer.firstVisit = booking.checkIn;
            }
            if (!customer.lastVisit || bookingDate > new Date(customer.lastVisit)) {
                customer.lastVisit = booking.checkIn;
            }
        });
        
        customers = Array.from(customerMap.values());
        console.log('Customers loaded:', customers.length);
        displayCustomers();
    } catch (error) {
        console.error('Error loading customers:', error);
        customers = [];
        displayCustomers();
    }
}

function displayCustomers() {
    console.log('Displaying customers...');
    const tbody = document.getElementById('customers-body');
    if (!tbody) {
        console.error('Customers table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No customers found</td></tr>';
        return;
    }
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.totalBookings}</td>
            <td>${customer.lastVisit ? formatDate(customer.lastVisit) : 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewCustomerDetails('${customer.email}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Customers displayed successfully');
}

// Message functions
async function loadMessages() {
    console.log('Loading messages...');
    try {
        const snapshot = await db.collection('messages').get();
        messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // If no Firebase data, try localStorage
        if (messages.length === 0) {
            messages = JSON.parse(localStorage.getItem('messages') || '[]');
            console.log('Loaded messages from localStorage:', messages.length);
        } else {
            console.log('Loaded messages from Firebase:', messages.length);
        }
        
        displayMessages();
    } catch (error) {
        console.error('Error loading messages:', error);
        messages = JSON.parse(localStorage.getItem('messages') || '[]');
        console.log('Fallback: loaded messages from localStorage:', messages.length);
        displayMessages();
    }
}

function displayMessages() {
    console.log('Displaying messages...');
    const tbody = document.getElementById('messages-body');
    if (!tbody) {
        console.error('Messages table body not found');
        return;
    }
    
    tbody.innerHTML = '';
    
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No messages found</td></tr>';
        return;
    }
    
    messages.forEach(message => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${message.name}</td>
            <td>${message.email}</td>
            <td>${message.subject}</td>
            <td>${message.message.substring(0, 50)}${message.message.length > 50 ? '...' : ''}</td>
            <td>${formatDate(message.timestamp)}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewMessage('${message.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="markAsRead('${message.id}')" ${message.read ? 'disabled' : ''}>
                    <i class="fas fa-check"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    console.log('Messages displayed successfully');
}

// Utility functions
function refreshDashboard() {
    loadDashboardData();
    showNotification('Dashboard refreshed', 'success');
}

function exportBookings() {
    console.log('Exporting bookings...');
    try {
        const csvContent = "data:text/csv;charset=utf-8," 
            + "ID,Guest Name,Email,Phone,Room Type,Check-in,Check-out,Guests,Total Price,Status\n"
            + bookings.map(b => 
                `${b.id || ''},"${b.guestName || ''}","${b.email || ''}","${b.phone || ''}","${b.roomType || ''}","${b.checkIn || ''}","${b.checkOut || ''}",${b.numberOfGuests || b.guests || ''},${b.totalPrice || 0},${b.status || ''}`
            ).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `bookings_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Bookings exported successfully', 'success');
        console.log('Bookings exported successfully');
    } catch (error) {
        console.error('Error exporting bookings:', error);
        showNotification('Error exporting bookings', 'danger');
    }
}

function clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) return;
    
    try {
        localStorage.clear();
        bookings = [];
        messages = [];
        customers = [];
        guestRegistry = [];
        
        loadDashboardData();
        showNotification('All data cleared successfully', 'success');
    } catch (error) {
        console.error('Error clearing data:', error);
        showNotification('Error clearing data', 'danger');
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'index.html';
    }
}

// Initialize dashboard on load
showDashboard(); 