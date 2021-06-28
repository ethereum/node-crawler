import { mode } from '@chakra-ui/theme-tools';
import { extendTheme } from "@chakra-ui/react"


export const theme = extendTheme({
  global: (props: any) => ({
    body: {
      bg: mode('gray-800', 'blue')(props),
      color: mode('gray.100', '#141214')(props)
    }
  })
});