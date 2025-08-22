// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "abruzzo-grand-hotel.firebaseapp.com",
    projectId: "abruzzo-grand-hotel",
    storageBucket: "abruzzo-grand-hotel.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase with error handling
let db = null;
try {
    // Check if Firebase config has real values
    if (firebaseConfig.apiKey === "YOUR_API_KEY" || 
        firebaseConfig.messagingSenderId === "YOUR_SENDER_ID" || 
        firebaseConfig.appId === "YOUR_APP_ID") {
        throw new Error('Firebase configuration has placeholder values');
    }
    
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.warn('Firebase not properly configured. Using local storage fallback.');
    // Show notification to user about demo mode
    setTimeout(() => {
        showNotification('Running in demo mode - bookings will be saved locally', 'info');
    }, 2000);
    // Create a simple local storage fallback
    db = {
        collection: (collectionName) => ({
            add: async (data) => {
                const id = 'local_' + Date.now();
                const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                bookings.push({ id, ...data, timestamp: new Date() });
                localStorage.setItem('bookings', JSON.stringify(bookings));
                return { id };
            },
            get: async () => {
                const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                return {
                    docs: bookings.map(booking => ({
                        data: () => booking,
                        id: booking.id
                    }))
                };
            },
            where: function(field, operator, value) {
                return {
                    get: async () => {
                        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                        const filteredBookings = bookings.filter(booking => {
                            if (operator === '!=') {
                                return booking[field] !== value;
                            }
                            return true;
                        });
                        return {
                            docs: filteredBookings.map(booking => ({
                                data: () => booking,
                                id: booking.id
                            }))
                        };
                    }
                };
            }
        })
    };
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initializeNavigation();
    initializeWhatsApp();
    initializeBooking();
    initializeGallery();
    initializeAnimations();
    initializeContactForm();
    
    // Load and apply content from admin panel
    loadAndApplyContent();
});

// Load and apply content from admin panel

