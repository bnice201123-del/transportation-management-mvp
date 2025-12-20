import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useBreakpointValue,
  Box
} from '@chakra-ui/react';

/**
 * ResponsiveModal Component
 * 
 * Wraps Modal to provide responsive behavior:
 * - Mobile: Fullscreen/drawer-like modal with bottom sheet style
 * - Tablet: 90% width with smooth corners
 * - Desktop: Standard modal with max-width
 * 
 * Props: Same as Chakra Modal, plus:
 *   - fullscreenOnMobile: bool (default true)
 *   - title: string
 */
export const ResponsiveModal = ({
  isOpen,
  onClose,
  children,
  title,
  fullscreenOnMobile = true,
  footer,
  size = "md",
  ...props
}) => {
  // Desktop modal size
  const desktopSize = useBreakpointValue({ base: "full", sm: "full", md: size });
  
  // Mobile modal properties
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Modal max width and placement
  const modalMaxW = useBreakpointValue({
    base: fullscreenOnMobile ? "100%" : "95%",
    sm: fullscreenOnMobile ? "100%" : "95%",
    md: "2xl"
  });

  const modalMaxH = useBreakpointValue({
    base: fullscreenOnMobile ? "100vh" : "95vh",
    sm: fullscreenOnMobile ? "100vh" : "95vh",
    md: "90vh"
  });

  const borderRadius = useBreakpointValue({
    base: fullscreenOnMobile ? "0" : "lg",
    sm: fullscreenOnMobile ? "0" : "lg",
    md: "lg"
  });

  const modalPosition = useBreakpointValue({
    base: fullscreenOnMobile ? "bottom" : "center",
    sm: fullscreenOnMobile ? "bottom" : "center",
    md: "center"
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={desktopSize}
      {...props}
    >
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent
        maxW={modalMaxW}
        maxH={modalMaxH}
        m={0}
        borderRadius={borderRadius}
        borderTopRadius={useBreakpointValue({
          base: fullscreenOnMobile ? "xl" : "lg",
          md: "lg"
        })}
      >
        <ModalHeader
          px={{ base: 4, sm: 6 }}
          py={{ base: 3, sm: 4 }}
          borderBottomWidth="1px"
          borderBottomColor="gray.200"
          fontSize={{ base: "lg", sm: "xl" }}
          fontWeight="700"
        >
          {title}
        </ModalHeader>

        <ModalCloseButton
          w={{ base: "44px", md: "auto" }}
          h={{ base: "44px", md: "auto" }}
          top={{ base: 3, md: 2 }}
          right={{ base: 3, md: 2 }}
        />

        <ModalBody
          px={{ base: 4, sm: 6 }}
          py={{ base: 4, sm: 6 }}
          overflowY="auto"
          maxH={useBreakpointValue({
            base: fullscreenOnMobile ? "calc(100vh - 160px)" : "calc(95vh - 160px)",
            md: "calc(90vh - 160px)"
          })}
        >
          {children}
        </ModalBody>

        {footer && (
          <ModalFooter
            px={{ base: 4, sm: 6 }}
            py={{ base: 3, sm: 4 }}
            borderTopWidth="1px"
            borderTopColor="gray.200"
            gap={{ base: 2, sm: 3 }}
            display="flex"
            flexDirection={{ base: "column-reverse", sm: "row" }}
          >
            {footer}
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};

/**
 * FullscreenModal Component - Legacy support
 * Use ResponsiveModal instead
 */
export const FullscreenModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  onCancel,
  isLoading = false,
  footer
}) => {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      fullscreenOnMobile={true}
      footer={footer}
    >
      {children}
    </ResponsiveModal>
  );
};

export default ResponsiveModal;
