import { Grid, HStack, Link, Text} from "@chakra-ui/react";
import { Link as ReactLink } from "react-router-dom"
import { Logo } from "../atoms/Logo";
import { ColorModeSwitcher } from "./ColorModeSwitcher";

export function Header() {
  return (
    <Grid templateColumns="repeat(2, 1fr)" p="8" h="40px" w="100%">
      <HStack justifySelf="flex-start" fontSize={16} fontWeight={400}>
        <Logo h="32px" pointerEvents="none" />
        <Text fontWeight="bold" fontSize="larger" whiteSpace="nowrap">Ethereum Nodes</Text>
        <HStack pl={10} gridGap={4}>
          <Link as={ReactLink} to="/">Home</Link>
          <Link as={ReactLink} to="/london">London</Link>
        </HStack>
      </HStack>
      <ColorModeSwitcher justifySelf="flex-end" />
    </Grid>
  )
}