// Load and apply content from admin panel
function loadAndApplyContent() {
    try {
        const content = JSON.parse(localStorage.getItem('hotel-content') || '{}');
        const hotelInfo = JSON.parse(localStorage.getItem('hotel-info') || '{}');
        const roomPrices = JSON.parse(localStorage.getItem('room-prices') || '{}');
        
        // Update hotel name and rating in hero section
        if (content.hotelName) {
            const hotelNameElements = document.querySelectorAll('.hotel-name');
            hotelNameElements.forEach(element => {
                element.textContent = content.hotelName;
            });
        }
        
        if (content.hotelRating) {
            const ratingElements = document.querySelectorAll('.hotel-rating');
            ratingElements.forEach(element => {
                element.textContent = content.hotelRating;
            });
        }
        
        if (content.hotelTagline) {
            const taglineElements = document.querySelectorAll('.hotel-tagline');
            taglineElements.forEach(element => {
                element.textContent = content.hotelTagline;
            });
        }
        
        // Update room prices
        if (roomPrices.Standard) {
            const standardPriceElements = document.querySelectorAll('.standard-price');
            standardPriceElements.forEach(element => {
                element.textContent = `$${roomPrices.Standard}`;
            });
        }
        
        if (roomPrices.Deluxe) {
            const deluxePriceElements = document.querySelectorAll('.deluxe-price');
            deluxePriceElements.forEach(element => {
                element.textContent = `$${roomPrices.Deluxe}`;
            });
        }
        
        if (roomPrices.Executive) {
            const executivePriceElements = document.querySelectorAll('.executive-price');
            executivePriceElements.forEach(element => {
                element.textContent = `$${roomPrices.Executive}`;
            });
        }
        
        // Update room descriptions
        if (content.standardDescription) {
            const standardDescElements = document.querySelectorAll('.standard-description');
            standardDescElements.forEach(element => {
                element.textContent = content.standardDescription;
            });
        }
        
        if (content.deluxeDescription) {
            const deluxeDescElements = document.querySelectorAll('.deluxe-description');
            deluxeDescElements.forEach(element => {
                element.textContent = content.deluxeDescription;
            });
        }
        
        if (content.executiveDescription) {
            const executiveDescElements = document.querySelectorAll('.executive-description');
            executiveDescElements.forEach(element => {
                element.textContent = content.executiveDescription;
            });
        }
        
        // Update about section
        if (content.aboutTitle) {
            const aboutTitleElements = document.querySelectorAll('.about-title');
            aboutTitleElements.forEach(element => {
                element.textContent = content.aboutTitle;
            });
        }
        
        if (content.aboutDescription) {
            const aboutDescElements = document.querySelectorAll('.about-description');
            aboutDescElements.forEach(element => {
                element.textContent = content.aboutDescription;
            });
        }
        
        // Update features
        if (content.feature1Title) {
            const feature1TitleElements = document.querySelectorAll('.feature1-title');
            feature1TitleElements.forEach(element => {
                element.textContent = content.feature1Title;
            });
        }
        
        if (content.feature1Description) {
            const feature1DescElements = document.querySelectorAll('.feature1-description');
            feature1DescElements.forEach(element => {
                element.textContent = content.feature1Description;
            });
        }
        
        if (content.feature2Title) {
            const feature2TitleElements = document.querySelectorAll('.feature2-title');
            feature2TitleElements.forEach(element => {
                element.textContent = content.feature2Title;
            });
        }
        
        if (content.feature2Description) {
            const feature2DescElements = document.querySelectorAll('.feature2-description');
            feature2DescElements.forEach(element => {
                element.textContent = content.feature2Description;
            });
        }
        
        if (content.feature3Title) {
            const feature3TitleElements = document.querySelectorAll('.feature3-title');
            feature3TitleElements.forEach(element => {
                element.textContent = content.feature3Title;
            });
        }
        
        if (content.feature3Description) {
            const feature3DescElements = document.querySelectorAll('.feature3-description');
            feature3DescElements.forEach(element => {
                element.textContent = content.feature3Description;
            });
        }
        
        // Update services
        if (content.service1Title) {
            const service1TitleElements = document.querySelectorAll('.service1-title');
            service1TitleElements.forEach(element => {
                element.textContent = content.service1Title;
            });
        }
        
        if (content.service1Description) {
            const service1DescElements = document.querySelectorAll('.service1-description');
            service1DescElements.forEach(element => {
                element.textContent = content.service1Description;
            });
        }
        
        if (content.service2Title) {
            const service2TitleElements = document.querySelectorAll('.service2-title');
            service2TitleElements.forEach(element => {
                element.textContent = content.service2Title;
            });
        }
        
        if (content.service2Description) {
            const service2DescElements = document.querySelectorAll('.service2-description');
            service2DescElements.forEach(element => {
                element.textContent = content.service2Description;
            });
        }
        
        if (content.service3Title) {
            const service3TitleElements = document.querySelectorAll('.service3-title');
            service3TitleElements.forEach(element => {
                element.textContent = content.service3Title;
            });
        }
        
        if (content.service3Description) {
            const service3DescElements = document.querySelectorAll('.service3-description');
            service3DescElements.forEach(element => {
                element.textContent = content.service3Description;
            });
        }
        
        if (content.service4Title) {
            const service4TitleElements = document.querySelectorAll('.service4-title');
            service4TitleElements.forEach(element => {
                element.textContent = content.service4Title;
            });
        }
        
        if (content.service4Description) {
            const service4DescElements = document.querySelectorAll('.service4-description');
            service4DescElements.forEach(element => {
                element.textContent = content.service4Description;
            });
        }
        
        // Update contact information
        if (content.contactEmail) {
            const emailElements = document.querySelectorAll('.contact-email');
            emailElements.forEach(element => {
                element.textContent = content.contactEmail;
                if (element.tagName === 'A') {
                    element.href = `mailto:${content.contactEmail}`;
                }
            });
        }
        
        if (content.contactPhone) {
            const phoneElements = document.querySelectorAll('.contact-phone');
            phoneElements.forEach(element => {
                element.textContent = content.contactPhone;
                if (element.tagName === 'A') {
                    element.href = `tel:${content.contactPhone}`;
                }
            });
        }
        
        if (content.hotelAddress) {
            const addressElements = document.querySelectorAll('.hotel-address');
            addressElements.forEach(element => {
                element.textContent = content.hotelAddress;
            });
        }
        
        // Update WhatsApp settings
        if (content.whatsappNumber) {
            window.whatsappNumber = content.whatsappNumber;
        }
        
        if (content.whatsappMessage) {
            window.whatsappMessage = content.whatsappMessage;
        }
        
        if (content.whatsappEnabled === 'false') {
            const whatsappWidget = document.getElementById('whatsapp-widget');
            if (whatsappWidget) {
                whatsappWidget.style.display = 'none';
            }
        }
        
        console.log('Content applied successfully');
        
    } catch (error) {
        console.error('Error applying content:', error);
    }
}

// Setup event listeners

// Navigation Functions
function initializeNavigation() {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar background change on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(26, 26, 26, 0.98)';
        } else {
            navbar.style.background = 'rgba(26, 26, 26, 0.95)';
        }
    });
}

// WhatsApp Chat Functions
function initializeWhatsApp() {
    // Set default dates for booking
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById('checkIn').value = today.toISOString().split('T')[0];
    document.getElementById('checkOut').value = tomorrow.toISOString().split('T')[0];
}

function toggleWhatsApp() {
    const whatsappBody = document.getElementById('whatsappBody');
    const whatsappToggle = document.getElementById('whatsappToggle');
    
    whatsappBody.classList.toggle('active');
    
    if (whatsappBody.classList.contains('active')) {
        whatsappToggle.style.transform = 'rotate(180deg)';
    } else {
        whatsappToggle.style.transform = 'rotate(0deg)';
    }
}

