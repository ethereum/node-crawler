import { Box, Grid, VStack, Code, Link, Text } from "@chakra-ui/react";
import { Logo } from "../atoms/Logo";
import { ColorModeSwitcher } from "../organisms/ColorModeSwitcher";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout(props: LayoutProps) {
  return (
    <Box textAlign="center" fontSize="xl">
      <Grid minH="100vh" p={3}>
        <ColorModeSwitcher justifySelf="flex-end" />
        <VStack spacing={8}>
          <Logo h={200} pointerEvents="none" />
          {props.children}
        </VStack>
      </Grid>
    </Box>
  )
}