import logo from '../assets/logo.png';

interface LogoProps {
  height?: string;
  className?: string;
}

export const Logo = ({ height = '50px', className = '' }: LogoProps) => {
  return (
    <img
      src={logo}
      alt="Practice Management - Improving Physician Revenue Since 1995"
      style={{ height, width: 'auto' }}
      className={className}
    />
  );
};
