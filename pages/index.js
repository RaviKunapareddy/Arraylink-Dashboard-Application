import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import ProspectTable from '../components/ProspectTable';
import PhoneNumberInput from '../components/PhoneNumberInput';

export default function Home() {
  const [prospects, setProspects] = useState([
    {
      id: 1,
      hotelName: 'Grand Plaza',
      managerName: 'John Doe',
      phoneNumber: '+12345678901',
      lastPurchasedProduct: 'Asiago Cheese Bagel (Pack of 4)',
      recommendedProduct: 'Blueberry Bagel (Seasonal)',
      lastPurchasedDate: '2023-05-12'
    },
    {
      id: 2,
      hotelName: 'Sunrise Inn',
      managerName: 'Sarah Lee',
      phoneNumber: '+12345678902',
      lastPurchasedProduct: 'Vanilla Shower Gel (500ml)',
      recommendedProduct: 'Lavender Shower Gel (500ml)',
      lastPurchasedDate: '2023-05-13'
    },
    {
      id: 3,
      hotelName: 'Ocean Breeze',
      managerName: 'Michael Tan',
      phoneNumber: '+12345678903',
      lastPurchasedProduct: 'Greek Yogurt (500g)',
      recommendedProduct: 'Mango Greek Yogurt (Seasonal)',
      lastPurchasedDate: '2023-05-14'
    },
    {
      id: 4,
      hotelName: 'Seaside Suites',
      managerName: 'Emma Green',
      phoneNumber: '+12345678904',
      lastPurchasedProduct: 'Classic Croissant (Pack of 6)',
      recommendedProduct: 'Almond Croissant (Pack of 6)',
      lastPurchasedDate: '2023-05-10'
    },
    {
      id: 5,
      hotelName: 'City Comforts',
      managerName: 'David Wilson',
      phoneNumber: '+12345678905',
      lastPurchasedProduct: 'Strawberry Jam (250g)',
      recommendedProduct: 'Raspberry Jam (250g)',
      lastPurchasedDate: '2023-05-05'
    },
    {
      id: 6,
      hotelName: 'Mountain Lodge',
      managerName: 'Rachel Brown',
      phoneNumber: '+12345678906',
      lastPurchasedProduct: 'Plain Cream Cheese (200g)',
      recommendedProduct: 'Chive Cream Cheese (200g)',
      lastPurchasedDate: '2023-05-07'
    },
    {
      id: 7,
      hotelName: 'Royal Stay',
      managerName: 'Alex Johnson',
      phoneNumber: '+12345678907',
      lastPurchasedProduct: 'Colombian Coffee Beans (500g)',
      recommendedProduct: 'Ethiopian Coffee Beans (500g) (Specialty)',
      lastPurchasedDate: '2023-05-08'
    },
    {
      id: 8,
      hotelName: 'Sunshine Resort',
      managerName: 'Mia Thompson',
      phoneNumber: '+12345678908',
      lastPurchasedProduct: 'Citrus Shampoo (250ml)',
      recommendedProduct: 'Tea Tree Shampoo (250ml)',
      lastPurchasedDate: '2023-05-09'
    },
    {
      id: 9,
      hotelName: 'Cozy Nest',
      managerName: 'Oliver Parker',
      phoneNumber: '+12345678909',
      lastPurchasedProduct: 'Basic Toothpaste (100g)',
      recommendedProduct: 'Whitening Toothpaste (100g)',
      lastPurchasedDate: '2023-05-10'
    },
    {
      id: 10,
      hotelName: 'Green Valley',
      managerName: 'Lucas Miller',
      phoneNumber: '+12345678910',
      lastPurchasedProduct: 'Blueberry Muffin (Pack of 4)',
      recommendedProduct: 'Chocolate Chip Muffin (Pack of 4)',
      lastPurchasedDate: '2023-05-11'
    }
  ]);

  const [callStatus, setCallStatus] = useState({});
  const [showPhoneInput, setShowPhoneInput] = useState(true);
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  // Handle phone number submission
  const handlePhoneSubmit = (phoneNumber) => {
    setTestPhoneNumber(phoneNumber);
    setShowPhoneInput(false);
  };

  const handleOutreach = async (id) => {
    console.log(`Initiating outreach for prospect ID: ${id}`);
    
    const prospect = prospects.find(p => p.id === id);
    if (!prospect) return;
    
    try {
      // Use the test phone number instead of the prospect's phone number
      const response = await fetch('/api/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospectId: id,
          hotelName: prospect.hotelName,
          managerName: prospect.managerName,
          lastProduct: prospect.lastPurchasedProduct,
          recommendedProduct: prospect.recommendedProduct,
          phoneNumber: testPhoneNumber // Use the user's test phone number
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update call status for this prospect
        setCallStatus(prev => ({
          ...prev,
          [id]: {
            callSid: result.callSid,
            status: result.callStatus,
            timestamp: new Date().toISOString()
          }
        }));
      } else {
        console.error('Outreach call failed:', result.message);
      }
    } catch (error) {
      console.error('Error during outreach API call:', error);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>ArrayLink AI - Prospect Dashboard</title>
        <meta name="description" content="AI-powered sales automation tool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {showPhoneInput && (
        <PhoneNumberInput onSubmit={handlePhoneSubmit} />
      )}

      <main className={styles.main}>
        <h1 className={styles.title}>
          ArrayLink AI - Prospect Dashboard
        </h1>

        <p className={styles.description}>
          Manage your sales prospects and automate outreach
        </p>

        {testPhoneNumber && (
          <div className={styles.phoneInfo}>
            <p>Test calls will be made to: <strong>{testPhoneNumber}</strong></p>
            <button 
              onClick={() => setShowPhoneInput(true)} 
              className={styles.changeButton}
            >
              Change Phone Number
            </button>
          </div>
        )}

        <ProspectTable 
          prospects={prospects} 
          onOutreach={handleOutreach}
          callStatus={callStatus}
          testPhoneNumber={testPhoneNumber}
        />
      </main>

      <footer className={styles.footer}>
        <p>© 2023 ArrayLink AI - AI-powered sales automation</p>
      </footer>
    </div>
  );
} 