import { Box, Grid, VStack, Code, Link, Text } from "@chakra-ui/react";
import { Header } from "../organisms/Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout(props: LayoutProps) {
  return (
    <Grid minH="100vh">
      <Header />
      <VStack spacing={8} p={8} align="flex-start">
        {props.children}
      </VStack>
    </Grid>
  )
}