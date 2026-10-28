import { useState } from "react";

export const useMobileMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((wasOpen) => !wasOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return { isMenuOpen, toggleMenu, closeMenu };
};
