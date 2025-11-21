import React from 'react';
import { Box, Heading, Text } from "@chakra-ui/react";

export const PageWrapper = ({ children, title, subtitle }) => (
  <Box minH="100vh" bg="bg.page" color="text.main" p={{ base: 4, md: 8 }}>
    {title && (
      <Heading mb={2} fontSize={{ base: "xl", md: "2xl" }}>
        {title}
      </Heading>
    )}
    {subtitle && (
      <Text mb={6} color="text.muted">
        {subtitle}
      </Text>
    )}
    {children}
  </Box>
);

export default PageWrapper;
