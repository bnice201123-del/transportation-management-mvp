import React from 'react';
import { Link } from "@chakra-ui/react";

export const BrandedLink = ({ 
  children, 
  href, 
  onClick,
  isExternal = false,
  ...props 
}) => (
  <Link 
    color="brand.500" 
    _hover={{ 
      color: "brand.600", 
      textDecoration: "underline" 
    }}
    href={href}
    onClick={onClick}
    isExternal={isExternal}
    fontWeight="medium"
    {...props}
  >
    {children || "View trip details"}
  </Link>
);

export default BrandedLink;
