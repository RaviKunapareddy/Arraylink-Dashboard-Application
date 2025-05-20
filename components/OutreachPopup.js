import { useState, useEffect } from 'react';
import styles from '../styles/OutreachPopup.module.css';

const OutreachPopup = ({ isOpen, prospectId, hotelName, managerName, lastProduct, recommendedProduct, phoneNumber, onClose }) => {
  const [stage, setStage] = useState(0);
  const [visible, setVisible] = useState(false);
  
  // Function to initiate the actual call via API
  const initiateCall = async () => {
    try {
      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectId,
          phoneNumber,
          managerName,
          hotelName,
          recommendedProduct,
          lastProduct
        }),
      });
      
      const data = await response.json();
      console.log('Call initiated:', data);
      // We could handle the response here if needed
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setStage(0);
      
      // Sequence through the stages
      const timer1 = setTimeout(() => setStage(1), 2000); // Email sent
      const timer2 = setTimeout(() => setStage(2), 4000); // Email opened
      const timer3 = setTimeout(() => {
        setStage(3); // Calling customer
        initiateCall(); // Actually make the API call here
      }, 6000);
      const timer4 = setTimeout(() => onClose(), 10000); // Close popup (extended time to allow reading)
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } else {
      setVisible(false);
    }
  }, [isOpen, onClose, prospectId, phoneNumber, managerName, hotelName, recommendedProduct]);
  
  if (!visible) return null;
  
  return (
    <div className={styles.popupOverlay}>
      <div className={`${styles.popup} ${styles.fadeIn}`}>
        <div className={styles.popupContent}>
          <h3 className={styles.popupTitle}>Outreach to {hotelName}</h3>
          
          {/* Stage 0 - Composing Email */}
          {stage === 0 && (
            <div className={`${styles.messageBox} ${styles.slideIn}`}>
              <div className={styles.emailPreview}>
                <div className={styles.emailHeader}>
                  <div>To: {managerName}</div>
                  <div>Subject: Special Product Recommendation for {hotelName}</div>
                </div>
                <div className={styles.emailBody}>
                  <p>Hey {managerName},</p>
                  <p>We noticed you last ordered <strong>{lastProduct}</strong> and wanted to recommend our <strong>{recommendedProduct}</strong>.</p>
                  <p>Would you be interested in trying this new product? We can offer a special discount for your next order.</p>
                  <p>Best regards,<br/>ArrayLink AI Team</p>
                </div>
              </div>
              <div className={styles.loadingBar}>
                <div className={styles.loadingBarFill}></div>
              </div>
              <p>Composing personalized email...</p>
            </div>
          )}
          
          {/* Stage 1 - Email Sent */}
          {stage === 1 && (
            <div className={`${styles.messageBox} ${styles.slideIn}`}>
              <span className={styles.icon}>📧</span>
              <p>Outreach email sent to {managerName}!</p>
              <div className={styles.emailSummary}>
                <p>Recommended: <strong>{recommendedProduct}</strong></p>
                <p>Based on previous purchase: <strong>{lastProduct}</strong></p>
              </div>
            </div>
          )}
          
          {/* Stage 2 - Email Opened */}
          {stage === 2 && (
            <div className={`${styles.messageBox} ${styles.slideIn}`}>
              <span className={styles.icon}>🎉</span>
              <p>Eureka! {managerName} opened the email!</p>
              <div className={styles.statistic}>
                <span className={styles.statLabel}>Open time:</span> 
                <span className={styles.statValue}>Just now</span>
              </div>
            </div>
          )}
          
          {/* Stage 3 - Calling Customer */}
          {stage === 3 && (
            <div className={`${styles.messageBox} ${styles.slideIn}`}>
              <span className={styles.icon}>📞</span>
              <p>Calling {managerName} now...</p>
              <div className={styles.callScript}>
                <p>AI will discuss: <strong>{recommendedProduct}</strong></p>
              </div>
              <div className={styles.liveIndicator}>
                <span className={styles.dot}></span> LIVE
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutreachPopup; 