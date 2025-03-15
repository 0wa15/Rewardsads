// Main application functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI components
  initializeUI();
  
  // Add event listeners for reward cards
  setupRewardCards();
});

// Initialize UI components
function initializeUI() {
  // Animate elements on scroll
  const sections = document.querySelectorAll('section');
  
  window.addEventListener('scroll', () => {
    sections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (sectionTop < windowHeight * 0.75) {
        section.classList.add('visible');
      }
    });
  });
  
  // Mobile menu toggle (for responsive design)
  const mobileMenuBtn = document.createElement('button');
  mobileMenuBtn.classList.add('mobile-menu-btn');
  mobileMenuBtn.innerHTML = '<span></span><span></span><span></span>';
  
  const nav = document.querySelector('nav');
  const header = document.querySelector('header .container');
  
  if (window.innerWidth < 768) {
    header.insertBefore(mobileMenuBtn, nav);
    nav.classList.add('mobile-hidden');
    
    mobileMenuBtn.addEventListener('click', () => {
      nav.classList.toggle('mobile-hidden');
      mobileMenuBtn.classList.toggle('active');
    });
  }
  
  // Window resize handler
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      if (!document.querySelector('.mobile-menu-btn')) {
        header.insertBefore(mobileMenuBtn, nav);
        nav.classList.add('mobile-hidden');
      }
    } else {
      if (document.querySelector('.mobile-menu-btn')) {
        document.querySelector('.mobile-menu-btn').remove();
        nav.classList.remove('mobile-hidden');
      }
    }
  });
}

// Setup reward card interactions
function setupRewardCards() {
  const rewardCards = document.querySelectorAll('.reward-card');
  
  rewardCards.forEach(card => {
    const redeemBtn = card.querySelector('.btn-secondary');
    
    redeemBtn.addEventListener('click', () => {
      // Check if user is logged in
      if (firebase.auth().currentUser) {
        const rewardName = card.querySelector('h3').textContent;
        const pointsRequired = parseInt(card.querySelector('p').textContent);
        
        // Get user's current points
        firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).get()
          .then(doc => {
            if (doc.exists) {
              const userPoints = doc.data().points || 0;
              
              if (userPoints >= pointsRequired) {
                // Show confirmation modal
                showRedemptionConfirmation(rewardName, pointsRequired);
              } else {
                alert(`You need ${pointsRequired - userPoints} more points to redeem this reward.`);
              }
            }
          })
          .catch(error => {
            console.error('Error getting user data:', error);
            alert('Could not verify your points. Please try again later.');
          });
      } else {
        // Show login modal if user is not logged in
        document.getElementById('loginModal').classList.remove('hidden');
      }
    });
  });
}

// Show redemption confirmation
function showRedemptionConfirmation(rewardName, pointsRequired) {
  // Create modal element
  const modal = document.createElement('div');
  modal.classList.add('modal');
  
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Confirm Redemption</h2>
      <p>Are you sure you want to redeem <strong>${rewardName}</strong> for <strong>${pointsRequired} points</strong>?</p>
      <div class="modal-actions">
        <button class="btn btn-outline cancel-btn">Cancel</button>
        <button class="btn btn-primary confirm-btn">Confirm Redemption</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.classList.remove('hidden');
  
  // Add event listeners
  const closeBtn = modal.querySelector('.close');
  const cancelBtn = modal.querySelector('.cancel-btn');
  const confirmBtn = modal.querySelector('.confirm-btn');
  
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });
  
  cancelBtn.addEventListener('click', () => {
    modal.remove();
  });
  
  confirmBtn.addEventListener('click', () => {
    // Process redemption
    processRedemption(rewardName, pointsRequired);
    modal.remove();
  });
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Process reward redemption
function processRedemption(rewardName, pointsRequired) {
  const user = firebase.auth().currentUser;
  
  if (!user) {
    alert('You must be logged in to redeem rewards.');
    return;
  }
  
  const userRef = firebase.firestore().collection('users').doc(user.uid);
  
  // Use a transaction to ensure points are updated correctly
  firebase.firestore().runTransaction((transaction) => {
    return transaction.get(userRef).then((userDoc) => {
      if (!userDoc.exists) {
        throw "User document does not exist!";
      }
      
      const userData = userDoc.data();
      const currentPoints = userData.points || 0;
      
      if (currentPoints < pointsRequired) {
        throw "Not enough points!";
      }
      
      // Update user points
      transaction.update(userRef, { points: currentPoints - pointsRequired });
      
      // Add redemption record
      const redemptionRef = firebase.firestore().collection('redemptions').doc();
      transaction.set(redemptionRef, {
        userId: user.uid,
        rewardName: rewardName,
        pointsSpent: pointsRequired,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
  })
  .then(() => {
    // Update points display
    userRef.get().then(doc => {
      if (doc.exists) {
        const updatedPoints = doc.data().points;
        document.getElementById('pointsDisplay').textContent = `${updatedPoints} points`;
      }
    });
    
    // Show success message
    showSuccessMessage(rewardName);
  })
  .catch((error) => {
    console.error("Transaction failed: ", error);
    alert(`Redemption failed: ${error}`);
  });
}

// Show success message after redemption
function showSuccessMessage(rewardName) {
  // Create success message element
  const successMessage = document.createElement('div');
  successMessage.classList.add('success-message');
  
  successMessage.innerHTML = `
    <div class="success-content">
      <div class="success-icon">✓</div>
      <h3>Redemption Successful!</h3>
      <p>You have successfully redeemed <strong>${rewardName}</strong>.</p>
      <p>Your reward will be processed within 24 hours.</p>
      <p>Check your email for further instructions.</p>
      <button class="btn btn-primary close-btn">OK</button>
    </div>
  `;
  
  document.body.appendChild(successMessage);
  
  // Add event listener to close button
  const closeBtn = successMessage.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    successMessage.remove();
  });
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(successMessage)) {
      successMessage.remove();
    }
  }, 5000);
}

// Placeholder for ad watching functionality
// This will be implemented in more detail in the ad-watching page
function watchAd() {
  // In a real implementation, this would integrate with an ad network
  console.log('Ad watching functionality will be implemented in the ad-watching page');
}
