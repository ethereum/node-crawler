import { mode } from "@chakra-ui/theme-tools"
import { extendTheme } from "@chakra-ui/react"


export const theme = extendTheme({
  styles: {
    global: (props: any) => ({
      body: {
        bg: mode('white', 'rgb(34, 34, 34)')(props),
        color: mode('rgb(51, 51, 51)', 'rgb(242, 242, 242)')(props)
      }
    })
  },
  components: {
    Card: {
      baseStyle: (props: any) => ({
        bg: mode('white', 'rgb(38, 38, 38)')(props),
        color: mode('rgb(51, 51, 51)', 'rgb(242, 242, 242)')(props),
        boxShadow: "rgb(0 0 0 / 7%) 0px 14px 66px, rgb(0 0 0 / 3%) 0px 10px 17px, rgb(0 0 0 / 5%) 0px 4px 7px;",
        display: "flex",
        flexDirection: "column",
        px: "2",
        py: "3",
        rounded: "md",
        h: "100%",
      })
    },
    TablePlus: {
      baseStyle: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        whiteSpace: 'nowrap'
      },
    },
    ThPlus: {
      variants: {
        sticky: (props: any) => ({
          position: "sticky",
          top: "-12px",
          bg: mode('white', 'rgb(38, 38, 38)')(props),
          color: mode('rgb(51, 51, 51)', 'rgb(242, 242, 242)')(props),
          zIndex: 5,
          borderColor: mode('rgb(240, 240, 240)', 'rgb(34, 34, 34)')(props),
        })
      },
      defaultProps: {
        variant: "sticky",
      },
    },
    TdPlus: {
      variants: {
        sticky: (props: any) => ({
          borderColor: mode('rgb(240, 240, 240)', 'rgb(34, 34, 34)')(props),
        })
      },
      defaultProps: {
        variant: "sticky",
      },
    }
  }
})
