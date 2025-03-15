// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "adrewards-app.firebaseapp.com",
  projectId: "adrewards-app",
  storageBucket: "adrewards-app.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const pointsDisplay = document.getElementById('pointsDisplay');
const getStartedBtn = document.getElementById('getStartedBtn');
const joinNowBtn = document.getElementById('joinNowBtn');

// Modal Elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const closeBtns = document.querySelectorAll('.close');
const signupLink = document.getElementById('signupLink');
const loginLink = document.getElementById('loginLink');

// Login Form Elements
const emailLoginForm = document.getElementById('emailLoginForm');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const discordLoginBtn = document.getElementById('discordLoginBtn');

// Signup Form Elements
const emailSignupForm = document.getElementById('emailSignupForm');
const googleSignupBtn = document.getElementById('googleSignupBtn');
const discordSignupBtn = document.getElementById('discordSignupBtn');

// Event Listeners
loginBtn.addEventListener('click', () => {
  loginModal.classList.remove('hidden');
});

getStartedBtn.addEventListener('click', () => {
  if (auth.currentUser) {
    window.location.href = 'pages/watch-ads.html';
  } else {
    loginModal.classList.remove('hidden');
  }
});

joinNowBtn.addEventListener('click', () => {
  if (auth.currentUser) {
    window.location.href = 'pages/watch-ads.html';
  } else {
    signupModal.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      console.log('User signed out');
    })
    .catch((error) => {
      console.error('Error signing out:', error);
    });
});

closeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    signupModal.classList.add('hidden');
  });
});

signupLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginModal.classList.add('hidden');
  signupModal.classList.remove('hidden');
});

loginLink.addEventListener('click', (e) => {
  e.preventDefault();
  signupModal.classList.add('hidden');
  loginModal.classList.remove('hidden');
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === loginModal) {
    loginModal.classList.add('hidden');
  }
  if (e.target === signupModal) {
    signupModal.classList.add('hidden');
  }
});

// Auth state observer
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    loginBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    
    // Get user points from Firestore
    db.collection('users').doc(user.uid).get()
      .then((doc) => {
        if (doc.exists) {
          const points = doc.data().points || 0;
          pointsDisplay.textContent = `${points} points`;
        } else {
          // Create new user document if it doesn't exist
          db.collection('users').doc(user.uid).set({
            email: user.email,
            name: user.displayName || 'User',
            points: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          pointsDisplay.textContent = '0 points';
        }
      })
      .catch((error) => {
        console.error('Error getting user data:', error);
        pointsDisplay.textContent = '0 points';
      });
  } else {
    // User is signed out
    loginBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
  }
});

// Handle login with email/password
emailLoginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Close modal after successful login
      loginModal.classList.add('hidden');
      emailLoginForm.reset();
    })
    .catch((error) => {
      console.error('Error signing in:', error);
      alert(`Login failed: ${error.message}`);
    });
});

// Handle signup with email/password
emailSignupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const termsAgree = document.getElementById('termsAgree').checked;
  
  if (!termsAgree) {
    alert('You must agree to the Terms & Conditions and Privacy Policy');
    return;
  }
  
  if (password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }
  
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Add user to Firestore
      const user = userCredential.user;
      return db.collection('users').doc(user.uid).set({
        email: email,
        name: name,
        points: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    })
    .then(() => {
      // Close modal after successful signup
      signupModal.classList.add('hidden');
      emailSignupForm.reset();
    })
    .catch((error) => {
      console.error('Error signing up:', error);
      alert(`Signup failed: ${error.message}`);
    });
});

// Google Sign In
googleLoginBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => {
      loginModal.classList.add('hidden');
    })
    .catch((error) => {
      console.error('Error signing in with Google:', error);
      alert(`Google login failed: ${error.message}`);
    });
});

googleSignupBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => {
      signupModal.classList.add('hidden');
    })
    .catch((error) => {
      console.error('Error signing up with Google:', error);
      alert(`Google signup failed: ${error.message}`);
    });
});

// Discord Sign In (Note: This would require additional setup with Discord OAuth)
discordLoginBtn.addEventListener('click', () => {
  alert('Discord login is not implemented in this demo. Please use Google or Email login.');
});

discordSignupBtn.addEventListener('click', () => {
  alert('Discord signup is not implemented in this demo. Please use Google or Email signup.');
});
