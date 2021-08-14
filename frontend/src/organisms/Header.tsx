import { Alert, AlertIcon, Button, Flex, Grid, GridItem, HStack, Spacer, Text} from "@chakra-ui/react";
import { useState } from "react";
import { VscClose } from "react-icons/vsc";
import { Logo } from "../atoms/Logo";
import { LayoutEightPadding } from "../config";
import { ColorModeSwitcher } from "./ColorModeSwitcher";

export function Note() {
  const [noteHidden, setNoteHidden] = useState(localStorage.getItem("noteHidden") === "true");

  const hideNote = () => {
    localStorage.setItem("noteHidden", "true");
    setNoteHidden(true);
  }

  if (noteHidden) {
    return null;
  }

  return (
  <Alert status="info" onClick={hideNote} mt={4}>
    <AlertIcon />
    This crawler only has a partial view of the Ethereum network. This is not a full count of every node on the network.
    <Spacer /><Button variant="ghost" iconSpacing={0} size="sm" leftIcon={<VscClose />} title="Remove note" />
  </Alert>
  )
}

export function Header() {
  return (
    <Grid templateColumns="repeat(2, 1fr)" pt={LayoutEightPadding} pl={LayoutEightPadding} pr={LayoutEightPadding} w="100%">
      <Flex direction={['column', 'row', 'row']} justifySelf="flex-start" fontSize={16} fontWeight={400}>
        <HStack>
          <Logo h="32px" pointerEvents="none" />
          <Text fontWeight="bold" fontSize="larger" whiteSpace="nowrap">Ethereum Nodes</Text>
        </HStack>
      </Flex>
      <ColorModeSwitcher justifySelf="flex-end" />
      <GridItem colSpan={2} >
        <Note />
      </GridItem>
    </Grid>
  )
}
