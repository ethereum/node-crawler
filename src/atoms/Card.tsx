import { Box, Flex, FlexOptions, forwardRef, Heading, HTMLChakraProps, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import * as CSS from "csstype";

interface CardProps extends HTMLChakraProps<"div">, FlexOptions  {
  title: string
  contentHeight?: CSS.Property.Height | number
}

export const Card = forwardRef<CardProps, 'div'>((props: CardProps, ref: React.ForwardedRef<any>) => {
  const color = useColorModeValue("gray.200", "gray.900")

  const {
    title,
    contentHeight,
    ...rest
  } = props

  return (
    <Flex direction="column" px="2" py="3" rounded="md" shadow="lg" bg={color} ref={ref} {...rest}>
      <Heading size="sm">{title}</Heading>
      <Box flex="1" mt="4" minHeight={contentHeight} height={contentHeight}>
        {props.children}
      </Box>
    </Flex>
  )
})