import { Flex, HStack, Icon, Link, Text } from "@chakra-ui/react";
import { VscChromeMinimize, VscGithub } from "react-icons/vsc";

export function Footer() {
  return (
    <Flex width="100%" justify="center" align="center">
      <HStack>
        <Link href="https://github.com/ethereum/node-crawler">
          <HStack>
            <Icon as={VscGithub} title="View source code on GitHub" />
            <Text>contribute</Text>
          </HStack>
        </Link>
        <Link href="https://ethereum.org">
          <HStack>
            <Icon as={VscChromeMinimize} title="View source code on GitHub" />
            <Text>ethereum.org</Text>
          </HStack>
        </Link>
      </HStack>
    </Flex>
  )
}