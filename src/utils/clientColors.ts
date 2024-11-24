// Client color mapping
const clientColors: Record<string, string> = {
  'Five Star Group': '#FED7AA',     // Orange
  'Empeon Group': '#BFDBFE',        // Blue
  'Royal Care Group': '#BBF7D0',    // Green
  'Heart to Heart': '#FECACA',      // Red
  'Ahava Group': '#DDD6FE',         // Purple
  'BNV': '#FDE68A',                 // Yellow
  'Future Care': '#99F6E4',         // Teal
  'Hcs Group': '#FBCFE8',           // Pink
  'First Quality Electric': '#e5d0bc', // Tan (keeping original)
  'Bluebird Group': '#93C5FD',      // Light Blue
  'Priority Group': '#C7D2FE',      // Indigo
  'Staff Pro': '#A5B4FC',           // Violet
  'The W Group': '#F9A8D4',         // Pink
  'Uder Group': '#FCA5A5',          // Light Red
  'Pbs Group': '#A7F3D0',           // Light Green
  'Eas': '#FDE047',                 // Yellow
  "Moisha's Group": '#FDA4AF',      // Rose
  'HDA': '#D8B4FE',                  // Purple
  'Form Admin': '#E2E8F0'           // Gray
};

// Function to get a deterministic color based on client name
function getColorForClient(clientName: string | null): string {
  if (!clientName) return '#E2E8F0'; // Default gray

  // Check if we have a predefined color
  if (clientColors[clientName]) {
    return clientColors[clientName];
  }

  // Generate a deterministic color based on the client name
  let hash = 0;
  for (let i = 0; i < clientName.length; i++) {
    hash = clientName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert to HSL to ensure good saturation and lightness
  const h = Math.abs(hash % 360);
  const s = 70; // Fixed saturation
  const l = 85; // Fixed lightness for pastel colors

  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function getClientColor(clientName: string | null): string {
  return getColorForClient(clientName);
}
