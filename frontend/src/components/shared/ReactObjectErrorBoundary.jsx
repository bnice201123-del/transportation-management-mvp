import React from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Button, VStack, Code, Text } from '@chakra-ui/react';

class ReactObjectErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is the specific React object rendering error
    if (error.message && error.message.includes('Objects are not valid as a React child')) {
      return { hasError: true, error };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details for debugging
    console.error('React Object Error Boundary caught an error:', error, errorInfo);
    console.log('Component stack:', errorInfo.componentStack);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
          <Alert status="error" mb={4}>
            <AlertIcon />
            <VStack align="start" spacing={2} flex={1}>
              <AlertTitle>Object Rendering Error Detected!</AlertTitle>
              <AlertDescription>
                An object was rendered as React children. This usually happens when you try to render an object directly instead of accessing its properties.
              </AlertDescription>
              
              {this.state.error && (
                <VStack align="start" spacing={2} w="full">
                  <Text fontWeight="bold">Error Details:</Text>
                  <Code p={2} bg="red.100" fontSize="sm" w="full" whiteSpace="pre-wrap">
                    {this.state.error.message}
                  </Code>
                  
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <>
                      <Text fontWeight="bold" mt={2}>Component Stack:</Text>
                      <Code p={2} bg="red.100" fontSize="xs" w="full" whiteSpace="pre-wrap" maxH="200px" overflow="auto">
                        {this.state.errorInfo.componentStack}
                      </Code>
                    </>
                  )}
                </VStack>
              )}
              
              <Button 
                size="sm" 
                colorScheme="red" 
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                Reset Component
              </Button>
            </VStack>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ReactObjectErrorBoundary;