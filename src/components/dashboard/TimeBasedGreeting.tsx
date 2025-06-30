import React, { useState, useEffect } from 'react';

const TimeBasedGreeting: React.FC = () => {
  const [greeting, setGreeting] = useState('');
  const [motivationalMessage, setMotivationalMessage] = useState('');
  
  // Time-specific motivational messages
  const morningMessages = [
    "Start fresh and strong",
    "Seize the morning energy",
    "Begin with intention",
    "Morning momentum builds champions",
    "First workout sets the tone"
  ];
  
  const afternoonMessages = [
    "Keep the momentum going",
    "Push through the afternoon",
    "Stay focused on your goals",
    "Refuel and recharge",
    "Afternoon effort, evening results"
  ];
  
  const eveningMessages = [
    "Finish the day strong",
    "Evening excellence awaits",
    "One more rep before rest",
    "End on a high note",
    "Tonight's effort, tomorrow's strength"
  ];
  
  useEffect(() => {
    // Set the initial greeting and message
    updateTimeBasedContent();
    
    // Update greeting every minute
    const intervalId = setInterval(updateTimeBasedContent, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const updateTimeBasedContent = () => {
    const currentHour = new Date().getHours();
    let messageArray;
    
    // Set greeting and select appropriate message array based on time
    if (currentHour >= 5 && currentHour < 12) {
      setGreeting('Good Morning');
      messageArray = morningMessages;
    } else if (currentHour >= 12 && currentHour < 17) {
      setGreeting('Good Afternoon');
      messageArray = afternoonMessages;
    } else {
      setGreeting('Good Evening');
      messageArray = eveningMessages;
    }
    
    // Select a random message from the appropriate array
    const randomIndex = Math.floor(Math.random() * messageArray.length);
    setMotivationalMessage(messageArray[randomIndex]);
  };
  
  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold text-gray-900 truncate">
        {greeting}!
      </h1>
      <p className="text-sm text-gray-500 line-clamp-2 sm:line-clamp-1">
        {motivationalMessage}
      </p>
    </div>
  );
};

export default TimeBasedGreeting;