# Abruzzo Grand Hotel Website

A professional, responsive website for Abruzzo Grand Hotel built with modern web technologies including Bootstrap, Firebase, and vanilla JavaScript.

## Features

- **Responsive Design**: Mobile-first approach with Bootstrap 5
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Firebase Integration**: Contact form submissions stored in Firestore
- **Interactive Elements**: Smooth scrolling, hover effects, and notifications
- **Performance Optimized**: Lazy loading images and optimized animations
- **Cross-browser Compatible**: Works on all modern browsers

## Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Bootstrap 5**: Responsive framework
- **JavaScript (ES6+)**: Interactive functionality
- **Firebase**: Backend services (Firestore)
- **Font Awesome**: Icons
- **Google Fonts**: Typography

## Project Structure

```
abruzzo-grand-hotel/
├── index.html          # Main HTML file
├── styles.css          # Custom CSS styles
├── script.js           # JavaScript functionality
├── README.md           # Project documentation
└── firebase-config.js  # Firebase configuration (create this)
```

## Setup Instructions

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd abruzzo-grand-hotel
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Firestore Database
4. Go to Project Settings > General
5. Scroll down to "Your apps" section
6. Click "Add app" and select Web
7. Register your app and copy the configuration

### 3. Update Firebase Configuration

Create a file called `firebase-config.js` in the root directory:

```javascript
// firebase-config.js
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

Then update the `script.js` file to use your configuration:

```javascript
// Replace the placeholder config in script.js
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-actual-domain",
    projectId: "your-actual-project-id",
    storageBucket: "your-actual-storage-bucket",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

### 4. Firestore Security Rules

Update your Firestore security rules to allow write access for contact form submissions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /contact_messages/{document} {
      allow write: if true;  // Allow anyone to write contact messages
      allow read: if false;  // Only allow admin reads (set up authentication later)
    }
  }
}
```

### 5. Local Development

You can run the website locally using any of these methods:

#### Method 1: Using Python (if installed)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Method 2: Using Node.js (if installed)
```bash
# Install a simple HTTP server
npm install -g http-server

# Run the server
http-server
```

#### Method 3: Using Live Server (VS Code Extension)
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### 6. Deployment

#### Option 1: Netlify (Recommended)
1. Push your code to a GitHub repository
2. Go to [Netlify](https://netlify.com/)
3. Click "New site from Git"
4. Connect your GitHub account
5. Select your repository
6. Deploy!

#### Option 2: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

#### Option 3: GitHub Pages
1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (usually `main`)
4. Save and wait for deployment

## Customization

### Colors
The website uses CSS custom properties for easy color customization. Edit the `:root` section in `styles.css`:

```css
:root {
    --primary-color: #ffc107;    /* Yellow/Gold */
    --secondary-color: #1e3a8a;  /* Dark Blue */
    --dark-color: #1f2937;       /* Dark Gray */
    --light-color: #f8f9fa;      /* Light Gray */
    --text-color: #333;          /* Text Color */
    --white: #ffffff;            /* White */
}
```

### Content
- Update hotel information in `index.html`
- Replace images with actual hotel photos
- Modify contact information
- Update social media links

### Features
- Add more sections as needed (Rooms, Menu, etc.)
- Implement booking functionality
- Add image gallery with lightbox
- Integrate with payment gateways

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips

1. **Optimize Images**: Use WebP format and appropriate sizes
2. **Minimize HTTP Requests**: Combine CSS/JS files for production
3. **Enable Compression**: Use gzip compression on your server
4. **Use CDN**: Serve Bootstrap and other libraries from CDN
5. **Lazy Loading**: Images are already set up for lazy loading

## Security Considerations

1. **Firebase Rules**: Set up proper Firestore security rules
2. **Input Validation**: Always validate form inputs
3. **HTTPS**: Use HTTPS in production
4. **API Keys**: Never expose sensitive API keys in client-side code

## Troubleshooting

### Common Issues

1. **Firebase not working**: Check your configuration and internet connection
2. **Images not loading**: Verify image URLs and check CORS settings
3. **Styling issues**: Clear browser cache and check CSS file path
4. **Form not submitting**: Check browser console for JavaScript errors

### Debug Mode

Add this to your `script.js` for debugging:

```javascript
// Enable debug mode
const DEBUG = true;

if (DEBUG) {
    console.log('Abruzzo Grand Hotel Website loaded');
    // Add more debug logs as needed
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact:
- Email: info@abruzzograndhotel.com
- Phone: 09043965470 / 09083578201

## Changelog

### Version 1.0.0
- Initial release
- Responsive design
- Firebase integration
- Contact form functionality
- Modern UI/UX design 