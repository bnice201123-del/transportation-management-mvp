import React from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Button } from '@chakra-ui/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box p={8} maxW="container.md" mx="auto">
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Something went wrong!</AlertTitle>
              <AlertDescription mt={2}>
                {this.props.fallbackMessage || "An unexpected error occurred in this component."}
              </AlertDescription>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box mt={4} p={4} bg="gray.100" borderRadius="md" fontSize="sm">
                  <strong>Error:</strong> {this.state.error.toString()}
                  <br />
                  <strong>Component Stack:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '8px' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                </Box>
              )}
              <Button 
                mt={4} 
                colorScheme="red" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </Box>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;