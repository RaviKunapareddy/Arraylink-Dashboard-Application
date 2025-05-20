import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import ProspectTable from '../components/ProspectTable';
import PhoneNumberInput from '../components/PhoneNumberInput';

export default function Home() {
  const [userPhoneNumber, setUserPhoneNumber] = useState(null);
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  
  // Check if phone number is stored in localStorage on component mount
  useEffect(() => {
    const storedPhone = localStorage.getItem('userPhoneNumber');
    if (storedPhone) {
      setUserPhoneNumber(storedPhone);
      setIsPhoneSubmitted(true);
    }
  }, []);
  
  const handlePhoneSubmit = (phoneNumber) => {
    if (phoneNumber) {
      setUserPhoneNumber(phoneNumber);
      setIsPhoneSubmitted(true);
      localStorage.setItem('userPhoneNumber', phoneNumber);
    } else {
      setUserPhoneNumber(null);
      setIsPhoneSubmitted(false);
      localStorage.removeItem('userPhoneNumber');
    }
  };
  const [prospects, setProspects] = useState([
    {
      id: 1,
      hotelName: 'Grand Plaza',
      managerName: 'John Doe',
      lastPurchasedProduct: 'Asiago Cheese Bagel (Pack of 4)',
      recommendedProduct: 'Blueberry Bagel (Seasonal)',
      lastPurchasedDate: '2023-05-12',
      phoneNumber: '+15551234001'
    },
    {
      id: 2,
      hotelName: 'Sunrise Inn',
      managerName: 'Sarah Lee',
      lastPurchasedProduct: 'Vanilla Shower Gel (500ml)',
      recommendedProduct: 'Lavender Shower Gel (500ml)',
      lastPurchasedDate: '2023-05-13',
      phoneNumber: '+15551234002'
    },
    {
      id: 3,
      hotelName: 'Ocean Breeze',
      managerName: 'Michael Tan',
      lastPurchasedProduct: 'Greek Yogurt (500g)',
      recommendedProduct: 'Mango Greek Yogurt (Seasonal)',
      lastPurchasedDate: '2023-05-14',
      phoneNumber: '+15551234003'
    },
    {
      id: 4,
      hotelName: 'Seaside Suites',
      managerName: 'Emma Green',
      lastPurchasedProduct: 'Classic Croissant (Pack of 6)',
      recommendedProduct: 'Almond Croissant (Pack of 6)',
      lastPurchasedDate: '2023-05-10',
      phoneNumber: '+15551234004'
    },
    {
      id: 5,
      hotelName: 'City Comforts',
      managerName: 'David Wilson',
      lastPurchasedProduct: 'Strawberry Jam (250g)',
      recommendedProduct: 'Raspberry Jam (250g)',
      lastPurchasedDate: '2023-05-05',
      phoneNumber: '+15551234005'
    },
    {
      id: 6,
      hotelName: 'Mountain Lodge',
      managerName: 'Rachel Brown',
      lastPurchasedProduct: 'Plain Cream Cheese (200g)',
      recommendedProduct: 'Chive Cream Cheese (200g)',
      lastPurchasedDate: '2023-05-07',
      phoneNumber: '+15551234006'
    },
    {
      id: 7,
      hotelName: 'Royal Stay',
      managerName: 'Alex Johnson',
      lastPurchasedProduct: 'Colombian Coffee Beans (500g)',
      recommendedProduct: 'Ethiopian Coffee Beans (500g) (Specialty)',
      lastPurchasedDate: '2023-05-08',
      phoneNumber: '+15551234007'
    },
    {
      id: 8,
      hotelName: 'Sunshine Resort',
      managerName: 'Mia Thompson',
      lastPurchasedProduct: 'Citrus Shampoo (250ml)',
      recommendedProduct: 'Tea Tree Shampoo (250ml)',
      lastPurchasedDate: '2023-05-09',
      phoneNumber: '+15551234008'
    },
    {
      id: 9,
      hotelName: 'Cozy Nest',
      managerName: 'Oliver Parker',
      lastPurchasedProduct: 'Basic Toothpaste (100g)',
      recommendedProduct: 'Whitening Toothpaste (100g)',
      lastPurchasedDate: '2023-05-10',
      phoneNumber: '+15551234009'
    },
    {
      id: 10,
      hotelName: 'Green Valley',
      managerName: 'Lucas Miller',
      lastPurchasedProduct: 'Blueberry Muffin (Pack of 4)',
      recommendedProduct: 'Chocolate Chip Muffin (Pack of 4)',
      lastPurchasedDate: '2023-05-11',
      phoneNumber: '+15551234010'
    }
  ]);

  const handleOutreach = (id) => {
    console.log(`Initiating outreach for prospect ID: ${id}`);
    
    // We need a phone number to proceed with outreach
    if (!userPhoneNumber) {
      alert('Please enter your phone number first to enable the outreach feature.');
      return false;
    }
    
    return true;
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>ArrayLink AI - Prospect Dashboard</title>
        <meta name="description" content="AI-powered sales automation tool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          ArrayLink AI - Prospect Dashboard
        </h1>

        <p className={styles.description}>
          Manage your sales prospects and automate outreach
        </p>
        
        <PhoneNumberInput 
          onPhoneSubmit={handlePhoneSubmit} 
          isPhoneSubmitted={isPhoneSubmitted} 
        />
        
        {isPhoneSubmitted && (
          <ProspectTable 
            prospects={prospects} 
            onOutreach={handleOutreach} 
            userPhoneNumber={userPhoneNumber} 
          />
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2023 ArrayLink AI - AI-powered sales automation</p>
      </footer>
    </div>
  );
} 