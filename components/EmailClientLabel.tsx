import React from 'react';

interface EmailClientLabelProps {
  clientName: string;
  color: string;
  onClick?: () => void;
}

export const EmailClientLabel: React.FC<EmailClientLabelProps> = ({ 
  clientName, 
  color,
  onClick 
}) => {
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80"
      style={{
        backgroundColor: color,
        color: getContrastColor(color),
      }}
    >
      {clientName}
    </span>
  );
};

// Helper function to determine text color based on background
function getContrastColor(hexcolor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexcolor.slice(1, 3), 16);
  const g = parseInt(hexcolor.slice(3, 5), 16);
  const b = parseInt(hexcolor.slice(5, 7), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
