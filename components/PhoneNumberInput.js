import { useState } from 'react';
import styles from '../styles/PhoneNumberInput.module.css';

const PhoneNumberInput = ({ onPhoneSubmit, isPhoneSubmitted }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const validatePhoneNumber = (number) => {
    // Basic validation - can be enhanced with more sophisticated validation
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(number);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      setIsValid(false);
      setErrorMessage('Phone number is required');
      return;
    }
    
    if (!validatePhoneNumber(phoneNumber)) {
      setIsValid(false);
      setErrorMessage('Please enter a valid phone number (e.g., +15551234567)');
      return;
    }
    
    setIsValid(true);
    setErrorMessage('');
    onPhoneSubmit(phoneNumber);
  };

  if (isPhoneSubmitted) {
    return (
      <div className={styles.phoneSubmitted}>
        <p>Your phone number has been submitted: <strong>{phoneNumber}</strong></p>
        <button 
          className={styles.changeButton}
          onClick={() => onPhoneSubmit(null)}
        >
          Change Number
        </button>
      </div>
    );
  }

  return (
    <div className={styles.phoneInputContainer}>
      <h2>Enter Your Phone Number</h2>
      <p>We need your phone number to demonstrate the outbound calling feature.</p>
      
      <form onSubmit={handleSubmit} className={styles.phoneForm}>
        <div className={styles.inputGroup}>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+15551234567"
            className={`${styles.phoneInput} ${!isValid ? styles.invalid : ''}`}
          />
          {!isValid && <p className={styles.errorMessage}>{errorMessage}</p>}
          <p className={styles.helpText}>Please include country code (e.g., +1 for US)</p>
        </div>
        
        <button type="submit" className={styles.submitButton}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default PhoneNumberInput;
