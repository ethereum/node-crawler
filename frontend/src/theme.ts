import { mode } from '@chakra-ui/theme-tools';
import { extendTheme } from "@chakra-ui/react"


export const theme = extendTheme({
  styles: {
    global: (props: any) => ({
      body: {
        bg: mode('white', 'rgb(34, 34, 34)')(props),
        color: mode('rgb(51, 51, 51)', 'rgb(242, 242, 242)')(props)
      }
    })
  }
});