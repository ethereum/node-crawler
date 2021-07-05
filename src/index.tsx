import { ChakraProvider, ColorModeScript, CSSReset } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { Routing } from './templates/Routing';
import { theme } from './theme'

ReactDOM.render(
  <React.StrictMode>
    <ColorModeScript />
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Routing />
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
