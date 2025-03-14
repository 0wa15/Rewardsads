// Points system and ad management functionality
const pointsSystem = {
  // Points configuration
  pointsPerAd: {
    min: 5,
    max: 15
  },
  dailyBonusPoints: 20,
  referralPoints: 50,
  profileCompletionPoints: 25,
  
  // Generate random points for watching an ad
  generateAdPoints() {
    return Math.floor(Math.random() * 
      (this.pointsPerAd.max - this.pointsPerAd.min + 1)) + this.pointsPerAd.min;
  },
  
  // Award points to user
  awardPoints(userId, amount, reason) {
    if (!userId || amount <= 0) {
      console.error("Invalid user ID or points amount");
      return Promise.reject("Invalid user ID or points amount");
    }
    
    const db = firebase.firestore();
    const userRef = db.collection('users').doc(userId);
    
    // Update user's total points
    return db.runTransaction(transaction => {
      return transaction.get(userRef).then(userDoc => {
        if (!userDoc.exists) {
          throw "User document does not exist";
        }
        
        const currentPoints = userDoc.data().points || 0;
        transaction.update(userRef, { 
          points: currentPoints + amount 
        });
        
        // Add points transaction record
        const transactionRef = db.collection('users').doc(userId)
          .collection('pointsHistory').doc();
        
        transaction.set(transactionRef, {
          amount: amount,
          reason: reason,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          balance: currentPoints + amount
        });
        
        return currentPoints + amount;
      });
    });
  },
  
  // Get user's current points
  getUserPoints(userId) {
    if (!userId) {
      console.error("Invalid user ID");
      return Promise.reject("Invalid user ID");
    }
    
    return firebase.firestore().collection('users').doc(userId).get()
      .then(doc => {
        if (doc.exists) {
          return doc.data().points || 0;
        } else {
          throw "User document does not exist";
        }
      });
  },
  
  // Get user's points history
  getPointsHistory(userId, limit = 10) {
    if (!userId) {
      console.error("Invalid user ID");
      return Promise.reject("Invalid user ID");
    }
    
    return firebase.firestore().collection('users').doc(userId)
      .collection('pointsHistory')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get()
      .then(snapshot => {
        const history = [];
        snapshot.forEach(doc => {
          history.push({
            id: doc.id,
            ...doc.data()
          });
        });
        return history;
      });
  },
  
  // Check if user has enough points for a reward
  canRedeemReward(userId, pointsRequired) {
    return this.getUserPoints(userId)
      .then(points => {
        return points >= pointsRequired;
      });
  },
  
  // Deduct points for reward redemption
  deductPointsForReward(userId, pointsRequired, rewardName) {
    if (!userId || pointsRequired <= 0) {
      console.error("Invalid user ID or points amount");
      return Promise.reject("Invalid user ID or points amount");
    }
    
    const db = firebase.firestore();
    const userRef = db.collection('users').doc(userId);
    
    return db.runTransaction(transaction => {
      return transaction.get(userRef).then(userDoc => {
        if (!userDoc.exists) {
          throw "User document does not exist";
        }
        
        const currentPoints = userDoc.data().points || 0;
        
        if (currentPoints < pointsRequired) {
          throw "Not enough points";
        }
        
        transaction.update(userRef, { 
          points: currentPoints - pointsRequired 
        });
        
        // Add points transaction record
        const transactionRef = db.collection('users').doc(userId)
          .collection('pointsHistory').doc();
        
        transaction.set(transactionRef, {
          amount: -pointsRequired,
          reason: `Redeemed ${rewardName}`,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          balance: currentPoints - pointsRequired
        });
        
        // Add redemption record
        const redemptionRef = db.collection('users').doc(userId)
          .collection('redemptions').doc();
        
        transaction.set(redemptionRef, {
          rewardName: rewardName,
          pointsSpent: pointsRequired,
          status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return currentPoints - pointsRequired;
      });
    });
  },
  
  // Get daily stats
  getDailyStats(userId) {
    if (!userId) {
      console.error("Invalid user ID");
      return Promise.reject("Invalid user ID");
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    return firebase.firestore().collection('users').doc(userId)
      .collection('adStats').doc(today).get()
      .then(doc => {
        if (doc.exists) {
          return doc.data();
        } else {
          return {
            points: 0,
            adsWatched: 0,
            date: today
          };
        }
      });
  },
  
  // Update daily stats
  updateDailyStats(userId, pointsEarned) {
    if (!userId) {
      console.error("Invalid user ID");
      return Promise.reject("Invalid user ID");
    }
    
    const today = new Date().toISOString().split('T')[0];
    const statsRef = firebase.firestore().collection('users').doc(userId)
      .collection('adStats').doc(today);
    
    return statsRef.set({
      points: firebase.firestore.FieldValue.increment(pointsEarned),
      adsWatched: firebase.firestore.FieldValue.increment(1),
      date: today
    }, { merge: true });
  },
  
  // Check and award daily login bonus
  checkAndAwardDailyBonus(userId) {
    if (!userId) {
      console.error("Invalid user ID");
      return Promise.reject("Invalid user ID");
    }
    
    const db = firebase.firestore();
    const userRef = db.collection('users').doc(userId);
    
    return userRef.get().then(doc => {
      if (!doc.exists) {
        throw "User document does not exist";
      }
      
      const userData = doc.data();
      const lastLoginDate = userData.lastLoginDate ? 
        new Date(userData.lastLoginDate.toDate()) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if last login was before today
      if (!lastLoginDate || lastLoginDate < today) {
        // Award daily bonus
        return this.awardPoints(userId, this.dailyBonusPoints, "Daily login bonus")
          .then(newPoints => {
            // Update last login date
            return userRef.update({
              lastLoginDate: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
              return {
                awarded: true,
                bonusAmount: this.dailyBonusPoints,
                newTotal: newPoints
              };
            });
          });
      } else {
        // Already claimed today
        return {
          awarded: false,
          message: "Daily bonus already claimed today"
        };
      }
    });
  }
};

// Ad management functionality
const adManager = {
  // Ad types
  adTypes: ['video', 'banner', 'interactive'],
  
  // Simulated ad content
  sampleAds: {
    video: [
      {
        title: "Summer Vacation Deals",
        description: "Find the best vacation packages for your summer getaway!",
        duration: 15
      },
      {
        title: "New Smartphone Release",
        description: "Check out the latest features of our new smartphone model.",
        duration: 20
      },
      {
        title: "Healthy Meal Delivery",
        description: "Fresh, healthy meals delivered to your door every week.",
        duration: 10
      }
    ],
    banner: [
      {
        title: "Online Shopping Sale",
        description: "Up to 50% off on all products. Limited time offer!",
        duration: 5
      },
      {
        title: "Fitness App Subscription",
        description: "Get fit with our personalized workout plans.",
        duration: 5
      },
      {
        title: "Music Streaming Service",
        description: "Millions of songs at your fingertips. Try free for 30 days.",
        duration: 5
      }
    ],
    interactive: [
      {
        title: "Mobile Game Promotion",
        description: "Play our new adventure game and win real prizes!",
        duration: 25
      },
      {
        title: "Survey: Consumer Preferences",
        description: "Share your opinion and help shape future products.",
        duration: 30
      },
      {
        title: "Interactive Product Demo",
        description: "Try our virtual product demo and see how it works.",
        duration: 20
      }
    ]
  },
  
  // Get a random ad
  getRandomAd() {
    // Select random ad type
    const adType = this.adTypes[Math.floor(Math.random() * this.adTypes.length)];
    
    // Select random ad from that type
    const ads = this.sampleAds[adType];
    const ad = ads[Math.floor(Math.random() * ads.length)];
    
    return {
      type: adType,
      ...ad
    };
  },
  
  // Simulate ad display
  displayAd(adContainer, ad) {
    let adContent = '';
    
    switch(ad.type) {
      case 'video':
        adContent = `
          <div class="ad-content video-ad">
            <div class="ad-header">
              <span class="ad-type">Video Ad</span>
              <span class="ad-duration">${ad.duration} seconds</span>
            </div>
            <div class="ad-media">
              <div class="video-placeholder">
                <div class="play-button">▶</div>
              </div>
            </div>
            <div class="ad-info">
              <h3>${ad.title}</h3>
              <p>${ad.description}</p>
            </div>
          </div>
        `;
        break;
        
      case 'banner':
        adContent = `
          <div class="ad-content banner-ad">
            <div class="ad-header">
              <span class="ad-type">Banner Ad</span>
              <span class="ad-duration">${ad.duration} seconds</span>
            </div>
            <div class="ad-media banner-placeholder">
              <h3>${ad.title}</h3>
              <p>${ad.description}</p>
            </div>
          </div>
        `;
        break;
        
      case 'interactive':
        adContent = `
          <div class="ad-content interactive-ad">
            <div class="ad-header">
              <span class="ad-type">Interactive Ad</span>
              <span class="ad-duration">${ad.duration} seconds</span>
            </div>
            <div class="ad-media">
              <div class="interactive-placeholder">
                <h3>${ad.title}</h3>
                <p>${ad.description}</p>
                <button class="interact-btn">Interact with Ad</button>
              </div>
            </div>
          </div>
        `;
        break;
    }
    
    adContainer.innerHTML = adContent;
    
    // Add interaction for interactive ads
    if (ad.type === 'interactive') {
      const interactBtn = adContainer.querySelector('.interact-btn');
      if (interactBtn) {
        interactBtn.addEventListener('click', () => {
          interactBtn.textContent = 'Thanks for interacting!';
          interactBtn.disabled = true;
        });
      }
    }
    
    return ad.duration;
  },
  
  // Record ad view
  recordAdView(userId, adType) {
    if (!userId) {
      console.error("Invalid user ID");
      return Promise.reject("Invalid user ID");
    }
    
    return firebase.firestore().collection('users').doc(userId)
      .collection('adHistory').add({
        adType: adType,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
  }
};

// Export modules
window.pointsSystem = pointsSystem;
window.adManager = adManager;
