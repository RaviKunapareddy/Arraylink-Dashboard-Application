import { useState } from 'react';
import styles from '../styles/ProspectTable.module.css';
import OutreachPopup from './OutreachPopup';

const ProspectTable = ({ prospects, onOutreach, userPhoneNumber }) => {
  const [popupState, setPopupState] = useState({
    isOpen: false,
    prospectId: null,
    hotelName: '',
    managerName: '',
    lastProduct: '',
    recommendedProduct: '',
    phoneNumber: '' // Added for calling functionality
  });

  const handleOutreachClick = (prospect) => {
    // First check if we can proceed with outreach
    const canProceed = onOutreach(prospect.id);
    if (!canProceed) return;
    
    // Open the popup with all relevant data
    setPopupState({
      isOpen: true,
      prospectId: prospect.id,
      hotelName: prospect.hotelName,
      managerName: prospect.managerName,
      lastProduct: prospect.lastPurchasedProduct,
      recommendedProduct: prospect.recommendedProduct,
      phoneNumber: userPhoneNumber // Use the user's phone number
    });
  };

  const closePopup = () => {
    setPopupState({
      isOpen: false,
      prospectId: null,
      hotelName: '',
      managerName: '',
      lastProduct: '',
      recommendedProduct: '',
      phoneNumber: ''
    });
  };

  return (
    <>
      <div className={styles.tableContainer}>
        <table className={styles.prospectTable}>
          <thead>
            <tr>
              <th>Hotel Name</th>
              <th>Manager Name</th>
              <th>Last Purchased Product</th>
              <th>Recommended Product</th>
              <th>Last Purchased Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => (
              <tr key={prospect.id}>
                <td>{prospect.hotelName}</td>
                <td>{prospect.managerName}</td>
                <td>{prospect.lastPurchasedProduct}</td>
                <td>{prospect.recommendedProduct}</td>
                <td>{prospect.lastPurchasedDate}</td>
                <td>
                  <button 
                    className={styles.outreachButton} 
                    onClick={() => handleOutreachClick(prospect)}
                  >
                    Outreach
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <OutreachPopup 
        isOpen={popupState.isOpen}
        prospectId={popupState.prospectId}
        hotelName={popupState.hotelName}
        managerName={popupState.managerName}
        lastProduct={popupState.lastProduct}
        recommendedProduct={popupState.recommendedProduct}
        phoneNumber={popupState.phoneNumber}
        onClose={closePopup} 
      />
    </>
  );
};

export default ProspectTable; 