function sendWhatsAppMessage() {
    const input = document.getElementById('whatsappInput');
    const message = input.value.trim();
    
    if (message) {
        const messagesContainer = document.querySelector('.whatsapp-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message sent';
        messageDiv.innerHTML = `
            <p>${message}</p>
            <span class="time">Just now</span>
        `;
        messagesContainer.appendChild(messageDiv);
        
        // Clear input
        input.value = '';
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Simulate response after 2 seconds
        setTimeout(() => {
            const responseDiv = document.createElement('div');
            responseDiv.className = 'message received';
            responseDiv.innerHTML = `
                <p>Thank you for your message! Our team will get back to you shortly. For immediate assistance, please call us at 09043965470.</p>
                <span class="time">Just now</span>
            `;
            messagesContainer.appendChild(responseDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 2000);
    }
}

// Hotel Room Inventory
const HOTEL_ROOMS = {
    standard: { total: 4, price: 25000, name: 'Standard Room' },
    deluxe: { total: 3, price: 35000, name: 'Deluxe Room' },
    executive: { total: 2, price: 50000, name: 'Executive Suite' }
};

// Booking Functions
function initializeBooking() {
    // Handle booking form submission
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBookingSubmission();
        });
        
        // Add real-time booking summary updates
        const roomTypeSelect = document.getElementById('bookingRoomType');
        const checkInInput = document.getElementById('bookingCheckIn');
        const checkOutInput = document.getElementById('bookingCheckOut');
        
        if (roomTypeSelect) {
            roomTypeSelect.addEventListener('change', updateBookingSummary);
        }
        if (checkInInput) {
            checkInInput.addEventListener('change', updateBookingSummary);
        }
        if (checkOutInput) {
            checkOutInput.addEventListener('change', updateBookingSummary);
        }
        
        // Add real-time validation feedback
        const formInputs = bookingForm.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    validateField(this);
                }
            });
        });
    }
    
    // Handle contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactSubmission();
        });
    }
    
    // Initialize date inputs with proper validation
    setupDateInputs();
}

function validateField(field) {
    const value = field.value.trim();
    
    // Remove previous validation classes
    field.classList.remove('is-valid', 'is-invalid');
    
    // Check if field is required
    if (field.hasAttribute('required') && !value) {
        field.classList.add('is-invalid');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            field.classList.add('is-invalid');
            return false;
        }
    }
    
    // Phone validation (basic)
    if (field.type === 'tel' && value) {
        if (value.length < 10) {
            field.classList.add('is-invalid');
            return false;
        }
    }
    
    // Date validation
    if (field.type === 'date' && value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            field.classList.add('is-invalid');
            return false;
        }
    }
    
    // If we get here, field is valid
    if (value) {
        field.classList.add('is-valid');
    }
    
    return true;
}

function updateBookingSummary() {
    const roomType = document.getElementById('bookingRoomType').value;
    const checkIn = document.getElementById('bookingCheckIn').value;
    const checkOut = document.getElementById('bookingCheckOut').value;
    const summaryDiv = document.getElementById('bookingSummary');
    
    if (roomType && checkIn && checkOut) {
        const room = HOTEL_ROOMS[roomType];
        const nights = calculateNights(checkIn, checkOut);
        const totalPrice = room.price * nights;
        
        if (nights > 0) {
            document.getElementById('summaryRoom').textContent = room.name;
            document.getElementById('summaryDuration').textContent = `${nights} night${nights > 1 ? 's' : ''}`;
            document.getElementById('summaryPrice').textContent = `₦${totalPrice.toLocaleString()}`;
            summaryDiv.style.display = 'block';
        } else {
            summaryDiv.style.display = 'none';
        }
    } else {
        summaryDiv.style.display = 'none';
    }
}

async function checkAvailability() {
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const guests = document.getElementById('guests').value;
    const rooms = document.getElementById('rooms').value;
    
    if (!checkIn || !checkOut) {
        showNotification('Please select check-in and check-out dates', 'warning');
        return;
    }
    
    if (new Date(checkIn) >= new Date(checkOut)) {
        showNotification('Check-out date must be after check-in date', 'warning');
        return;
    }
    
    if (new Date(checkIn) < new Date()) {
        showNotification('Check-in date cannot be in the past', 'warning');
        return;
    }
    
    // Show loading state
    showNotification('Checking room availability...', 'info');
    
    try {
        // Get real availability data
        const availability = await getRoomAvailability(checkIn, checkOut);
        displayAvailabilityResults(availability, checkIn, checkOut, guests, rooms);
    } catch (error) {
        console.error('Error checking availability:', error);
        showNotification('Error checking availability. Please try again.', 'error');
    }
}

async function getRoomAvailability(checkIn, checkOut) {
    try {
        // Query Firebase for existing bookings in the date range
        // Use a simpler query to avoid multiple inequality filters
        const bookingsSnapshot = await db.collection('bookings')
            .where('status', '!=', 'cancelled')
            .get();
        
        // Count booked rooms by type for the date range
        const bookedRooms = {
            standard: 0,
            deluxe: 0,
            executive: 0
        };
        
        bookingsSnapshot.forEach(doc => {
            const booking = doc.data();
            const roomType = booking.roomType;
            
            // Check if booking overlaps with the requested date range
            const bookingCheckIn = new Date(booking.checkIn);
            const bookingCheckOut = new Date(booking.checkOut);
            const requestedCheckIn = new Date(checkIn);
            const requestedCheckOut = new Date(checkOut);
            
            // Check for overlap: booking starts before requested checkout AND booking ends after requested checkin
            if (bookingCheckIn < requestedCheckOut && bookingCheckOut > requestedCheckIn) {
                if (bookedRooms.hasOwnProperty(roomType)) {
                    bookedRooms[roomType]++;
                }
            }
        });
        
        // Calculate available rooms
        const availability = {};
        Object.keys(HOTEL_ROOMS).forEach(roomType => {
            const total = HOTEL_ROOMS[roomType].total;
            const booked = bookedRooms[roomType] || 0;
            availability[roomType] = {
                ...HOTEL_ROOMS[roomType],
                available: Math.max(0, total - booked),
                booked: booked
            };
        });
        
        return availability;
    } catch (error) {
        console.error('Error getting availability:', error);
        // Return default availability if error
        const availability = {};
        Object.keys(HOTEL_ROOMS).forEach(roomType => {
            availability[roomType] = {
                ...HOTEL_ROOMS[roomType],
                available: HOTEL_ROOMS[roomType].total,
                booked: 0
            };
        });
        return availability;
    }
}

