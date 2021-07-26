import { Box, forwardRef, Heading, HTMLChakraProps, useStyleConfig } from "@chakra-ui/react";
import React from "react";

interface CardProps extends HTMLChakraProps<"div">  {
  title: string
  contentHeight?: number
  variant?: string
}

export const Card = forwardRef<CardProps, 'div'>((props: CardProps, ref: React.ForwardedRef<any>) => {
  const {
    variant,
    title,
    contentHeight,
    ...rest
  } = props
  const styles = useStyleConfig("Card", { variant })

  return (
    <Box __css={styles} ref={ref} {...rest}>
      <Heading size="sm">{title}</Heading>
      <Box flex="1" mt="4" position="relative" minHeight={contentHeight + 'px'}>
        {props.children}
      </Box>
    </Box>
  )
})