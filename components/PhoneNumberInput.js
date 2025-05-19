import { useState } from 'react';
import styles from '../styles/PhoneNumberInput.module.css';

const PhoneNumberInput = ({ onSubmit }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simple validation for phone number
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }
    
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number (e.g., +12345678900)');
      return;
    }
    
    // Format phone number if needed
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedPhone = `+${phoneNumber}`;
    }
    
    onSubmit(formattedPhone);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h2 className={styles.title}>Welcome to ArrayLink AI Dashboard</h2>
          
          <p className={styles.description}>
            Enter your phone number to test the outreach functionality. 
            This will be used when clicking the "Outreach" button.
          </p>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="phoneNumber" className={styles.label}>
                Your Phone Number (include country code):
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+12345678900"
                className={styles.input}
                autoFocus
              />
              {error && <p className={styles.error}>{error}</p>}
            </div>
            
            <button type="submit" className={styles.button}>
              Start Dashboard
            </button>
          </form>
          
          <p className={styles.disclaimer}>
            You'll receive test calls at this number when using the outreach feature.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneNumberInput; 