function displayAvailabilityResults(availability, checkIn, checkOut, guests, rooms) {
    // Create availability modal or update existing section
    let resultsSection = document.getElementById('availability-results');
    if (!resultsSection) {
        resultsSection = document.createElement('section');
        resultsSection.id = 'availability-results';
        resultsSection.className = 'py-4 bg-light';
        
        // Insert after quick booking section
        const quickBooking = document.querySelector('.quick-booking');
        quickBooking.parentNode.insertBefore(resultsSection, quickBooking.nextSibling);
    }
    
    const totalAvailable = Object.values(availability).reduce((sum, room) => sum + room.available, 0);
    
    if (totalAvailable === 0) {
        resultsSection.innerHTML = `
            <div class="container">
                <div class="text-center">
                    <h3 class="text-danger">No Rooms Available</h3>
                    <p>Sorry, no rooms are available for your selected dates (${formatDate(checkIn)} to ${formatDate(checkOut)}).</p>
                    <p>Please try different dates or contact us at <a href="tel:09043965470">09043965470</a> for assistance.</p>
                </div>
            </div>
        `;
        showNotification('No rooms available for selected dates', 'warning');
        return;
    }
    
    resultsSection.innerHTML = `
        <div class="container">
            <div class="text-center mb-4">
                <h3 class="text-success">Available Rooms Found!</h3>
                <p>For ${formatDate(checkIn)} to ${formatDate(checkOut)} (${calculateNights(checkIn, checkOut)} night${calculateNights(checkIn, checkOut) > 1 ? 's' : ''})</p>
                <p class="text-muted">${totalAvailable} of 9 rooms available</p>
            </div>
            <div class="row g-4">
                ${Object.entries(availability).map(([type, room]) => createRoomAvailabilityCard(type, room, checkIn, checkOut)).join('')}
            </div>
        </div>
    `;
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    showNotification(`${totalAvailable} rooms available!`, 'success');
}

function createRoomAvailabilityCard(type, room, checkIn, checkOut) {
    const nights = calculateNights(checkIn, checkOut);
    const totalPrice = room.price * nights;
    const isAvailable = room.available > 0;
    
    return `
        <div class="col-lg-4 col-md-6">
            <div class="room-card ${!isAvailable ? 'unavailable' : ''}">
                <div class="room-image">
                    <img src="${getRoomImage(type)}" alt="${room.name}">
                    <div class="room-price">
                        <span class="price">₦${room.price.toLocaleString()}</span>
                        <span class="per-night">per night</span>
                    </div>
                    ${!isAvailable ? '<div class="sold-out-badge">Fully Booked</div>' : ''}
                </div>
                <div class="room-content">
                    <h3>${room.name}</h3>
                    <div class="availability-info">
                        <p class="${isAvailable ? 'text-success' : 'text-danger'}">
                            <i class="fas ${isAvailable ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${isAvailable ? `${room.available} room${room.available > 1 ? 's' : ''} available` : 'Fully booked'}
                        </p>
                        <p class="text-muted">${room.total - room.available} of ${room.total} rooms booked</p>
                    </div>
                    <div class="pricing-breakdown">
                        <p><strong>Total for ${nights} night${nights > 1 ? 's' : ''}: ₦${totalPrice.toLocaleString()}</strong></p>
                    </div>
                    <div class="room-features">
                        <span><i class="fas fa-bed"></i> 1 King Bed</span>
                        <span><i class="fas fa-users"></i> 2-${type === 'executive' ? '4' : '2'} Guests</span>
                        <span><i class="fas fa-wifi"></i> Free WiFi</span>
                    </div>
                    ${isAvailable ? 
                        `<button class="btn btn-primary w-100" onclick="selectRoom('${type}', '${room.name}', ${room.price}, '${checkIn}', '${checkOut}')">
                            Select This Room
                        </button>` :
                        `<button class="btn btn-secondary w-100" disabled>
                            Fully Booked
                        </button>`
                    }
                </div>
            </div>
        </div>
    `;
}

function selectRoom(roomType, roomName, price, checkIn, checkOut) {
    // If checkIn and checkOut are not provided, get default dates
    if (!checkIn || !checkOut) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        checkIn = today.toISOString().split('T')[0];
        checkOut = tomorrow.toISOString().split('T')[0];
    }
    
    // Show room gallery first
    showRoomGallery(roomType, roomName, price, checkIn, checkOut);
}

