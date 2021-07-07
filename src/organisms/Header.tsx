import { Grid, HStack, Text} from "@chakra-ui/react";
import { Logo } from "../atoms/Logo";
import { ColorModeSwitcher } from "./ColorModeSwitcher";

export function Header() {
  return (
    <Grid templateColumns="repeat(2, 1fr)" p="4" h="40px" w="100%">
      <HStack justifySelf="flex-start" fontSize={16} fontWeight={400}>
        <Logo h="32px" pointerEvents="none" />
        <Text>Ethereum Nodes</Text>
      </HStack>
      <ColorModeSwitcher justifySelf="flex-end" />
    </Grid>
  )
}