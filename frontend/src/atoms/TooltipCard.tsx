import { Box, useColorModeValue } from "@chakra-ui/react";

export interface NamedCount {
  name: string;
  count: number;
  total: number;
  currentPercentage: number;
  totalPercentage: number;
}

interface TooltipCardProps { 
  children: React.ReactNode;
}

export function TooltipCard(props: TooltipCardProps) {
  const tooltipBackroundColor = useColorModeValue("rgba(255,255,255,1)", "rgba(0,0,0,1)")
  return (
    <Box backgroundColor={tooltipBackroundColor} p={2} shadow="lg" rounded="md">
      {props.children}
    </Box>
  )
}