function showRoomGallery(roomType, roomName, price, checkIn, checkOut) {
    // Room gallery data
    const roomGalleries = {
        standard: {
            name: 'Standard Room',
            price: 25000,
            description: 'Comfortable and elegant room with modern amenities',
            features: ['1 King Bed', '2 Guests', 'Free WiFi', 'Air Conditioning', 'Private Bathroom', 'TV', 'Mini Fridge'],
            images: [
                'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2068&q=80'
            ]
        },
        deluxe: {
            name: 'Deluxe Room',
            price: 35000,
            description: 'Spacious room with premium amenities and city view',
            features: ['1 King Bed', '2 Guests', 'Free WiFi', 'Air Conditioning', 'Private Bathroom', 'TV', 'Mini Fridge', 'City View', 'Balcony'],
            images: [
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2068&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
            ]
        },
        executive: {
            name: 'Executive Suite',
            price: 50000,
            description: 'Luxurious suite with separate living area and premium services',
            features: ['1 King Bed', '4 Guests', 'Free WiFi', 'Air Conditioning', 'Private Bathroom', 'TV', 'Mini Fridge', 'Living Room', 'Kitchenette', 'Premium Services'],
            images: [
                'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2098&q=80',
                'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                'https://images.unsplash.com/photo-1590490360182-c33d57733427?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2068&q=80'
            ]
        }
    };
    
    const room = roomGalleries[roomType];
    const nights = calculateNights(checkIn, checkOut);
    const totalPrice = room.price * nights;
    
    // Create room gallery modal
    const modal = document.createElement('div');
    modal.className = 'room-gallery-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeRoomGallery()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3><i class="fas fa-bed"></i> ${room.name}</h3>
                    <button onclick="closeRoomGallery()" class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="room-gallery-container">
                        <div class="main-image">
                            <img id="mainRoomImage" src="${room.images[0]}" alt="${room.name}">
                            <div class="image-nav">
                                <button onclick="changeRoomImage('prev')" class="nav-btn prev"><i class="fas fa-chevron-left"></i></button>
                                <button onclick="changeRoomImage('next')" class="nav-btn next"><i class="fas fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div class="thumbnail-images">
                            ${room.images.map((img, index) => `
                                <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="setMainImage(${index})">
                                    <img src="${img}" alt="${room.name} ${index + 1}">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="room-details">
                        <div class="room-info">
                            <h4>${room.name}</h4>
                            <p class="description">${room.description}</p>
                            <div class="price-info">
                                <span class="price">₦${room.price.toLocaleString()}</span>
                                <span class="per-night">per night</span>
                            </div>
                            ${nights > 0 ? `
                                <div class="total-price">
                                    <strong>Total for ${nights} night${nights > 1 ? 's' : ''}: ₦${totalPrice.toLocaleString()}</strong>
                                </div>
                            ` : ''}
                        </div>
                        <div class="room-features">
                            <h5>Room Features:</h5>
                            <div class="features-grid">
                                ${room.features.map(feature => `
                                    <div class="feature-item">
                                        <i class="fas fa-check"></i>
                                        <span>${feature}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeRoomGallery()" class="btn btn-secondary">Close</button>
                    <button onclick="proceedToBooking('${roomType}', '${room.name}', ${room.price}, '${checkIn}', '${checkOut}')" class="btn btn-primary">
                        <i class="fas fa-calendar-check"></i> Book This Room
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    modal.querySelector('.modal-overlay').style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 20px;
    `;
    
    modal.querySelector('.modal-content').style.cssText = `
        background: white;
        border-radius: 15px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Store current room data for navigation
    window.currentRoomGallery = {
        room: room,
        currentImage: 0,
        roomType: roomType,
        checkIn: checkIn,
        checkOut: checkOut
    };
}

function changeRoomImage(direction) {
    const gallery = window.currentRoomGallery;
    const images = gallery.room.images;
    
    if (direction === 'next') {
        gallery.currentImage = (gallery.currentImage + 1) % images.length;
    } else {
        gallery.currentImage = gallery.currentImage === 0 ? images.length - 1 : gallery.currentImage - 1;
    }
    
    setMainImage(gallery.currentImage);
}

function setMainImage(index) {
    const gallery = window.currentRoomGallery;
    gallery.currentImage = index;
    
    // Update main image
    const mainImage = document.getElementById('mainRoomImage');
    mainImage.src = gallery.room.images[index];
    
    // Update thumbnails
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

function closeRoomGallery() {
    const modal = document.querySelector('.room-gallery-modal');
    if (modal) {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
        window.currentRoomGallery = null;
    }
}

function proceedToBooking(roomType, roomName, price, checkIn, checkOut) {
    // Close gallery modal
    closeRoomGallery();
    
    // Pre-fill booking form with selected room and dates
    const bookingSection = document.getElementById('booking');
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
        // Fill in the form fields using new IDs
        const roomSelect = document.getElementById('bookingRoomType');
        const checkInInput = document.getElementById('bookingCheckIn');
        const checkOutInput = document.getElementById('bookingCheckOut');
        
        if (roomSelect) roomSelect.value = roomType;
        if (checkInInput) checkInInput.value = checkIn;
        if (checkOutInput) checkOutInput.value = checkOut;
        
        // Update booking summary
        updateBookingSummary();
        
        // Scroll to booking form
        bookingSection.scrollIntoView({ behavior: 'smooth' });
        
        const nights = calculateNights(checkIn, checkOut);
        const totalPrice = price * nights;
        
        showNotification(`Selected ${roomName} for ₦${totalPrice.toLocaleString()} (${nights} night${nights > 1 ? 's' : ''})`, 'success');
    }
}

function bookRoom(roomType, price) {
    // Enhanced book room function
    selectRoom(roomType.toLowerCase().replace(' ', ''), roomType, price, '', '');
}

// Helper functions
function setupDateInputs() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Setup quick booking bar dates
    const quickCheckIn = document.getElementById('checkIn');
    const quickCheckOut = document.getElementById('checkOut');
    
    if (quickCheckIn) {
        quickCheckIn.value = today.toISOString().split('T')[0];
        quickCheckIn.min = today.toISOString().split('T')[0];
    }
    
    if (quickCheckOut) {
        quickCheckOut.value = tomorrow.toISOString().split('T')[0];
        quickCheckOut.min = tomorrow.toISOString().split('T')[0];
    }
    
    // Setup main booking form dates
    const bookingCheckIn = document.getElementById('bookingCheckIn');
    const bookingCheckOut = document.getElementById('bookingCheckOut');
    
    if (bookingCheckIn) {
        bookingCheckIn.value = today.toISOString().split('T')[0];
        bookingCheckIn.min = today.toISOString().split('T')[0];
    }
    
    if (bookingCheckOut) {
        bookingCheckOut.value = tomorrow.toISOString().split('T')[0];
        bookingCheckOut.min = tomorrow.toISOString().split('T')[0];
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function calculateNights(checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const timeDiff = end.getTime() - start.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

function getRoomImage(roomType) {
    const images = {
        standard: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
        deluxe: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2068&q=80',
        executive: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2098&q=80'
    };
    return images[roomType] || images.standard;
}

async function handleBookingSubmission() {
    const form = document.getElementById('bookingForm');
    
    // Prevent default form submission
    event.preventDefault();
    
    // Extract form data using proper selectors
    const name = form.querySelector('#bookingName').value.trim();
    const email = form.querySelector('#bookingEmail').value.trim();
    const phone = form.querySelector('#bookingPhone').value.trim();
    const roomType = form.querySelector('#bookingRoomType').value;
    const checkIn = form.querySelector('#bookingCheckIn').value;
    const checkOut = form.querySelector('#bookingCheckOut').value;
    const guests = form.querySelector('#bookingGuests').value;
    const specialRequests = form.querySelector('#bookingRequests').value.trim();
    
    // Clear previous validation states
    form.classList.remove('was-validated');
    
    // Validate required fields
    let isValid = true;
    const requiredFields = [
        { element: form.querySelector('#bookingName'), value: name, message: 'Please enter your full name' },
        { element: form.querySelector('#bookingEmail'), value: email, message: 'Please enter a valid email address' },
        { element: form.querySelector('#bookingPhone'), value: phone, message: 'Please enter your phone number' },
        { element: form.querySelector('#bookingRoomType'), value: roomType, message: 'Please select a room type' },
        { element: form.querySelector('#bookingCheckIn'), value: checkIn, message: 'Please select check-in date' },
        { element: form.querySelector('#bookingCheckOut'), value: checkOut, message: 'Please select check-out date' }
    ];
    
    requiredFields.forEach(field => {
        if (!field.value) {
            field.element.classList.add('is-invalid');
            isValid = false;
        } else {
            field.element.classList.remove('is-invalid');
            field.element.classList.add('is-valid');
        }
    });
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        form.querySelector('#bookingEmail').classList.add('is-invalid');
        isValid = false;
    }
    
    if (!isValid) {
        showNotification('Please fill in all required fields correctly', 'warning');
        return;
    }
    
    // Validate dates
    if (new Date(checkIn) >= new Date(checkOut)) {
        showNotification('Check-out date must be after check-in date', 'warning');
        return;
    }
    
    if (new Date(checkIn) < new Date()) {
        showNotification('Check-in date cannot be in the past', 'warning');
        return;
    }
    
    // Show booking preview instead of direct submission
    showBookingPreview(name, email, phone, roomType, checkIn, checkOut, guests, specialRequests);
}

function showBookingPreview(name, email, phone, roomType, checkIn, checkOut, guests, specialRequests) {
    // Calculate booking details
    const nights = calculateNights(checkIn, checkOut);
    const room = HOTEL_ROOMS[roomType];
    const pricePerNight = room.price;
    const totalPrice = pricePerNight * nights;
    
    // Populate preview modal with booking details
    document.getElementById('previewName').textContent = name;
    document.getElementById('previewEmail').textContent = email;
    document.getElementById('previewPhone').textContent = phone;
    document.getElementById('previewRoomType').textContent = room.name;
    document.getElementById('previewCheckIn').textContent = formatDate(checkIn);
    document.getElementById('previewCheckOut').textContent = formatDate(checkOut);
    document.getElementById('previewGuests').textContent = `${guests} Guest${guests > 1 ? 's' : ''}`;
    document.getElementById('previewDuration').textContent = `${nights} Night${nights > 1 ? 's' : ''}`;
    document.getElementById('previewPricePerNight').textContent = `₦${pricePerNight.toLocaleString()}`;
    document.getElementById('previewTotalPrice').textContent = `₦${totalPrice.toLocaleString()}`;
    
    // Handle special requests
    if (specialRequests && specialRequests.trim() !== '') {
        document.getElementById('previewRequests').style.display = 'block';
        document.getElementById('previewRequestsText').textContent = specialRequests;
    } else {
        document.getElementById('previewRequests').style.display = 'none';
    }
    
    // Reset terms checkbox
    document.getElementById('previewTermsCheck').checked = false;
    document.getElementById('confirmBookingBtn').disabled = true;
    
    // Add event listener for terms checkbox
    const termsCheck = document.getElementById('previewTermsCheck');
    const confirmBtn = document.getElementById('confirmBookingBtn');
    
    termsCheck.onchange = function() {
        confirmBtn.disabled = !this.checked;
    };
    
    // Add event listener for confirm booking button
    confirmBtn.onclick = function() {
        confirmBooking(name, email, phone, roomType, checkIn, checkOut, guests, specialRequests, totalPrice, nights);
    };
    
    // Show the preview modal
    const previewModal = new bootstrap.Modal(document.getElementById('bookingPreviewModal'));
    previewModal.show();
}

async function confirmBooking(name, email, phone, roomType, checkIn, checkOut, guests, specialRequests, totalPrice, nights) {
    console.log('Starting booking confirmation...', { name, email, roomType, checkIn, checkOut });
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmBookingBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    confirmBtn.disabled = true;
    
    // Add a timeout to prevent infinite processing
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });
    
    try {
        console.log('Checking room availability...');
        // Check room availability before booking
        showNotification('Checking room availability...', 'info');
        
        // Race between the actual operation and timeout
        const availability = await Promise.race([
            getRoomAvailability(checkIn, checkOut),
            timeoutPromise
        ]);
        
        console.log('Availability result:', availability);
        
        if (!availability[roomType] || availability[roomType].available <= 0) {
            showNotification(`Sorry, ${HOTEL_ROOMS[roomType].name} is not available for your selected dates`, 'error');
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
            return;
        }
        
        console.log('Preparing booking data...');
        // Prepare booking data
        const bookingData = {
            name: name,
            email: email,
            phone: phone,
            roomType: roomType,
            roomName: HOTEL_ROOMS[roomType].name,
            checkIn: checkIn,
            checkOut: checkOut,
            nights: nights,
            guests: parseInt(guests),
            pricePerNight: HOTEL_ROOMS[roomType].price,
            totalPrice: totalPrice,
            specialRequests: specialRequests || 'None',
            status: 'confirmed',
            bookingDate: new Date().toISOString().split('T')[0],
            timestamp: new Date()
        };
        
        console.log('Saving booking data...', bookingData);
        // Save to Firebase or local storage with timeout
        const docRef = await Promise.race([
            db.collection('bookings').add(bookingData),
            timeoutPromise
        ]);
        
        console.log('Booking saved successfully, docRef:', docRef);
        
        // Close preview modal
        const previewModal = bootstrap.Modal.getInstance(document.getElementById('bookingPreviewModal'));
        if (previewModal) {
            previewModal.hide();
        }
        
        console.log('Showing booking confirmation...');
        // Show confirmation modal
        showBookingConfirmation(docRef.id, bookingData);
        
        // Reset booking form
        const form = document.getElementById('bookingForm');
        form.reset();
        setupDateInputs();
        
        // Clear validation states
        form.querySelectorAll('.is-valid, .is-invalid').forEach(field => {
            field.classList.remove('is-valid', 'is-invalid');
        });
        
        // Hide booking summary
        const bookingSummary = document.getElementById('bookingSummary');
        if (bookingSummary) {
            bookingSummary.style.display = 'none';
        }
        
        // Send WhatsApp notification
        sendWhatsAppNotification(`New booking: ${name} - ${HOTEL_ROOMS[roomType].name}`);
        
        showNotification('Booking confirmed successfully!', 'success');
        console.log('Booking confirmation completed successfully');
        
    } catch (error) {
        console.error('Error confirming booking:', error);
        
        // Check if it's a timeout error
        if (error.message === 'Request timeout') {
            showNotification('Request timed out. Please try again.', 'warning');
        }
        // Check if it's a Firebase configuration error or connection issue
        else if (error.message && (error.message.includes('API key') || error.message.includes('FirebaseError') || error.message.includes('Firebase configuration has placeholder values') || error.code === 'unavailable')) {
            showNotification('Booking system is in demo mode. Your booking has been saved locally.', 'info');
            
            // Still show confirmation even if Firebase fails
            const bookingData = {
                name: name,
                email: email,
                phone: phone,
                roomType: roomType,
                roomName: HOTEL_ROOMS[roomType].name,
                checkIn: checkIn,
                checkOut: checkOut,
                nights: nights,
                guests: parseInt(guests),
                pricePerNight: HOTEL_ROOMS[roomType].price,
                totalPrice: totalPrice,
                specialRequests: specialRequests || 'None',
                status: 'confirmed',
                bookingDate: new Date().toISOString().split('T')[0],
                timestamp: new Date()
            };
            
            // Close preview modal
            const previewModal = bootstrap.Modal.getInstance(document.getElementById('bookingPreviewModal'));
            if (previewModal) {
                previewModal.hide();
            }
            
            // Show confirmation with local ID
            const localId = 'local_' + Date.now();
            showBookingConfirmation(localId, bookingData);
            
            // Reset booking form
            const form = document.getElementById('bookingForm');
            form.reset();
            setupDateInputs();
            
            // Clear validation states
            form.querySelectorAll('.is-valid, .is-invalid').forEach(field => {
                field.classList.remove('is-valid', 'is-invalid');
            });
            
            // Hide booking summary
            const bookingSummary = document.getElementById('bookingSummary');
            if (bookingSummary) {
                bookingSummary.style.display = 'none';
            }
        } else {
            showNotification('Error confirming booking. Please try again or contact us directly.', 'error');
        }
    } finally {
        console.log('Resetting button state...');
        // Reset button state
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

function showBookingConfirmation(bookingId, bookingData) {
    // Populate the existing Bootstrap confirmation modal
    document.getElementById('confirmationBookingId').textContent = bookingId.slice(-8).toUpperCase();
    document.getElementById('confirmationName').textContent = bookingData.name;
    document.getElementById('confirmationEmail').textContent = bookingData.email;
    document.getElementById('confirmationPhone').textContent = bookingData.phone;
    document.getElementById('confirmationRoomType').textContent = bookingData.roomName;
    document.getElementById('confirmationCheckIn').textContent = formatDate(bookingData.checkIn);
    document.getElementById('confirmationCheckOut').textContent = formatDate(bookingData.checkOut);
    document.getElementById('confirmationGuests').textContent = `${bookingData.guests} Guest${bookingData.guests > 1 ? 's' : ''}`;
    document.getElementById('confirmationDuration').textContent = `${bookingData.nights} Night${bookingData.nights > 1 ? 's' : ''}`;
    document.getElementById('confirmationTotalPrice').textContent = `₦${bookingData.totalPrice.toLocaleString()}`;
    
    // Handle special requests
    if (bookingData.specialRequests && bookingData.specialRequests !== 'None') {
        document.getElementById('confirmationRequests').style.display = 'block';
        document.getElementById('confirmationRequestsText').textContent = bookingData.specialRequests;
    } else {
        document.getElementById('confirmationRequests').style.display = 'none';
    }
    
    // Show the Bootstrap confirmation modal
    const confirmationModal = new bootstrap.Modal(document.getElementById('bookingConfirmationModal'));
    confirmationModal.show();
    
    showNotification('Booking confirmed successfully! Check your email for confirmation.', 'success');
}

function closeBookingConfirmation() {
    const confirmationModal = bootstrap.Modal.getInstance(document.getElementById('bookingConfirmationModal'));
    if (confirmationModal) {
        confirmationModal.hide();
    }
}

function printBooking() {
    window.print();
}

// Gallery Functions
function initializeGallery() {
    // Add click handlers to gallery items
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });
    
    // Close lightbox when clicking outside
    const lightbox = document.getElementById('lightbox');
    lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Close lightbox with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeLightbox();
        }
    });
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    
    const images = [
        { src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2068&q=80', caption: 'Swimming Pool' },
        { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', caption: 'Hotel Exterior' },
        { src: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', caption: 'Luxury Lobby' },
        { src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', caption: 'Luxury Room' },
        { src: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2098&q=80', caption: 'Event Hall' },
        { src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', caption: 'Fine Dining' }
    ];
    
    if (images[index]) {
        lightboxImg.src = images[index].src;
        lightboxCaption.textContent = images[index].caption;
        lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Animation Functions
function initializeAnimations() {
    // Add fade-in animation to elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .room-card, .about-content, .about-image, .contact-item');
    animateElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });

    // Add loading animation to images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
    });
}

// Contact Form Functions
function initializeContactForm() {
    // Add click to copy functionality for phone numbers
    const phoneNumbers = document.querySelectorAll('a[href^="tel:"]');
    phoneNumbers.forEach(phone => {
        phone.addEventListener('click', function(e) {
            const number = this.getAttribute('href').replace('tel:', '');
            navigator.clipboard.writeText(number).then(() => {
                showNotification('Phone number copied to clipboard!', 'success');
            });
        });
    });
}

async function handleContactSubmission() {
    const formData = new FormData(document.getElementById('contactForm'));
    const contactData = {
        name: formData.get('name') || 'Not provided',
        email: formData.get('email') || 'Not provided',
        phone: formData.get('phone') || 'Not provided',
        subject: formData.get('subject') || 'General Inquiry',
        message: formData.get('message') || 'No message provided',
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // Save to Firebase
        await db.collection('contact_messages').add(contactData);
        
        showNotification('Message sent successfully! We will get back to you soon.', 'success');
        
        // Reset form
        document.getElementById('contactForm').reset();
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error sending message. Please try again.', 'error');
    }
}

// Utility Functions
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;

    // Add styles based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 350px;
        font-weight: 500;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    });

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

function sendWhatsAppNotification(message) {
    // This would integrate with WhatsApp Business API
    console.log('WhatsApp notification:', message);
}

// Debounce function
function debounce(func, wait) {
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

// Handle window resize
window.addEventListener('resize', debounce(() => {
    // Recalculate any responsive elements if needed
}, 250));

// Add keyboard support for WhatsApp input
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement.id === 'whatsappInput') {
        sendWhatsAppMessage();
    }
});

// Initialize WhatsApp on page load
document.addEventListener('DOMContentLoaded', function() {
    // Auto-open WhatsApp after 30 seconds
    setTimeout(() => {
        if (!document.querySelector('.whatsapp-body.active')) {
            showNotification('Need help? Chat with us on WhatsApp!', 'info');
        }
    }, 30000);
}); 