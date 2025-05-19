import { useState } from 'react';
import styles from '../styles/ProspectTable.module.css';
import OutreachPopup from './OutreachPopup';

const ProspectTable = ({ prospects, onOutreach, callStatus, testPhoneNumber }) => {
  const [popupState, setPopupState] = useState({
    isOpen: false,
    hotelName: '',
    managerName: '',
    lastProduct: '',
    recommendedProduct: '',
    phoneNumber: ''
  });

  const handleOutreachClick = (prospect) => {
    // Open the popup with all relevant data, but use test phone number
    setPopupState({
      isOpen: true,
      hotelName: prospect.hotelName,
      managerName: prospect.managerName,
      lastProduct: prospect.lastPurchasedProduct,
      recommendedProduct: prospect.recommendedProduct,
      phoneNumber: testPhoneNumber // Use the test phone number
    });
    
    // Call the parent handler
    onOutreach(prospect.id);
  };

  const closePopup = () => {
    setPopupState({
      isOpen: false,
      hotelName: '',
      managerName: '',
      lastProduct: '',
      recommendedProduct: '',
      phoneNumber: ''
    });
  };

  // Helper to get call status label
  const getStatusLabel = (status) => {
    switch(status) {
      case 'queued':
        return 'Queued';
      case 'ringing':
        return 'Ringing';
      case 'in-progress':
        return 'In Call';
      case 'completed':
        return 'Completed';
      case 'busy':
        return 'Busy';
      case 'failed':
        return 'Failed';
      case 'no-answer':
        return 'No Answer';
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
    }
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
              <th>Call Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect) => {
              const status = callStatus[prospect.id];
              return (
                <tr key={prospect.id}>
                  <td>{prospect.hotelName}</td>
                  <td>{prospect.managerName}</td>
                  <td>{prospect.lastPurchasedProduct}</td>
                  <td>{prospect.recommendedProduct}</td>
                  <td>{prospect.lastPurchasedDate}</td>
                  <td>
                    {status ? (
                      <span className={`${styles.callStatus} ${styles[status.status]}`}>
                        {getStatusLabel(status.status)}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <button 
                      className={styles.outreachButton} 
                      onClick={() => handleOutreachClick(prospect)}
                      disabled={!testPhoneNumber || (status && ['queued', 'ringing', 'in-progress'].includes(status.status))}
                    >
                      Outreach
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <OutreachPopup 
        isOpen={popupState.isOpen} 
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