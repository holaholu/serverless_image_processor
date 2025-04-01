import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider, Box, Container, extendTheme } from '@chakra-ui/react';
import Home from './pages/Home';
import Gallery from './pages/Gallery';

// Theme configuration
const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'purple.600',
        color: 'white',
        minHeight: '100vh',
        margin: 0,
        padding: 0
      }
    }
  }
});

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Box
          minH="100vh"
          w="100%"
          bgGradient="linear(to-br, purple.800, blue.700)"
          py={8}
        >
          <Container maxW="container.lg">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/gallery" element={<Gallery />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;
