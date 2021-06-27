import { ChakraProvider, ColorModeScript, CSSReset, theme } from '@chakra-ui/react';
import React from 'react';
import ReactDOM from 'react-dom';
import { DataProvider } from './data/DataContext';
import { Routing } from './templates/Routing';

ReactDOM.render(
  <React.StrictMode>
    <ColorModeScript />
    <ChakraProvider theme={theme}>
      <CSSReset />
      <DataProvider url={'/rest/clients'}>
        <Routing />
      </DataProvider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
