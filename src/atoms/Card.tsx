import { Flex, FlexOptions, forwardRef, HTMLChakraProps, useColorModeValue } from "@chakra-ui/react";
import React from "react";

interface CardProps extends HTMLChakraProps<"div">, FlexOptions  {
}

export const Card = forwardRef<CardProps, 'div'>((props: CardProps, ref: React.ForwardedRef<any>) => {
    const color = useColorModeValue("gray.200", "gray.900")
   return (
     <Flex direction="column" px="2" py="3" rounded="md" shadow="lg" bg={color} ref={ref} {...props}>
       {props.children}
    </Flex>
   )
})