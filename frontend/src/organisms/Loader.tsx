import { Center, VStack, Text } from '@chakra-ui/react';
import React from 'react';
import { Logo } from '../atoms/Logo';

interface LoaderProps {
  children: React.ReactNode;
}

export function Loader(props: LoaderProps) {
  return (
    <Center position="fixed" top={0} left={0} right={0} bottom={0} color="brand.primaryText">
      <VStack>
        <Logo width={100} height={100}/>
        <Text>{props.children}</Text>
      </VStack>
    </Center>
  );
}