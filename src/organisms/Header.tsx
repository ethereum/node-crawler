import { Flex, Grid, HStack, Link, Text} from "@chakra-ui/react";
import { Link as ReactLink } from "react-router-dom"
import { Logo } from "../atoms/Logo";
import { LayoutEightPadding } from "../config";
import { ColorModeSwitcher } from "./ColorModeSwitcher";

export function Header() {
  return (
    <Grid templateColumns="repeat(2, 1fr)" pt={LayoutEightPadding} pl={LayoutEightPadding} pr={LayoutEightPadding} w="100%">
      <Flex direction={['column', 'row', 'row']} justifySelf="flex-start" fontSize={16} fontWeight={400}>
        <HStack>
          <Logo h="32px" pointerEvents="none" />
          <Text fontWeight="bold" fontSize="larger" whiteSpace="nowrap">Ethereum Nodes</Text>
        </HStack>
        <HStack pl={10} gridGap={4}>
          <Link as={ReactLink} to="/">Home</Link>
          <Link as={ReactLink} to="/london">London</Link>
        </HStack>
      </Flex>
      <ColorModeSwitcher justifySelf="flex-end" />
    </Grid>
  )
}