import { ColorMode, Flex, FlexOptions, forwardRef, HTMLChakraProps, useColorMode } from "@chakra-ui/react";
import React from "react";

interface CardProps extends HTMLChakraProps<"div">, FlexOptions  {
}

export const Card = forwardRef<CardProps, 'div'>((props: CardProps, ref: React.ForwardedRef<any>) => {
    const { colorMode } = useColorMode()
   return (
     <Flex direction="column" px="2" py="3" rounded="md" shadow="lg"bg={colorMode === "dark" ? "gray.700" : "gray.300"} ref={ref} {...props}>
       {props.children}
    </Flex>
   )
})