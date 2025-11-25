import {
  Sword,
  Map,
  Shield,
  Volleyball,
  BrainCircuit,
  Gem,
  Puzzle,
  FolderOpen,
  Compass,
  Cpu,
  Target,
  LandPlot,
  Gamepad,
} from 'lucide-react';
import { JSX } from 'react';

export const getIcon = (input: string): JSX.Element => {
  switch (input.toLowerCase()) {
    case 'gamepad':
      return <Gamepad className="h-5 w-5 text-gray-400" />;
    case 'action':
      return <Sword className="h-5 w-5 text-red-400" />;
    case 'adventure':
      return <Map className="h-5 w-5 text-blue-400" />;
    case 'rpg':
      return <Shield className="h-5 w-5 text-purple-400" />;
    case 'sports':
      return <Volleyball className="h-5 w-5 text-green-400" />;
    case 'strategy':
      return <BrainCircuit className="h-5 w-5 text-yellow-400" />;
    case 'puzzle':
      return <Puzzle className="h-5 w-5 text-pink-400" />;
    case 'platformer':
      return <LandPlot className="h-5 w-5 text-green-400" />;
    case 'shooter':
      return <Target className="h-5 w-5 text-orange-400" />;
    case 'indie':
      return <Gem className="h-5 w-5 text-indigo-400" />;
    case 'developer':
      return <Cpu className="h-5 w-5 text-indigo-400" />;
    case 'genre':
      return <FolderOpen className="h-5 w-5 text-gray-400" />;
    case 'all':
      return <FolderOpen className="h-5 w-5 text-gray-400" />;
    default:
      return <Compass className="h-5 w-5 text-gray-400" />;
  }
};
