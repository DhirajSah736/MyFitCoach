import React from 'react';
import { Github, Linkedin, Globe } from 'lucide-react';

const DashboardFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center py-4 space-y-2 md:space-y-0 md:flex-row md:justify-between">
          <div className="text-gray-500 text-sm text-center md:text-left order-1">
            © 2025 MyFitCoach. All rights reserved.
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 md:ml-auto order-2 md:order-3">
            <div className="text-gray-500 text-sm text-center">
              Designed and developed by Dhiraj Sah
            </div>
            
            <div className="flex items-center justify-center space-x-3">
              <a 
                href="https://github.com/DhirajSah736" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <Github size={16} />
              </a>
              <a 
                href="https://www.linkedin.com/in/dhiraj-sah-tech/" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <Linkedin size={16} />
              </a>
              <a 
                href="https://www.dhirajsah99.com.np" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Personal Portfolio"
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <Globe size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;