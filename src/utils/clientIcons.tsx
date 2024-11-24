import { IconType } from 'react-icons';
import { 
  FaStar, 
  FaCrown, 
  FaHeart, 
  FaBuilding, 
  FaBriefcase,
  FaBolt,
  FaHandHoldingHeart,
  FaHospital,
  FaTools,
  FaDove,
  FaUserTie,
  FaUsers,
  FaUserMd,
  FaIndustry,
  FaLightbulb,
  FaGem,
  FaHome,
  FaRegBuilding
} from 'react-icons/fa';

const clientIcons: Record<string, IconType> = {
  'Five Star Group': FaStar,
  'Royal Care Group': FaCrown,
  'Heart to Heart': FaHeart,
  'Empeon Group': FaBuilding,
  'Ahava Group': FaHandHoldingHeart,
  'BNV': FaBriefcase,
  'Future Care': FaBolt,
  'Hcs Group': FaHospital,
  'First Quality Electric': FaTools,
  'Bluebird Group': FaDove,
  'Priority Group': FaUserTie,
  'Staff Pro': FaUsers,
  'The W Group': FaUserMd,
  'Uder Group': FaIndustry,
  'Pbs Group': FaLightbulb,
  'Eas': FaGem,
  "Moisha's Group": FaHome,
  'HDA': FaRegBuilding
};

export function getClientIcon(clientName: string | null): IconType | null {
  if (!clientName) return null;
  return clientIcons[clientName] || FaBuilding; // Default to building icon
}
