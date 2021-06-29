import { VStack } from "@chakra-ui/react";
import { Header } from "../organisms/Header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout(props: LayoutProps) {
  return (
    <VStack minH="100vh" align="flex-start" justify="flex-start">
      <Header />
      <VStack spacing={8} p={8} >
        {props.children}
      </VStack>
    </VStack>
  )
}