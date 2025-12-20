import React from 'react';
import {
  Box,
  Container,
  Stack,
  VStack,
  HStack,
  Text,
  Link,
  Divider,
  IconButton,
  useColorModeValue,
  SimpleGrid,
  Heading,
  Badge,
  Flex,
  Spacer
} from '@chakra-ui/react';
import {
  EmailIcon,
  PhoneIcon,
  InfoIcon,
  ExternalLinkIcon,
  SettingsIcon,
  QuestionIcon,
  LockIcon
} from '@chakra-ui/icons';
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaGithub,
  FaMapMarkerAlt,
  FaCar,
  FaRoute,
  FaUsers,
  FaClock,
  FaShieldAlt,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaHeart
} from 'react-icons/fa';

const Footer = () => {
  const bg = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  const linkColor = useColorModeValue('blue.600', 'blue.400');

  const currentYear = new Date().getFullYear();

  return (
    <Box bg={bg} borderTop="1px" borderColor={borderColor} mt="auto">
      {/* Main Footer Content */}
      <Container maxW="container.xl" py={8}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          
          {/* Company Information */}
          <VStack align="start" spacing={4}>
            <Heading size="md" color={headingColor}>
              Transportation Management
            </Heading>
            <Text fontSize="sm" color={textColor}>
              Comprehensive transportation management solution for efficient 
              scheduling, routing, and fleet management.
            </Text>
            
            <VStack align="start" spacing={2}>
              <HStack>
                <FaMapMarkerAlt color={linkColor} />
                <Text fontSize="sm" color={textColor}>
                  123 Transport Ave, City, State 12345
                </Text>
              </HStack>
              <HStack>
                <FaPhone color={linkColor} />
                <Text fontSize="sm" color={textColor}>
                  (555) 123-RIDE (7433)
                </Text>
              </HStack>
              <HStack>
                <FaEnvelope color={linkColor} />
                <Link href="mailto:support@transportmgmt.com" color={linkColor} fontSize="sm">
                  support@transportmgmt.com
                </Link>
              </HStack>
            </VStack>
          </VStack>

          {/* Quick Links */}
          <VStack align="start" spacing={4}>
            <Heading size="sm" color={headingColor}>
              Quick Links
            </Heading>
            <VStack align="start" spacing={2}>
              <Link href="/scheduler" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <FaRoute size={12} />
                  <Text>Schedule Management</Text>
                </HStack>
              </Link>
              <Link href="/dispatcher" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <FaClock size={12} />
                  <Text>Dispatch Center</Text>
                </HStack>
              </Link>
              <Link href="/riders" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <FaUsers size={12} />
                  <Text>Riders Management</Text>
                </HStack>
              </Link>
              <Link href="/vehicles" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <FaCar size={12} />
                  <Text>Fleet Management</Text>
                </HStack>
              </Link>
              <Link href="/admin/analytics" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <InfoIcon boxSize={3} />
                  <Text>Analytics & Reports</Text>
                </HStack>
              </Link>
            </VStack>
          </VStack>

          {/* Support & Resources */}
          <VStack align="start" spacing={4}>
            <Heading size="sm" color={headingColor}>
              Support & Resources
            </Heading>
            <VStack align="start" spacing={2}>
              <Link href="/help" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <QuestionIcon boxSize={3} />
                  <Text>Help Center</Text>
                </HStack>
              </Link>
              <Link href="/documentation" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <InfoIcon boxSize={3} />
                  <Text>Documentation</Text>
                </HStack>
              </Link>
              <Link href="/contact" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <PhoneIcon boxSize={3} />
                  <Text>Contact Support</Text>
                </HStack>
              </Link>
              <Link href="/training" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <ExternalLinkIcon boxSize={3} />
                  <Text>Training Resources</Text>
                </HStack>
              </Link>
              <Link href="/api-docs" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <SettingsIcon boxSize={3} />
                  <Text>API Documentation</Text>
                </HStack>
              </Link>
            </VStack>
          </VStack>

          {/* System Status & Security */}
          <VStack align="start" spacing={4}>
            <Heading size="sm" color={headingColor}>
              System & Security
            </Heading>
            <VStack align="start" spacing={2}>
              <HStack spacing={2}>
                <Badge colorScheme="green" size="sm">Online</Badge>
                <Text fontSize="sm" color={textColor}>System Status</Text>
              </HStack>
              
              <Link href="/privacy" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <LockIcon boxSize={3} />
                  <Text>Privacy Policy</Text>
                </HStack>
              </Link>
              <Link href="/terms" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <InfoIcon boxSize={3} />
                  <Text>Terms of Service</Text>
                </HStack>
              </Link>
              <Link href="/security" color={linkColor} fontSize="sm" _hover={{ textDecoration: 'underline' }}>
                <HStack spacing={2}>
                  <FaShieldAlt size={12} />
                  <Text>Security Center</Text>
                </HStack>
              </Link>
              
              <VStack align="start" spacing={1} pt={2}>
                <Text fontSize="xs" color={textColor}>
                  🔒 SSL Secured
                </Text>
                <Text fontSize="xs" color={textColor}>
                  📊 99.9% Uptime
                </Text>
                <Text fontSize="xs" color={textColor}>
                  🛡️ SOC 2 Compliant
                </Text>
              </VStack>
            </VStack>
          </VStack>
        </SimpleGrid>

        {/* Social Media & Additional Info */}
        <Divider my={6} />
        
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4} align="center">
          <VStack align="start" spacing={2}>
            <Text fontSize="sm" color={headingColor} fontWeight="medium">
              Connect With Us
            </Text>
            <HStack spacing={3}>
              <IconButton
                as="a"
                href="https://facebook.com"
                aria-label="Facebook"
                icon={<FaFacebook />}
                size="sm"
                variant="ghost"
                color={linkColor}
                _hover={{ bg: 'blue.50' }}
              />
              <IconButton
                as="a"
                href="https://twitter.com"
                aria-label="Twitter"
                icon={<FaTwitter />}
                size="sm"
                variant="ghost"
                color={linkColor}
                _hover={{ bg: 'blue.50' }}
              />
              <IconButton
                as="a"
                href="https://linkedin.com"
                aria-label="LinkedIn"
                icon={<FaLinkedin />}
                size="sm"
                variant="ghost"
                color={linkColor}
                _hover={{ bg: 'blue.50' }}
              />
              <IconButton
                as="a"
                href="https://instagram.com"
                aria-label="Instagram"
                icon={<FaInstagram />}
                size="sm"
                variant="ghost"
                color={linkColor}
                _hover={{ bg: 'blue.50' }}
              />
              <IconButton
                as="a"
                href="https://github.com"
                aria-label="GitHub"
                icon={<FaGithub />}
                size="sm"
                variant="ghost"
                color={linkColor}
                _hover={{ bg: 'gray.50' }}
              />
            </HStack>
          </VStack>

          <Spacer />

          <VStack align={{ base: 'center', md: 'start' }} spacing={{ base: 3, md: 2 }}>
            <HStack spacing={{ base: 2, md: 4 }} fontSize={{ base: "xs", md: "sm" }} color={textColor} flexWrap="wrap" justify="center">
              <Text fontWeight="medium">Available 24/7</Text>
              <Text>•</Text>
              <Link href="tel:(555)911-4357" color="blue.500" _hover={{ textDecoration: 'underline' }}>
                Emergency Support: (555) 911-HELP
              </Link>
            </HStack>
            <Text fontSize={{ base: "xs", md: "sm" }} color={textColor}>
              Serving communities since 2020
            </Text>
          </VStack>

          <Spacer />

          {/* Right section - Empty on mobile, visible on desktop */}
          <VStack display={{ base: 'none', md: 'flex' }} align="end" spacing={2}>
            {/* This can be populated with additional info */}
          </VStack>
        </Stack>
      </Container>

      {/* Bottom Copyright Bar */}
      <Box bg={useColorModeValue('gray.100', 'gray.800')} py={{ base: 3, md: 4 }}>
        <Container maxW="container.xl" px={{ base: 3, md: 4 }}>
          <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'center' }} gap={{ base: 3, md: 4 }} justify="space-between">
            <Text fontSize={{ base: "xs", md: "sm" }} color={textColor} textAlign={{ base: 'center', md: 'left' }}>
              © {currentYear} Transportation Management System. All rights reserved.
            </Text>
            
            <HStack spacing={{ base: 2, md: 4 }} fontSize={{ base: "xs", md: "sm" }} flexWrap="wrap" justify={{ base: 'center', md: 'flex-end' }}>
              <Link href="/sitemap" color={linkColor} _hover={{ textDecoration: 'underline' }}>
                Sitemap
              </Link>
              <Text color={textColor} display={{ base: 'inline', md: 'inline' }}>•</Text>
              <Link href="/accessibility" color={linkColor} _hover={{ textDecoration: 'underline' }}>
                Accessibility
              </Link>
              <Text color={textColor} display={{ base: 'inline', md: 'inline' }}>•</Text>
              <Text color={textColor} whiteSpace="nowrap">
                Made with <Box as={FaHeart} display="inline" color="red.400" /> for better transportation
              </Text>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;