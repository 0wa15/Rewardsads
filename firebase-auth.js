// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForDemoPurposes",
  authDomain: "adrewards-demo.firebaseapp.com",
  projectId: "adrewards-demo",
  storageBucket: "adrewards-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// User authentication state
let currentUser = null;

// Check authentication state on page load
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    updateUIForLoggedInUser(user);
    fetchUserData(user.uid);
  } else {
    currentUser = null;
    updateUIForLoggedOutUser();
  }
});

// Fetch user data from Firestore
function fetchUserData(userId) {
  db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        updateUserPointsDisplay(userData.points || 0);
      } else {
        // Create new user document if it doesn't exist
        createNewUserDocument(userId);
      }
    })
    .catch(error => {
      console.error("Error fetching user data:", error);
    });
}

// Create new user document in Firestore
function createNewUserDocument(userId) {
  const user = auth.currentUser;
  
  db.collection('users').doc(userId).set({
    email: user.email,
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    points: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    console.log("New user document created");
    updateUserPointsDisplay(0);
  })
  .catch(error => {
    console.error("Error creating user document:", error);
  });
}

// Update user points in real-time
function updateUserPointsDisplay(points) {
  const pointsDisplayElements = document.querySelectorAll('.points-display');
  pointsDisplayElements.forEach(element => {
    element.textContent = `${points} points`;
  });
}

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
  // Hide login buttons, show user info
  document.querySelectorAll('.login-button').forEach(btn => btn.classList.add('hidden'));
  document.querySelectorAll('.user-info').forEach(info => info.classList.remove('hidden'));
  
  // Update user name display if available
  const userNameElements = document.querySelectorAll('.user-name');
  userNameElements.forEach(element => {
    element.textContent = user.displayName || user.email || 'User';
  });
  
  // Show user profile image if available
  const userImageElements = document.querySelectorAll('.user-image');
  userImageElements.forEach(element => {
    if (user.photoURL) {
      element.src = user.photoURL;
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  });
  
  // Enable reward redemption buttons
  document.querySelectorAll('.redeem-button').forEach(btn => {
    btn.disabled = false;
  });
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
  // Show login buttons, hide user info
  document.querySelectorAll('.login-button').forEach(btn => btn.classList.remove('hidden'));
  document.querySelectorAll('.user-info').forEach(info => info.classList.add('hidden'));
  
  // Disable reward redemption buttons
  document.querySelectorAll('.redeem-button').forEach(btn => {
    btn.disabled = true;
  });
}

// Sign in with email and password
function signInWithEmail(email, password) {
  return auth.signInWithEmailAndPassword(email, password)
    .then(result => {
      console.log("User signed in successfully");
      return result.user;
    })
    .catch(error => {
      console.error("Error signing in:", error);
      throw error;
    });
}

// Sign up with email and password
function signUpWithEmail(email, password, displayName) {
  return auth.createUserWithEmailAndPassword(email, password)
    .then(result => {
      // Update user profile with display name
      return result.user.updateProfile({
        displayName: displayName
      }).then(() => {
        console.log("User created successfully");
        return result.user;
      });
    })
    .catch(error => {
      console.error("Error creating user:", error);
      throw error;
    });
}

// Sign in with Google
function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  return auth.signInWithPopup(provider)
    .then(result => {
      console.log("Google sign in successful");
      return result.user;
    })
    .catch(error => {
      console.error("Error signing in with Google:", error);
      throw error;
    });
}

// Sign out current user
function signOut() {
  return auth.signOut()
    .then(() => {
      console.log("User signed out successfully");
    })
    .catch(error => {
      console.error("Error signing out:", error);
      throw error;
    });
}

// Get current user
function getCurrentUser() {
  return currentUser;
}

// Check if user is logged in
function isUserLoggedIn() {
  return currentUser !== null;
}

// Export authentication functions
window.userAuth = {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  isUserLoggedIn
};
