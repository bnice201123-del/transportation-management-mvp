import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

/**
 * Error Boundary Component
 * Catches rendering errors in child components and displays fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorCount={this.state.errorCount}
          onReset={this.handleReset}
          onReload={this.handleReload}
          fallback={this.props.fallback}
          fallbackMessage={this.props.fallbackMessage}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Fallback UI for errors
 */
const ErrorFallback = ({
  error,
  errorInfo,
  errorCount,
  onReset,
  onReload,
  fallback,
  fallbackMessage,
}) => {
  // Custom fallback provided by parent
  if (fallback) {
    return fallback({ error, reset: onReset, reload: onReload });
  }

  // Default error UI
  return (
    <Container maxW="container.md" centerContent py={10}>
      <VStack spacing={6} w="full">
        {/* Error Alert */}
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="flex-start"
          borderRadius="md"
        >
          <HStack spacing={3} mb={2}>
            <AlertIcon boxSize="25px" mt={0} />
            <AlertTitle fontSize="lg">Something went wrong</AlertTitle>
          </HStack>
          <AlertDescription fontSize="sm" ml={8}>
            {fallbackMessage || 'An error occurred while rendering this component.'}
          </AlertDescription>
        </Alert>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <Box
            w="full"
            p={4}
            bg="gray.100"
            borderRadius="md"
            borderLeft="4px solid red"
          >
            <Heading size="sm" mb={2} color="red.500">
              Error Details
            </Heading>
            <Code
              display="block"
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              fontSize="xs"
              p={3}
              bg="white"
              borderRadius="md"
              maxH="200px"
              overflowY="auto"
              mb={3}
            >
              {error.toString()}
            </Code>

            {errorInfo && (
              <>
                <Heading size="xs" mt={4} mb={2}>
                  Component Stack
                </Heading>
                <Code
                  display="block"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                  fontSize="xs"
                  p={3}
                  bg="white"
                  borderRadius="md"
                  maxH="150px"
                  overflowY="auto"
                >
                  {errorInfo.componentStack}
                </Code>
              </>
            )}

            <Text fontSize="xs" mt={3} color="gray.500">
              Error count: {errorCount}
            </Text>
          </Box>
        )}

        {/* Recovery Actions */}
        <HStack spacing={3} w="full" justify="center">
          <Button
            leftIcon={<RepeatIcon />}
            colorScheme="blue"
            onClick={onReset}
            size="lg"
            minH="44px"
          >
            Try Again
          </Button>
          <Button
            leftIcon={<RepeatIcon />}
            variant="outline"
            colorScheme="blue"
            onClick={onReload}
            size="lg"
            minH="44px"
          >
            Reload Page
          </Button>
        </HStack>

        {/* Help Text */}
        <VStack spacing={2} w="full" align="flex-start">
          <Text fontSize="sm" fontWeight="bold">
            What you can try:
          </Text>
          <Text fontSize="sm" color="gray.600">
            • Click "Try Again" to restart this component
          </Text>
          <Text fontSize="sm" color="gray.600">
            • Click "Reload Page" to refresh the entire application
          </Text>
          <Text fontSize="sm" color="gray.600">
            • Check your internet connection and try again
          </Text>
        </VStack>
      </VStack>
    </Container>
  );
};

export default ErrorBoundary;
export { ErrorFallback };